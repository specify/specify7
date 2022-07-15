import React from 'react';

import { cacheEvents, getCache, setCache } from '../cache';
import type { CacheDefinitions } from '../cachedefinitions';
import { f } from '../functools';

/**
 * Like React.useState, but initial value is read from localStorage
 * and all changes are written back to localStorage
 *
 * @remarks
 * Useful for remembering user preference or caching async operations
 *
 * defaultValue may be an async value. For this reason, useCachedState
 * may return undefined if value is not in cache and defaultValue is not
 * yet resolved.
 * Can display some sort of loading message while the value is undefined
 */
export function useCachedState<
  CATEGORY extends string & keyof CacheDefinitions,
  KEY extends string & keyof CacheDefinitions[CATEGORY]
>(
  category: CATEGORY,
  key: KEY
): [
  value: CacheDefinitions[CATEGORY][KEY] | undefined,
  setValue: (newValue: CacheDefinitions[CATEGORY][KEY]) => void
] {
  const [state, setState] = React.useState<
    CacheDefinitions[CATEGORY][KEY] | undefined
  >(() => getCache(category, key));

  const setCachedState = React.useCallback(
    (newValue: CacheDefinitions[CATEGORY][KEY]) =>
      setState(setCache(category, key, newValue)),
    [category, key]
  );

  React.useEffect(
    () =>
      cacheEvents.on('change', () =>
        f.maybe(getCache(category, key), (newValue) =>
          state === newValue ? undefined : setCachedState(newValue)
        )
      ),
    [state, category, key, setCachedState]
  );

  return [state, setCachedState];
}
