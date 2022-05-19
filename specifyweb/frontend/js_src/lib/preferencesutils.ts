/**
 * Utilities for dealing with user preferences
 */

import { ajax, Http, ping } from './ajax';
import { getCache, setCache } from './cache';
import { crash } from './components/errorboundary';
import { MILLISECONDS } from './components/internationalization';
import type { Preferences } from './components/preferences';
import { preferenceDefinitions } from './components/preferences';
import { prefEvents } from './components/preferenceshooks';
import { f } from './functools';
import { keysToLowerCase, replaceKey } from './helpers';
import { contextUnlockedPromise, foreverFetch } from './initialcontext';
import { formatUrl } from './querystring';
import type { RA } from './types';
import { filterArray } from './types';
import { mergeParsers, parserFromType, parseValue } from './uiparse';

export const getPrefDefinition = <
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM] =>
  f.var(
    // @ts-expect-error
    preferenceDefinitions[category].subCategories[subcategory].items[item],
    (definition) =>
      f.var(
        defaultPreferences[category]?.[subcategory]?.[item],
        (defaultValue) =>
          typeof defaultValue === 'undefined'
            ? definition
            : replaceKey(definition, 'defaultValue', defaultValue)
      )
  );

/** Use usePref hook instead whenever possible as it comes with live updates */
export const getUserPref = <
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'] =>
  preferences[category]?.[subcategory]?.[item] ??
  defaultPreferences[category]?.[subcategory]?.[item] ??
  getPrefDefinition(category, subcategory, item).defaultValue;

let preferences: {
  [CATEGORY in keyof Preferences]?: {
    [SUBCATEGORY in keyof Preferences[CATEGORY]['subCategories']]?: {
      [ITEM in keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']]?: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'];
    };
  };
} =
  process.env.NODE_ENV === 'test'
    ? {}
    : getCache('userPreferences', 'cached', { defaultValue: {} });
export type UserPreferences = typeof preferences;
export const getRawUserPreferences = () => preferences;

export function setPref<
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM,
  value: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
): void {
  const definition = getPrefDefinition(category, subcategory, item);

  let parsed;
  if ('type' in definition) {
    const baseParser = parserFromType(definition.type);
    const parser =
      typeof definition.parser === 'object'
        ? mergeParsers(baseParser, definition.parser)
        : baseParser;
    const parseResult = parseValue(parser, undefined, value?.toString());
    if (parseResult.isValid) parsed = parseResult.parsed;
    else {
      console.error(`Failed parsing pref value`, {
        category,
        subcategory,
        item,
        definition,
        parseResult,
      });
      parsed = definition.defaultValue;
    }
  } else if ('values' in definition) {
    if (definition.values.some((item) => item.value === value)) parsed = value;
    else {
      console.error(`Failed parsing pref value`, {
        category,
        subcategory,
        item,
        value,
        definition,
      });
      parsed = definition.defaultValue;
    }
  } else parsed = value;

  const prefs = preferences as any;
  if (
    parsed === prefs[category]?.[subcategory]?.[item] ??
    definition.defaultValue
  )
    return;

  prefs[category] ??= {};
  prefs[category][subcategory] ??= {};
  prefs[category][subcategory][item] = parsed;

  /*
   * Unset default values
   * This reduces the size of the downloaded file, but mainly, it allows for
   * future Specify 7 versions to change the default value.
   */
  if (parsed === definition.defaultValue) {
    prefs[category][subcategory][item] = undefined;
    // Clean up empty objects
    if (filterArray(Object.values(prefs[category][subcategory])).length === 0)
      prefs[category][subcategory] = undefined;
    if (filterArray(Object.values(prefs[category])).length === 0)
      prefs[category] = undefined;
  }

  prefEvents.trigger('update', definition);
  if (process.env.NODE_ENV !== 'test')
    setCache('userPreferences', 'cached', preferences);
  requestPreferencesSync();
}

// Sync at most every 5s
const syncTimeout = 5 * MILLISECONDS;
let syncTimeoutInstance: ReturnType<typeof setTimeout> | undefined = undefined;
let isSyncPending = false;
let isSyncing = false;

export async function awaitPrefsSynced(): Promise<void> {
  if (typeof syncTimeoutInstance === 'number') {
    clearTimeout(syncTimeoutInstance);
    syncPreferences().catch(crash);
  }

  return isSyncing
    ? new Promise((resolve) => {
        const destructor = prefEvents.on('synchronized', () => {
          destructor();
          resolve();
        });
      })
    : Promise.resolve();
}

/** Update back-end with front-end changes in a throttled manner */
function requestPreferencesSync(): void {
  if (isSyncing) isSyncPending = true;
  else {
    if (typeof syncTimeoutInstance === 'number')
      clearTimeout(syncTimeoutInstance);
    syncTimeoutInstance = setTimeout(
      (): void => void syncPreferences().catch(crash),
      syncTimeout
    );
  }
}

// TODO: if prefs where updated by a different tab, this would overwrite them
async function syncPreferences(): Promise<void> {
  await preferencesPromise;
  isSyncPending = false;
  return ping(
    `/context/user_resource/${userResource.id}/`,
    {
      method: 'PUT',
      body: keysToLowerCase({
        name: resourceName,
        mimeType: 'application/json',
        metaData: '',
        data: JSON.stringify(preferences),
      }),
    },
    {
      expectedResponseCodes: [Http.NO_CONTENT],
    }
  ).then(() => {
    // If there were additional changes while syncing
    if (isSyncPending) syncPreferences().catch(crash);
    else {
      isSyncing = false;
      prefEvents.trigger('synchronized');
    }
  });
}

const resourceName = 'UserPreferences';
const defaultResourceName = 'DefaultUserPreferences';
const mimeType = 'application/json';

let userResource: ResourceWithData = undefined!;
let defaultPreferences: UserPreferences =
  process.env.NODE_ENV === 'test'
    ? {}
    : getCache('userPreferences', 'defaultCached', { defaultValue: {} });

function updatePreferences(resource: ResourceWithData): ResourceWithData {
  userResource = resource;
  preferences = JSON.parse(userResource.data ?? '{}');
  prefEvents.trigger('update', undefined);
  if (process.env.NODE_ENV !== 'test') {
    setCache('userPreferences', 'cached', preferences);
    setCache('userPreferences', 'defaultCached', defaultPreferences);
  }
  return userResource;
}

type UserResource = {
  readonly id: number;
  readonly metadata: string | null;
  readonly name: string;
  readonly mimetype: string | null;
};
type ResourceWithData = UserResource & {
  readonly data: string;
};

/**
 * Fetch app resource that stores current user preferences
 *
 * If app resourcee data with user preferences does not exists does not exist,
 * check if SpAppResourceDir and SpAppResource exist and create them if needed,
 * then, create the app resource data itself
 */
export const preferencesPromise = contextUnlockedPromise.then(
  async (entrypoint) =>
    entrypoint === 'main'
      ? f
          .all({
            items: ajax<RA<UserResource>>('/context/user_resource/', {
              headers: { Accept: 'application/json' },
            })
              .then(
                ({ data }) =>
                  data.find(
                    ({ name, mimetype }) =>
                      name === resourceName && mimetype === 'application/json'
                  )?.id
              )
              .then(async (appResourceId) =>
                (typeof appResourceId === 'number'
                  ? ajax<ResourceWithData>(
                      `/context/user_resource/${appResourceId}/`,
                      {
                        headers: { Accept: 'application/json' },
                      }
                    )
                  : ajax<ResourceWithData>(
                      '/context/user_resource/',
                      {
                        headers: { Accept: 'application/json' },
                        method: 'POST',
                        body: keysToLowerCase({
                          name: resourceName,
                          mimeType,
                          metaData: '',
                          data: '{}',
                        }),
                      },
                      { expectedResponseCodes: [Http.CREATED] }
                    )
                ).then(({ data }) => data)
              ),
            defaultItems: ajax(
              formatUrl('/context/app.resource', { name: defaultResourceName }),
              {
                headers: { Accept: 'text/plain' },
              },
              {
                expectedResponseCodes: [Http.NOT_FOUND, Http.OK],
                strict: false,
              }
            )
              .then(({ data, status }) =>
                status === Http.OK ? JSON.parse(data) : {}
              )
              .catch((error) => {
                console.error(error);
                return {};
              }),
          })
          .then(({ items, defaultItems }) => {
            defaultPreferences = defaultItems;
            updatePreferences(items);
            return items;
          })
      : foreverFetch<ResourceWithData>()
);
