import React from 'react';

import { cacheEvents, getCache, setCache } from '../cache';
import type { CacheDefinitions } from '../cachedefinitions';
import { f } from '../functools';
import { isFunction } from '../types';
import { crash } from './errorboundary';

type DefaultValue<T> = T | Promise<T> | (() => Promise<T>);

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
>({
  category,
  key,
  defaultValue,
  /**
   * A concept borrowed from Vercel's SWR,
   * If there is a cashed state in localStorage, use that, but still fetch
   * the most up to date value and use that once fetched
   */
  staleWhileRefresh,
}: {
  readonly category: CATEGORY;
  readonly key: KEY;
  readonly defaultValue?: DefaultValue<CacheDefinitions[CATEGORY][KEY]>;
  readonly staleWhileRefresh: boolean;
}): [
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

  const isUndefined = state === undefined;
  React.useEffect(() => {
    if (isUndefined || staleWhileRefresh)
      (isFunction(defaultValue)
        ? Promise.resolve(defaultValue())
        : Promise.resolve(defaultValue)
      )
        .then((value) => f.maybe(value, setCachedState))
        .catch(crash);
  }, [isUndefined, defaultValue, setCachedState, staleWhileRefresh]);

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
