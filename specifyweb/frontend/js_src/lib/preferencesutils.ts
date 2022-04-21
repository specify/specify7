/**
 * Utilities for dealing with user preferences
 */

import { ajax, Http, ping } from './ajax';
import { fetchCollection } from './collection';
import { crash } from './components/errorboundary';
import { prefUpdates } from './components/preferenceshooks';
import type { SpAppResourceData } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import type { Preferences } from './preferences';
import { preferenceDefinitions } from './preferences';
import { createResource, fetchResource, getResourceApiUrl } from './resource';
import { fetchContext as fetchSchema, schema } from './schema';
import { fetchContext as fetchDomain } from './schemabase';
import { defined, filterArray } from './types';
import { fetchContext as fetchUser, userInformation } from './userinfo';
import { MILLISECONDS } from './components/internationalization';

export const getPrefDefinition = <
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM] =>
  // @ts-expect-error
  preferenceDefinitions[category].subCategories[subcategory].items[item];

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
  getPrefDefinition(category, subcategory, item).defaultValue;

let preferences: {
  [CATEGORY in keyof Preferences]?: {
    [SUBCATEGORY in keyof Preferences[CATEGORY]['subCategories']]?: {
      [ITEM in keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']]?: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'];
    };
  };
} = {};

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
  const prefs = preferences as any;
  prefs[category] ??= {};
  prefs[category][subcategory] ??= {};
  prefs[category][subcategory][item] = value;
  if (
    prefs[category][subcategory][item] ===
    getPrefDefinition(category, subcategory, item).defaultValue
  ) {
    // Unset default values
    prefs[category][subcategory][item] = undefined;
    // Clean up empty objects
    if (filterArray(Object.values(prefs[category][subcategory])).length === 0)
      prefs[category][subcategory] = undefined;
    if (filterArray(Object.values(prefs[category])).length === 0)
      prefs[category] = undefined;
    prefUpdates.trigger('update');
  }
  requestPreferencesSync();
}

let appResourceId: undefined | number = undefined;
// Sync at most every 5s
const syncTimeout = 5 * MILLISECONDS;
let syncTimeoutInstance: ReturnType<typeof setTimeout> | undefined = undefined;
let isSyncPending = false;
let isSyncing = true;

export const awaitPrefsSynced = async (): Promise<void> =>
  isSyncPending || isSyncing
    ? new Promise((resolve) => {
        const destructor = prefUpdates.on('synchronized', () => {
          destructor();
          resolve();
        });
      })
    : Promise.resolve();

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

const fetchAppResourceId = async (): Promise<number> =>
  ajax<number>(
    // FIXME: fetch prefs from the server
    '',
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }
  ).then(({ data }) => data);

async function syncPreferences(): Promise<void> {
  isSyncPending = false;
  return (
    typeof appResourceId === 'number'
      ? Promise.resolve(appResourceId)
      : fetchAppResourceId().then((id) => {
          appResourceId = id;
          return id;
        })
  )
    .then(async (appResourceId) =>
      ping(
        // FIXME: fill in the URL
        `${appResourceId}`,
        {
          method: 'PUT',
          body: preferences,
          headers: {
            Accept: 'application/json',
          },
        },
        {
          // FIXME: test if Http.CONFLICT is ever returned
          expectedResponseCodes: [Http.OK, Http.CONFLICT],
        }
      )
    )
    .then((status) =>
      status === Http.CONFLICT
        ? fetchResource('SpAppResourceData', appResourceData.id).then(
            (resource) => {
              appResourceData = defined(resource);
              preferences = JSON.parse(appResourceData.data ?? '{}');
              prefUpdates.trigger('update');
            }
          )
        : undefined
    )
    .then(() => {
      // If there were additional changes while syncing
      if (isSyncPending) syncPreferences().catch(crash);
      else {
        isSyncing = false;
        prefUpdates.trigger('synchronized');
      }
    });
}

const resourceName = 'UserPreferences';

let appResourceData: SerializedResource<SpAppResourceData> = undefined!;

export const fetchContext: Promise<SerializedResource<SpAppResourceData>> =
  Promise.all([fetchSchema, fetchDomain, fetchUser]).then(async () =>
    // Most likely outcome is that an app resource data exists
    fetchCollection(
      'SpAppResourceData',
      {
        limit: 1,
      },
      {
        spappresource__name: resourceName,
        spappresource__specifyuser: userInformation.id,
        spappresource__spappresourcedir__ispersonal: 'true',
        spappresource__spappresourcedir__collection:
          schema.domainLevelIds.collection,
      }
    )
      .then(({ records }) =>
        records.length === 1
          ? records[0]
          : /*
             * If app resourcee data does not exist, check if SpAppResourceDir and
             * SpAppResource exist and create if needed
             */
            fetchCollection('SpAppResourceDir', {
              limit: 1,
              isPersonal: true,
              collection: schema.domainLevelIds.collection,
              specifyUser: userInformation.id,
            })
              .then(({ records }) =>
                records.length === 0
                  ? createResource('SpAppResourceDir', {
                      collection: getResourceApiUrl(
                        'Collection',
                        schema.domainLevelIds.collection
                      ),
                      discipline: getResourceApiUrl(
                        'Discipline',
                        schema.domainLevelIds.discipline
                      ),
                      isPersonal: true,
                      specifyUser: getResourceApiUrl(
                        'SpecifyUser',
                        userInformation.id
                      ),
                      userType: userInformation.usertype,
                    }).then(({ id }) => id)
                  : records[0].id
              )
              .then(async (appResourceDirId) =>
                fetchCollection('SpAppResource', {
                  limit: 1,
                  spAppResourceDir: appResourceDirId,
                  specifyUser: userInformation.id,
                  name: resourceName,
                }).then(({ records }) =>
                  records.length === 0
                    ? createResource('SpAppResource', {
                        spAppResourceDir: getResourceApiUrl(
                          'SpAppResourceDir',
                          appResourceDirId
                        ),
                        specifyUser: userInformation.resource_uri,
                        name: resourceName,
                        mimeType: 'application/json',
                      }).then(({ id }) => id)
                    : records[0].id
                )
              )
              .then(async (appResourceId) =>
                createResource('SpAppResourceData', {
                  spAppResource: getResourceApiUrl(
                    'SpAppResource',
                    appResourceId
                  ),
                  data: '{}',
                })
              )
      )
      .then((resource) => {
        appResourceData = resource;
        preferences = JSON.parse(appResourceData.data ?? '{}');
        prefUpdates.trigger('update');
        return appResourceData;
      })
  );
