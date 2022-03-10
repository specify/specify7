import { ajax, Http, ping } from './ajax';
import { crash } from './components/errorboundary';
import { prefUpdateListeners } from './components/preferenceshooks';
import type { Preferences } from './preferences';
import { preferenceDefinitions } from './preferences';
import { filterArray } from './types';
import { f } from './wbplanviewhelper';

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

export const getPrefValue = <
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'] =>
  // @ts-expect-error
  preferences[category]?.[subcategory]?.[item] ??
  getPrefDefinition(category, subcategory, item).defaultValue;

// TODO: save this on the back-end
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
    prefUpdateListeners.forEach(f.call);
  }
  requestPreferencesSync();
}

let appResourceId: undefined | number = undefined;
// Sync at most every 5s
const syncTimeout = 5 * 1000;
let syncTimeoutInstance: ReturnType<typeof setTimeout> | undefined = undefined;
let isSyncPending = false;
let isSyncing = true;

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
    // TODO: fetch prefs from the server
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
        // TODO: fill in the URL
        `${appResourceId}`,
        {
          method: 'PUT',
          body: preferences,
          headers: {
            Accept: 'application/json',
          },
        },
        {
          // TODO: test if Http.CONFLICT is ever returned
          expectedResponseCodes: [Http.OK, Http.CONFLICT],
        }
      )
    )
    .then((status) =>
      status === Http.CONFLICT ? fetchPreferences() : undefined
    )
    .then(() => {
      if (isSyncPending) syncPreferences().catch(crash);
      else isSyncing = false;
    });
}

function handlePreferencesUpdate(data: typeof preferences): void {
  preferences = data;
  prefUpdateListeners.forEach(f.call);
}

const fetchPreferences = async (): Promise<typeof preferences> =>
  ajax<typeof preferences>(
    // TODO: fill in the URL
    '',
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
    {
      // TODO: test what does the parser on 404
      expectedResponseCodes: [Http.OK, Http.NOT_FOUND],
    }
  ).then(({ data, status }) => (status === Http.NOT_FOUND ? {} : data));

export const fetchContext = async (): Promise<void> =>
  fetchPreferences().then(handlePreferencesUpdate);
