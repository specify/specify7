import React from 'react';

import { cacheEvents, getCache, setCache } from '../utils/cache';
import type { CacheDefinitions } from '../utils/cache/definitions';
import type { GetOrSet } from '../utils/types';

const isSameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

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
  CATEGORY extends keyof CacheDefinitions,
  KEY extends string & keyof CacheDefinitions[CATEGORY],
>(
  category: CATEGORY,
  key: KEY
): GetOrSet<CacheDefinitions[CATEGORY][KEY] | undefined> {
  const [state, setState] = React.useState<
    CacheDefinitions[CATEGORY][KEY] | undefined
  >(() => getCache(category, key));
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setCachedState = React.useCallback<
    (
      newValue: Parameters<
        GetOrSet<CacheDefinitions[CATEGORY][KEY] | undefined>[1]
      >[0],
      triggerChange?: boolean
    ) => void
  >(
    (newValue, triggerChange = true) => {
      if (newValue === undefined) return;
      const resolvedValue =
        typeof newValue === 'function'
          ? (
              newValue as (
                oldValue: CacheDefinitions[CATEGORY][KEY] | undefined
              ) => CacheDefinitions[CATEGORY][KEY] | undefined
            )(getCache(category, key))
          : newValue;
      if (resolvedValue === undefined) return;
      stateRef.current = resolvedValue;
      setState(setCache(category, key, resolvedValue, triggerChange));
    },
    [category, key]
  );

  React.useEffect(
    () =>
      cacheEvents.on('change', (changed) => {
        if (changed.category !== category || changed.key !== key) return;
        const newValue = getCache(category, key);
        if (isSameValue(stateRef.current, newValue)) return;
        setCachedState(newValue, false);
      }),
    [category, key, setCachedState]
  );

  return [state, setCachedState];
}
