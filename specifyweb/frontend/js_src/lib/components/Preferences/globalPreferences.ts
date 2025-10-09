import _ from 'underscore';

import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { SECOND } from '../Atoms/timeUnits';
import { BasePreferences } from './BasePreferences';
import { globalPreferenceDefinitions } from './GlobalDefinitions';

const cacheKey = 'globalPreferences';
const throttleRate = 5 * SECOND;

export const globalPreferences = new BasePreferences({
  definitions: globalPreferenceDefinitions,
  values: {
    resourceName: 'preferences',
    fetchUrl: '/context/global_resource/',
  },
  defaultValues: undefined,
  developmentGlobal: '_globalPreferences',
  syncChanges: true,
});

globalPreferences.setRaw(getCache(cacheKey, 'cached') ?? {});

globalPreferences.events.on(
  'update',
  _.debounce(
    () =>
      setCache(cacheKey, 'cached', {
        ...globalPreferences.getRaw(),
      }),
    throttleRate
  )
);

globalPreferences.fetch().catch(console.error);

cacheEvents.on('change', ({ category, key }) => {
  if (category !== cacheKey) return;
  if (key === 'cached')
    globalPreferences.setRaw(
      getCache(cacheKey, 'cached') ?? globalPreferences.getRaw()
    );
});

