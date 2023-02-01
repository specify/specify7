/**
 * Utilities for dealing with user preferences
 */

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { f } from '../../utils/functools';
import { mergeParsers, parserFromType } from '../../utils/parser/definitions';
import { parseValue } from '../../utils/parser/parse';
import type { IR, RR } from '../../utils/types';
import { filterArray, setDevelopmentGlobal } from '../../utils/types';
import { keysToLowerCase, replaceKey } from '../../utils/utils';
import { MILLISECONDS } from '../Atoms/Internationalization';
import { fail } from '../Errors/Crash';
import { contextUnlockedPromise, foreverFetch } from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { prefEvents } from './Hooks';
import { preferencesPromiseGenerator } from './preferencesFetch';
import type { GenericPreferences } from './UserDefinitions';
import { userPreferenceDefinitions } from './UserDefinitions';

const definitions = {
  user: userPreferenceDefinitions,
  collection: collectionPreferenceDefinitions,
} as const;

type Definitions = typeof definitions;

type PreferenceType = keyof typeof definitions;

export const getPrefDefinitionGenerator =
  <TYPE extends PreferenceType, DEFINITIONS extends GenericPreferences>(
    type: TYPE,
    definitions: DEFINITIONS
  ) =>
  <
    CATEGORY extends string & keyof DEFINITIONS,
    SUBCATEGORY extends CATEGORY extends keyof DEFINITIONS
      ? string & keyof DEFINITIONS[CATEGORY]['subCategories']
      : never,
    ITEM extends string &
      keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ): DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM] => {
    const definition =
      definitions[category].subCategories[subcategory].items[item];

    const defaultValue =
      defaultPreferences[type][category]?.[subcategory]?.[item];
    const resolvedDefinition =
      defaultValue === undefined
        ? definition
        : replaceKey(definition, 'defaultValue', defaultValue);
    return resolvedDefinition as DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM];
  };

export const getPrefDefinition = {
  user: getPrefDefinitionGenerator('user', definitions.user),
  collection: getPrefDefinitionGenerator('collection', definitions.collection),
};

/* eslint-disable functional/prefer-readonly-type */
type MakePartialPreferences<DEFINITIONS extends GenericPreferences> = {
  [CATEGORY in string & keyof DEFINITIONS]?: {
    [SUBCATEGORY in string & keyof DEFINITIONS[CATEGORY]['subCategories']]?: {
      [ITEM in string &
        keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']]?: DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'];
    };
  };
};

export type PreferenceValues = {
  user: MakePartialPreferences<
    GenericPreferences & typeof userPreferenceDefinitions
  >;
  collection: MakePartialPreferences<
    GenericPreferences & typeof collectionPreferenceDefinitions
  >;
};
/* eslint-enable functional/prefer-readonly-type */

export const rawPreferences: PreferenceValues = {
  user: getCache('userPreferences', 'cached') ?? {},
  collection: getCache('collectionPreferences', 'cached') ?? {},
};

const resourceNames = {
  user: 'UserPreferences',
  collection: 'CollectionPreferences',
};

const resourceId: RR<PreferenceType, undefined | number> = {
  user: undefined,
  collection: undefined,
};

const url = {
  user: '/context/user_resource/',
  collection: '/context/collection_resource/',
};

export const getPrefGenerator =
  <TYPE extends PreferenceType, PREFERENCES extends PreferenceValues[TYPE]>(
    preference: PREFERENCES,
    type: TYPE
  ) =>
  <
    CATEGORY extends string & keyof PREFERENCES,
    SUBCATEGORY extends CATEGORY extends keyof PREFERENCES
      ? string & keyof PREFERENCES[CATEGORY]
      : never,
    ITEM extends string & keyof PREFERENCES[CATEGORY][SUBCATEGORY]
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ): PREFERENCES[CATEGORY][SUBCATEGORY][ITEM] =>
    preference[type]?.[category]?.[subcategory]?.[item] ??
    defaultPreferences[type][category]?.[subcategory]?.[item] ??
    getPrefDefinition[type](category, subcategory, item).defaultValue;

/** Use usePref hook instead whenever possible as it comes with live updates */
export const getPref = {
  user: getPrefGenerator(rawPreferences.user, 'user'),
  collection: getPrefGenerator(rawPreferences.collection, 'collection'),
};

export const setPrefsGenerator = <
  TYPE extends PreferenceType,
  DEFINITIONS extends GenericPreferences
>(
  type: TYPE,
  getPreferences: () => MakePartialPreferences<DEFINITIONS>,
  triggerSync: boolean
) =>
  function setPref<
    CATEGORY extends string & keyof DEFINITIONS,
    SUBCATEGORY extends CATEGORY extends keyof DEFINITIONS
      ? string & keyof DEFINITIONS[CATEGORY]['subCategories']
      : never,
    ITEM extends string &
      keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM,
    value: DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  ): DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'] {
    const definition = getPrefDefinition[type](category, subcategory, item);
    let parsed;
    if ('type' in definition) {
      const baseParser = parserFromType(definition.type);
      const parser =
        typeof definition.parser === 'object'
          ? mergeParsers(baseParser, definition.parser)
          : baseParser;
      const parseResult = parseValue(
        parser,
        undefined,
        value.toString(),
        parser.type !== 'text'
      );
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

    const prefs = getPreferences();
    if (
      parsed ===
      (prefs[category]?.[subcategory]?.[item] ?? definition.defaultValue)
    )
      return parsed;

    prefs[category] ??= {};
    prefs[category]![subcategory] ??= {};
    prefs[category]![subcategory]![item] = parsed;

    if (triggerSync) {
      /*
       * Unset default values
       * This reduces the size of the downloaded file, but mainly, it allows for
       * future Specify 7 versions to change the default value.
       */
      if (parsed === definition.defaultValue) {
        prefs[category]![subcategory]![item] = undefined;
        // Clean up empty objects
        if (
          filterArray(Object.values(prefs[category]![subcategory]!)).length ===
          0
        )
          prefs[category]![subcategory] = undefined;
        if (filterArray(Object.values(prefs[category]!)).length === 0)
          prefs[category] = undefined;
      }

      commitToCacheThrottled();
      requestPreferencesSync();
    }

    prefEvents.trigger('update', {
      category,
      subcategory,
      item,
      definition,
    });
    return parsed;
  };

export const setPref = {
  user: setPrefsGenerator('user', () => rawPreferences.user, true),
  collection: setPrefsGenerator(
    'collection',
    () => rawPreferences.collection,
    true
  ),
};

// Sync with back-end at most every 5s
const syncTimeout = 5 * MILLISECONDS;
const cacheTimeout = 5 * MILLISECONDS;
let syncTimeoutInstance: ReturnType<typeof setTimeout> | undefined = undefined;
let cacheTimeoutInstance: ReturnType<typeof setTimeout> | undefined = undefined;
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

function commitToCacheThrottled(): void {
  if (typeof cacheTimeoutInstance === 'number')
    globalThis.clearTimeout(cacheTimeoutInstance);
  cacheTimeoutInstance = globalThis.setTimeout(commitToCache, cacheTimeout);
}

const syncPreferencesPromiseGenerator = (): RR<
  PreferenceType,
  Promise<number> | undefined
> =>
  Object.fromEntries(
    Object.entries(rawPreferences).map(([type, preference]) => [
      type,
      resourceId[type] !== undefined && Object.keys(preference).length > 0
        ? ping(
            `${url[type]}${resourceId[type]}/`,
            {
              method: 'PUT',
              body: keysToLowerCase({
                name: resourceNames[type],
                mimeType: 'application/json',
                metaData: '',
                data: JSON.stringify(preference),
              }),
            },
            {
              expectedResponseCodes: [Http.NO_CONTENT],
            }
          )
        : undefined,
    ])
  );

async function syncPreferences(): Promise<void> {
  isSyncPending = false;
  isSyncing = true;
  const syncPreferencePromise = syncPreferencesPromiseGenerator();
  return f.all(syncPreferencePromise).then(() => {
    // If there were additional changes while syncing
    if (isSyncPending) syncPreferences().catch(fail);
    else {
      isSyncing = false;
      prefEvents.trigger('synchronized');
    }
  });
}

const defaultResourceName = 'DefaultUserPreferences';
const defaultPreferences: {
  readonly user: PreferenceValues['user'];
  readonly collection: PreferenceValues['collection'];
} = {
  user: getCache('userPreferences', 'defaultCached') ?? {},
  collection: {},
};

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
 * If app resource data with user preferences does not exists does not exist,
 * check if SpAppResourceDir and SpAppResource exist and create them if needed,
 * then, create the app resource data itself
 */
export const preferencesPromise = contextUnlockedPromise.then(
  async (entrypoint) =>
    entrypoint === 'main'
      ? f
          .all({
            items: f.all({
              user: preferencesPromiseGenerator.user(),
              collection: preferencesPromiseGenerator.collection(),
            }),
            defaultItems: ajax(
              formatUrl('/context/app.resource', {
                name: defaultResourceName,
                quiet: '',
              }),
              {
                headers: { Accept: 'text/plain' },
              },
              {
                expectedResponseCodes: [Http.NO_CONTENT, Http.OK],
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
            defaultPreferences.user = defaultItems;
            initializePreferences(items);
            return items;
          })
      : foreverFetch<ResourceWithData>()
);

function initializePreferences(resource: IR<ResourceWithData>): void {
  rawPreferences.user = JSON.parse(resource.user.data ?? '{}');
  rawPreferences.collection = JSON.parse(resource.collection.data ?? '{}');
  resourceId.user = resource.user.id;
  resourceId.collection = resource.collection.id;

  setDevelopmentGlobal('_preferences', rawPreferences);
  prefEvents.trigger('update', undefined);
  commitToCache();
  setCache('userPreferences', 'defaultCached', defaultPreferences.user);
  registerChangeListener();
}

function commitToCache(): void {
  // Need to create a shallow copy of the resource since it can get mutated
  setCache('userPreferences', 'cached', {
    ...rawPreferences.user.preference,
  });

  setCache('collectionPreferences', 'cached', {
    ...rawPreferences.collection.preference,
  });

  if (typeof cacheTimeoutInstance === 'number')
    globalThis.clearTimeout(cacheTimeoutInstance);
}

/** Listen for changes to preferences in another tab */
const registerChangeListener = (): void =>
  void cacheEvents.on('change', ({ category, key }) => {
    if (category === 'userPreferences') {
      if (key === 'cached')
        rawPreferences.user =
          getCache('userPreferences', 'cached') ??
          rawPreferences.user.preference;
      else if (key === 'defaultCached')
        defaultPreferences.user =
          getCache('userPreferences', 'defaultCached') ??
          defaultPreferences.user;
    } else if (category !== 'collectionPreferences')
      rawPreferences.collection =
        getCache('collectionPreferences', 'cached') ??
        rawPreferences.collection.preference;
    else return;

    setDevelopmentGlobal('_preferences', rawPreferences);
    prefEvents.trigger('update', undefined);
  });
