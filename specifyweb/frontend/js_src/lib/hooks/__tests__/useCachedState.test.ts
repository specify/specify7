import { act, renderHook, waitFor } from '@testing-library/react';

import { getCache, setCache } from '../../utils/cache';
import { f } from '../../utils/functools';
import type { R } from '../../utils/types';
import { useCachedState } from '../useCachedState';

describe('useCachedState', () => {
  let localStorageCopy: R<string> | undefined;

  const categoryKey = 'merging';
  const categoryValue = 'showMatchingFields';

  beforeEach(() => {
    /*
     * Before running this test-suite, make a copy of all the previous values
     * and then clear the local storage, to make tests deterministic.
     */
    const entries = Array.from(
      { length: global.localStorage.length },
      (_, index) => [
        localStorage.key(index),
        f.maybe(
          global.localStorage.key(index) ?? undefined,
          global.localStorage.getItem
        ),
      ]
    );
    localStorageCopy = Object.fromEntries(entries);
    global.localStorage.clear();
  });

  afterEach(() => {
    // Reset the cache to the original state after each test.
    global.localStorage.clear();
    Object.entries(localStorageCopy ?? {}).forEach(([key, value]) =>
      global.localStorage.setItem(key, value)
    );
  });

  test('state and cache gets correctly read and set', async () => {
    const { result } = renderHook(() =>
      useCachedState(categoryKey, categoryValue)
    );

    expect(result.current[0]).toBeUndefined();

    await act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);

    expect(getCache(categoryKey, categoryValue)).toBe(true);

    await act(() => result.current[1](false));

    expect(result.current[0]).toBe(false);
  });

  test('handles functions for new values', async () => {
    const { result } = renderHook(() =>
      useCachedState(categoryKey, categoryValue)
    );

    await act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);

    await act(() => result.current[1]((value) => !value));

    expect(result.current[0]).toBe(false);

    expect(getCache(categoryKey, categoryValue)).toBe(false);
  });

  test('does not update when called with undefined value', async () => {
    const { result } = renderHook(() =>
      useCachedState(categoryKey, categoryValue)
    );

    await act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);

    await act(() => result.current[1](undefined));

    expect(result.current[0]).toBe(true);

    await act(() => result.current[1]((_) => undefined));

    expect(result.current[0]).toBe(true);
  });

  test('listens to cache updates', async () => {
    const { result } = renderHook(() =>
      useCachedState(categoryKey, categoryValue)
    );

    await act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);

    await act(() => {
      setCache(categoryKey, categoryValue, true, true);
    });

    waitFor(() => {
      expect(result.current[0]).toBe(true);
    });

    await act(() => {
      setCache(categoryKey, categoryValue, false, true);
    });

    waitFor(() => {
      expect(result.current[0]).toBe(false);
    });
  });

  test('does not listen to cache updates for different key or category', async () => {
    const { result } = renderHook(() =>
      useCachedState(categoryKey, categoryValue)
    );

    await act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);

    await act(() => {
      setCache('queryBuilder', 'showHiddenFields', true, true);
    });

    expect(result.current[0]).toBe(true);
  });
});
