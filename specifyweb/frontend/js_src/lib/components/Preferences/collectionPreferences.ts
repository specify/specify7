import _ from 'underscore';

import { cacheEvents, getCache, setCache } from '../../utils/cache';
import { MILLISECONDS } from '../Atoms/Internationalization';
import { BasePreferences } from './BasePreferences';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { softFail } from '../Errors/Crash';

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
});
collectionPreferences.setRaw(getCache(cacheKey, 'cached') ?? {});
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
collectionPreferences.fetch().catch(softFail);

cacheEvents.on('change', ({ category, key }) => {
  if (category !== cacheKey) return;
  if (key === 'cached')
    collectionPreferences.setRaw(
      getCache(cacheKey, 'cached') ?? collectionPreferences.getRaw()
    );
});
