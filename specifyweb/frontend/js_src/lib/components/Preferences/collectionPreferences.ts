import _ from 'underscore';

import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { MILLISECONDS } from '../Atoms/Internationalization';
import { BasePreferences } from './BasePreferences';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';

const cacheKey = 'collectionPreferences';
const throttleRate = 5 * MILLISECONDS;

export const collectionPreferences = new BasePreferences({
  definitions: collectionPreferenceDefinitions,
  values: {
    resourceName: 'CollectionPreferences',
    fetchUrl: '/context/collection_resource/',
  },
  defaultValues: undefined,
  developmentGlobal: '_collectionPreferences',
  syncChanges: true,
});

// Load initial values from cache
collectionPreferences.setRaw(getCache(cacheKey, 'cached') ?? {});

// Update cache on preferences changes
collectionPreferences.events.on(
  'update',
  _.debounce(
    () =>
      setCache(cacheKey, 'cached', {
        ...collectionPreferences.getRaw(),
      }),
    throttleRate
  )
);

// Fetch up to date preferences from the back-end
collectionPreferences.fetch().catch(console.error);

// Sync preferences between browser tabs in real time
cacheEvents.on('change', ({ category, key }) => {
  if (category !== cacheKey) return;
  if (key === 'cached')
    collectionPreferences.setRaw(
      getCache(cacheKey, 'cached') ?? collectionPreferences.getRaw()
    );
});
