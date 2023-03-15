import _ from 'underscore';

import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { MILLISECONDS } from '../Atoms/Internationalization';
import { BasePreferences } from './BasePreferences';
import { userPreferenceDefinitions } from './UserDefinitions';

const cacheKey = 'userPreferences';
const throttleRate = 5 * MILLISECONDS;

export const userPreferences = new BasePreferences({
  definitions: userPreferenceDefinitions,
  values: {
    resourceName: 'UserPreferences',
    fetchUrl: '/context/user_resource/',
  },
  defaultValues: {
    resourceName: 'DefaultUserPreferences',
    fetchUrl: '/context/app.resource',
  },
  developmentGlobal: '_userPreferences',
  syncChanges: true,
});

// Load initial values from cache
userPreferences.setRaw(getCache(cacheKey, 'cached') ?? {});
userPreferences.setDefaults(getCache(cacheKey, 'defaultCached') ?? {});

// Update cache on preferences changes
userPreferences.events.on(
  'update',
  _.debounce(() => {
    setCache(cacheKey, 'cached', {
      ...userPreferences.getRaw(),
    });
    setCache(cacheKey, 'defaultCached', userPreferences.getDefaults());
  }, throttleRate)
);

// Fetch up to date preferences from the back-end
userPreferences.fetch().catch(console.error);

// Sync preferences between browser tabs in real time
cacheEvents.on('change', ({ category, key }) => {
  if (category !== cacheKey) return;
  if (key === 'cached')
    userPreferences.setRaw(
      getCache(cacheKey, 'cached') ?? userPreferences.getRaw()
    );
  else if (key === 'defaultCached')
    userPreferences.setDefaults(
      getCache(cacheKey, 'defaultCached') ?? userPreferences.getDefaults()
    );
});
