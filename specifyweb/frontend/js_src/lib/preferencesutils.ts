/**
 * Utilities for dealing with user preferences
 */

import { fetchCollection, rawFetchCollection } from './collection';
import { crash } from './components/errorboundary';
import { MILLISECONDS } from './components/internationalization';
import { prefEvents } from './components/preferenceshooks';
import type { SpAppResourceData } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import { toLowerCase } from './helpers';
import type { Preferences } from './preferences';
import { preferenceDefinitions } from './preferences';
import {
  createResource,
  fetchResource,
  getResourceApiUrl,
  saveResource,
} from './resource';
import { fetchContext as fetchSchema, schema } from './schema';
import { fetchContext as fetchDomain } from './schemabase';
import { defined, filterArray } from './types';
import { mergeParsers, parserFromType, parseValue } from './uiparse';
import { fetchContext as fetchUser, userInformation } from './userinfo';

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

  // Unset default values
  if (parsed === definition.defaultValue) {
    prefs[category][subcategory][item] = undefined;
    // Clean up empty objects
    if (filterArray(Object.values(prefs[category][subcategory])).length === 0)
      prefs[category][subcategory] = undefined;
    if (filterArray(Object.values(prefs[category])).length === 0)
      prefs[category] = undefined;
  }

  prefEvents.trigger('update');
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

async function syncPreferences(): Promise<void> {
  isSyncPending = false;
  return saveResource(
    'SpAppResourceData',
    appResourceData.id,
    {
      ...appResourceData,
      data: JSON.stringify(preferences),
    },
    (): void =>
      void fetchResource('SpAppResourceData', appResourceData.id)
        .then((resource) => updatePreferences(defined(resource)))
        .catch(crash)
  ).then(({ version }) => {
    /*
     * Can't reassign to appResourceData directly, as it may have already
     * changed while fetching was in progress
     */
    // @ts-expect-error Mutating the resource
    appResourceData.version = version;

    // If there were additional changes while syncing
    if (isSyncPending) syncPreferences().catch(crash);
    else {
      isSyncing = false;
      prefEvents.trigger('synchronized');
    }
  });
}

const resourceName = 'UserPreferences';

let appResourceData: SerializedResource<SpAppResourceData> = undefined!;

// TODO: cache preferences to local storage

// Fetch app resource that stores current user preferences
export const fetchPreferences = Promise.all([fetchDomain, fetchUser])
  .then(async () =>
    /*
     * Can't use fetchCollection because schema is not yet loaded
     * Can't wait for schema to load because schema localization endpoint depends
     * on user preferences to get current schema language
     */
    rawFetchCollection(
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
  )
  .then(({ records }) =>
    // Can't use serializeResource because schema is not yet loaded
    records.length === 1
      ? updatePreferences(
          Object.fromEntries(
            (
              [
                'createdByAgent',
                'data',
                'id',
                'modifiedByAgent',
                'resource_uri',
                'spAppResource',
                'spViewSetObj',
                'timestampCreated',
                'timestampModified',
                'version',
              ] as const
            ).map((key) => [key, records[0][toLowerCase(key)]])
          ) as SerializedResource<SpAppResourceData>
        )
      : undefined
  );

function updatePreferences(
  resource: SerializedResource<SpAppResourceData>
): SerializedResource<SpAppResourceData> {
  appResourceData = resource;
  preferences = JSON.parse(appResourceData.data ?? '{}');
  prefEvents.trigger('update');
  return appResourceData;
}

/*
 * If app resourcee data with user preferences does not exists does not exist,
 * check if SpAppResourceDir and SpAppResource exist and create them if needed,
 * then, create the app resource data itself
 */
export const fetchContext = fetchPreferences.then((resource) =>
  typeof resource === 'object'
    ? undefined
    : fetchSchema
        .then(async () =>
          fetchCollection('SpAppResourceDir', {
            limit: 1,
            isPersonal: true,
            collection: schema.domainLevelIds.collection,
            specifyUser: userInformation.id,
          })
        )
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
            spAppResource: getResourceApiUrl('SpAppResource', appResourceId),
            data: '{}',
          })
        )
        .then(updatePreferences)
);
