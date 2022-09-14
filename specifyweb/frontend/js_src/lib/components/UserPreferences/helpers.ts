/**
 * Utilities for dealing with user preferences
 */

import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { MILLISECONDS } from '../Atoms/Internationalization';
import type { Preferences } from './Definitions';
import { preferenceDefinitions } from './Definitions';
import { prefEvents } from './Hooks';
import { f } from '../../utils/functools';
import { keysToLowerCase, replaceKey } from '../../utils/utils';
import {
  cachableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { mergeParsers, parserFromType } from '../../utils/parser/definitions';
import { fail } from '../Errors/Crash';
import { parseValue } from '../../utils/parser/parse';
import { Http } from '../../utils/ajax/definitions';

export function getPrefDefinition<
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM] {
  const definition =
    // @ts-expect-error
    preferenceDefinitions[category].subCategories[subcategory].items[item];
  const defaultValue = defaultPreferences[category]?.[subcategory]?.[item];
  return defaultValue === undefined
    ? definition
    : replaceKey(definition, 'defaultValue', defaultValue);
}

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
  readonly [CATEGORY in keyof Preferences]?: {
    readonly [SUBCATEGORY in keyof Preferences[CATEGORY]['subCategories']]?: {
      readonly [ITEM in keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']]?: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'];
    };
  };
} = getCache('userPreferences', 'cached') ?? {};
export type UserPreferences = typeof preferences;
export const getRawUserPreferences = () => preferences;

export const setPrefsGenerator = (
  getPreferences: () => UserPreferences,
  triggerSync: boolean
) =>
  function setPref<
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
      if (definition.values.some((item) => item.value === value))
        parsed = value;
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

    const prefs = getPreferences() as any;
    if (
      parsed ===
      (prefs[category]?.[subcategory]?.[item] ?? definition.defaultValue)
    )
      return;

    prefs[category] ??= {};
    prefs[category][subcategory] ??= {};
    prefs[category][subcategory][item] = parsed;

    if (triggerSync) {
      /*
       * Unset default values
       * This reduces the size of the downloaded file, but mainly, it allows for
       * future Specify 7 versions to change the default value.
       */
      if (parsed === definition.defaultValue) {
        prefs[category][subcategory][item] = undefined;
        // Clean up empty objects
        if (
          filterArray(Object.values(prefs[category][subcategory])).length === 0
        )
          prefs[category][subcategory] = undefined;
        if (filterArray(Object.values(prefs[category])).length === 0)
          prefs[category] = undefined;
      }

      commitToCache();
      requestPreferencesSync();
    }
    prefEvents.trigger('update', definition);
  };
export const setPref = setPrefsGenerator(getRawUserPreferences, true);

// Sync with back-end at most every 5s
const syncTimeout = 5 * MILLISECONDS;
let syncTimeoutInstance: ReturnType<typeof setTimeout> | undefined = undefined;
let isSyncPending = false;
let isSyncing = false;

export async function awaitPrefsSynced(): Promise<void> {
  if (typeof syncTimeoutInstance === 'number') {
    globalThis.clearTimeout(syncTimeoutInstance);
    syncTimeoutInstance = undefined;
    return syncPreferences();
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
      globalThis.clearTimeout(syncTimeoutInstance);
    syncTimeoutInstance = globalThis.setTimeout(
      (): void => void syncPreferences().catch(fail),
      syncTimeout
    );
  }
}

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
    if (isSyncPending) syncPreferences().catch(fail);
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
  getCache('userPreferences', 'defaultCached') ?? {};

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
            items: ajax<RA<UserResource>>(
              cachableUrl('/context/user_resource/'),
              {
                headers: { Accept: 'application/json' },
              }
            )
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
                      cachableUrl(`/context/user_resource/${appResourceId}/`),
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
            initializePreferences(items);
            return items;
          })
      : foreverFetch<ResourceWithData>()
);

function initializePreferences(resource: ResourceWithData): ResourceWithData {
  userResource = resource;
  preferences = JSON.parse(userResource.data ?? '{}');
  prefEvents.trigger('update', undefined);
  commitToCache();
  setCache('userPreferences', 'defaultCached', defaultPreferences);

  registerChangeListener();
  return userResource;
}

const commitToCache = (): void =>
  // Need to create a shallow copy of the resource since it can get mutated
  void setCache('userPreferences', 'cached', { ...preferences });

/** Listen for changes to preferences in another tab */
const registerChangeListener = (): void =>
  void cacheEvents.on('change', ({ category, key }) => {
    if (category !== 'userPreferences') return;
    if (key === 'cached')
      preferences = getCache('userPreferences', 'cached') ?? preferences;
    else if (key === 'defaultCached')
      defaultPreferences =
        getCache('userPreferences', 'defaultCached') ?? defaultPreferences;
    prefEvents.trigger('update', undefined);
  });
