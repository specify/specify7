import { act, renderHook } from '@testing-library/react';

import { usePaginatedCollection } from '../usePaginatedCollection';

test('recognizes a complete initial result set', () => {
  const fetchMore = jest.fn();
  const initialRecords = [1, 2];
  const { result } = renderHook(() =>
    usePaginatedCollection({
      initialRecords,
      totalCount: 2,
      fetchMore,
    })
  );

  expect(result.current.results[0]).toEqual([1, 2]);
  expect(result.current.canFetchMore).toBe(false);
});

test('appends the next page of results', async () => {
  const fetchMore = jest.fn(async (offset: number) =>
    offset === 2 ? [3, 4] : []
  );
  const initialRecords = [1, 2];
  const { result } = renderHook(() =>
    usePaginatedCollection({
      initialRecords,
      totalCount: 4,
      fetchMore,
      fetchSize: 2,
    })
  );

  await act(async () => result.current.onFetchMore());

  expect(fetchMore).toHaveBeenCalledWith(2);
  expect(result.current.results[0]).toEqual([1, 2, 3, 4]);
  expect(result.current.canFetchMore).toBe(false);
});

test('coalesces concurrent requests for the same page', async () => {
  const fetchMore = jest.fn(async () => [3, 4]);
  const initialRecords = [1, 2];
  const { result } = renderHook(() =>
    usePaginatedCollection({
      initialRecords,
      totalCount: 4,
      fetchMore,
      fetchSize: 2,
    })
  );

  await act(async () =>
    Promise.all([result.current.onFetchMore(2), result.current.onFetchMore(2)])
  );

  expect(fetchMore).toHaveBeenCalledTimes(1);
  expect(result.current.results[0]).toEqual([1, 2, 3, 4]);
});
