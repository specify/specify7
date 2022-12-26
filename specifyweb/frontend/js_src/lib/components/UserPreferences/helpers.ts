/**
 * Utilities for dealing with user preferences
 */

import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { MILLISECONDS } from '../Atoms/Internationalization';
import type { GenericPreferences, Preferences } from './Definitions';
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
import type { IR, RA, RR } from '../../utils/types';
import { filterArray, setDevelopmentGlobal } from '../../utils/types';
import { mergeParsers, parserFromType } from '../../utils/parser/definitions';
import { fail } from '../Errors/Crash';
import { parseValue } from '../../utils/parser/parse';
import { Http } from '../../utils/ajax/definitions';
import {
  preferencesFetchSpec,
  preferencesPromiseGenerator,
} from './preferencesFetch';
import { collectionPreferenceDefinitions } from './CollectionPreferenceDefinitions';
import { number } from 'prop-types';
import { numberlike } from 'moment/moment';

export const getPrefDefinitionGenerator =
  <PREFERENCE extends GenericPreferences>(preferenceDefinitions: PREFERENCE) =>
  <
    CATEGORY extends keyof PREFERENCE,
    SUBCATEGORY extends CATEGORY extends keyof PREFERENCE
      ? keyof PREFERENCE[CATEGORY]['subCategories']
      : never,
    ITEM extends keyof PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ): PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM] => {
    const definition =
      // @ts-expect-error
      // @ts-expect-error
      (
        preferenceDefinitions[category].subCategories[
          subcategory
        ] as PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]
      ).items[item];
    const defaultValue = defaultPreferences[category]?.[subcategory]?.[item];
    return defaultValue === undefined
      ? definition
      : replaceKey(definition, 'defaultValue', defaultValue);
  };

export const getPrefGenerator =
  <PREFERENCE extends GenericPreferences>(
    getPreferenceDefinition: <
      CATEGORY extends keyof PREFERENCE,
      SUBCATEGORY extends CATEGORY extends keyof PREFERENCE
        ? keyof PREFERENCE[CATEGORY]['subCategories']
        : never,
      ITEM extends keyof PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items']
    >(
      category: CATEGORY,
      subcategory: SUBCATEGORY,
      item: ITEM
    ) => PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM],
    preferenceType: 'collection' | 'user'
  ) =>
  <
    CATEGORY extends keyof PREFERENCE,
    SUBCATEGORY extends CATEGORY extends keyof PREFERENCE
      ? keyof PREFERENCE[CATEGORY]['subCategories']
      : never,
    ITEM extends keyof PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ): PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'] => {
    return (
      preference[preferenceType].preferences[category]?.[subcategory]?.[item] ??
      defaultPreferences[category]?.[subcategory]?.[item] ??
      getPreferenceDefinition(category, subcategory, item).defaultValue
    );
  };

export const getPrefDefinition = getPrefDefinitionGenerator(
  preferenceDefinitions
);
export const getCollectionPrefDefinition = getPrefDefinitionGenerator(
  collectionPreferenceDefinitions
);

/** Use usePref hook instead whenever possible as it comes with live updates */
export const getPref = {
  userPreferences: getPrefGenerator<typeof preferenceDefinitions>(
    getPrefDefinition,
    'user'
  ),
  collectionPreferences: getPrefGenerator<
    typeof collectionPreferenceDefinitions
  >(getCollectionPrefDefinition, 'collection'),
};

export const getUserPref = getPref.userPreferences;

export const preferenceGenerator = <PREFERENCE extends GenericPreferences>(
  preference: PREFERENCE | Record<string, never>,
  url: string,
  resourceId: number | undefined
): {
  readonly url: string;
  readonly resourceId: undefined | number;
  readonly preference: PREFERENCE | Record<string, never>;
} => ({
  url,
  resourceId,
  preference,
});

export const preference = {
  user: preferenceGenerator<typeof preferenceDefinitions>(
    getCache('userPreferences', 'cached') ?? {},
    '/context/user_resource/',
    undefined
  ),
  collection: preferenceGenerator<typeof collectionPreferenceDefinitions>(
    getCache('collectionPreferences', 'cached') ?? {},
    '/context/collection_resource/',
    undefined
  ),
};

export const getRawUserPreferences = () => preference.user.preference;
export const getRawCollectionPreferences = () =>
  preference.collection.preference;

export const getRawPreferences = {
  userPreferences: (): typeof preferenceDefinitions | Record<string, never> =>
    preference.user.preference,
  collectionPreferences: ():
    | typeof collectionPreferenceDefinitions
    | Record<string, never> => preference.collection.preference,
};

export const setPrefsGenerator = <PREFERENCE extends GenericPreferences>(
  getPreferences: () => PREFERENCE | Record<string, never>,
  getPrefDefinition: <
    CATEGORY extends keyof PREFERENCE,
    SUBCATEGORY extends CATEGORY extends keyof PREFERENCE
      ? keyof PREFERENCE[CATEGORY]['subCategories']
      : never,
    ITEM extends keyof PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ) => PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM],
  triggerSync: boolean
) =>
  function setPref<
    CATEGORY extends keyof PREFERENCE,
    SUBCATEGORY extends keyof PREFERENCE[CATEGORY]['subCategories'],
    ITEM extends keyof PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM,
    value: PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  ): PREFERENCE[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'] {
    const definition = getPrefDefinition(category, subcategory, item);
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
        value?.toString(),
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

    const prefs = getPreferences() as any;
    if (
      parsed ===
      (prefs[category]?.[subcategory]?.[item] ?? definition.defaultValue)
    )
      return parsed;

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

    prefEvents.trigger('update', {
      category,
      subcategory,
      item,
      definition,
    });
    return parsed;
  };
export const setPref = {
  userPreferences: setPrefsGenerator<typeof preferenceDefinitions>(
    getRawPreferences.userPreferences,
    getPrefDefinition,
    true
  ),
  collectionPreferences: setPrefsGenerator<
    typeof collectionPreferenceDefinitions
  >(getRawPreferences.collectionPreferences, getCollectionPrefDefinition, true),
};

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

const syncPreferencesPromiseGenerator = (): RR<
  'collection' | 'user',
  Promise<number> | undefined
> =>
  Object.fromEntries(
    Object.entries(preference).map(
      ([resourceName, { url, resourceId, preference }]) => [
        resourceName,
        resourceId !== undefined && Object.keys(preference).length > 0
          ? ping(
              `${url}${resourceId}/`,
              {
                method: 'PUT',
                body: keysToLowerCase({
                  name:
                    resourceName === 'collection'
                      ? 'CollectionPreferences'
                      : 'UserPreferences',
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
      ]
    )
  );

async function syncPreferences(): Promise<void> {
  isSyncPending = false;

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

let userResource: ResourceWithData = undefined!;
let defaultPreferences = getCache('userPreferences', 'defaultCached') ?? {};

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
            items: await Promise.all(
              preferencesPromiseGenerator(preferencesFetchSpec)
            ).then((data) => Object.fromEntries(data)),
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
          .then(async ({ items, defaultItems }) => {
            defaultPreferences = defaultItems;
            initializePreferences(items);
            return items;
          })
      : foreverFetch<ResourceWithData>()
);

function initializePreferences(
  resource: IR<ResourceWithData>
): ResourceWithData {
  preference.user = {
    ...preference.user,
    resourceId: resource.userPreferences.id,
    preference: JSON.parse(
      resource.userPreferences.data ?? '{}'
    ) as typeof preferenceDefinitions,
  };

  preference.collection = {
    ...preference.collection,
    resourceId: resource.collectionPreferences.id,
    preference: JSON.parse(
      resource.collectionPreferences.data ?? '{}'
    ) as typeof collectionPreferenceDefinitions,
  };

  setDevelopmentGlobal('_preferences', preference); //Remove Id!
  prefEvents.trigger('update', undefined);
  commitToCache();
  setCache('userPreferences', 'defaultCached', defaultPreferences);

  registerChangeListener();
  return userResource;
}

const commitToCache = (): void =>
  // Need to create a shallow copy of the resource since it can get mutated
  {
    setCache('userPreferences', 'cached', {
      ...preference.user.preference,
    });

    setCache('collectionPreferences', 'cached', {
      ...preference.collection.preference,
    });
  };

/** Listen for changes to preferences in another tab */
const registerChangeListener = (): void =>
  void cacheEvents.on('change', ({ category, key }) => {
    if (category !== 'userPreferences' && category !== 'collectionPreferences')
      return;

    if (category === 'userPreferences') {
      if (key === 'cached') {
        preference.user = {
          ...preference.user,
          preference:
            getCache('userPreferences', 'cached') ?? preference.user.preference,
        };
      } else if (key === 'defaultCached') {
        defaultPreferences =
          getCache('userPreferences', 'defaultCached') ?? defaultPreferences;
      }
    }

    preference.collection = {
      ...preference.collection,
      preference:
        getCache('collectionPreferences', 'cached') ??
        preference.collection.preference,
    };

    setDevelopmentGlobal('_preferences', preference);
    prefEvents.trigger('update', undefined);
  });
