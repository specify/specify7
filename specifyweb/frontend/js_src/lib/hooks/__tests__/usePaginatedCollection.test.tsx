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

test('replaces the current result page when initial records change', () => {
  const { result, rerender } = renderHook(
    ({ initialRecords, totalCount }) =>
      usePaginatedCollection({
        initialRecords,
        totalCount,
        fetchMore: jest.fn(async () => []),
      }),
    {
      initialProps: {
        initialRecords: [1, 2],
        totalCount: 2,
      },
    }
  );

  rerender({
    initialRecords: [3, 4],
    totalCount: 4,
  });

  expect(result.current.results[0]).toEqual([3, 4]);
  expect(result.current.canFetchMore).toBe(true);
});

test.each([
  { initialRecords: [3], totalCount: 1, canFetchMore: false },
  { initialRecords: [], totalCount: 0, canFetchMore: false },
  { initialRecords: undefined, totalCount: 1, canFetchMore: true },
])('returns replacement records and count on the first render: %j', (next) => {
  const renders: {
    readonly records: ReadonlyArray<number | undefined> | undefined;
    readonly totalCount: number | undefined;
    readonly canFetchMore: boolean;
  }[] = [];
  const initialProps: {
    readonly initialRecords: readonly number[] | undefined;
    readonly totalCount: number;
  } = { initialRecords: [1, 2], totalCount: 4 };
  const { rerender } = renderHook(
    ({ initialRecords, totalCount }) => {
      const collection = usePaginatedCollection({
        initialRecords,
        totalCount,
        fetchMore: undefined,
      });
      renders.push({
        records: collection.results[0],
        totalCount: collection.totalCount[0],
        canFetchMore: collection.canFetchMore,
      });
      return collection;
    },
    { initialProps }
  );

  renders.length = 0;
  rerender(next);

  expect(renders.length).toBeGreaterThan(0);
  expect(renders).toEqual(
    renders.map(() => ({
      records: next.initialRecords,
      totalCount: next.totalCount,
      canFetchMore: next.canFetchMore,
    }))
  );
});

test('preserves edited records when only the total count changes', () => {
  const initialRecords = [1, 2];
  const { result, rerender } = renderHook(
    ({ totalCount }) =>
      usePaginatedCollection({
        initialRecords,
        totalCount,
        fetchMore: undefined,
      }),
    { initialProps: { totalCount: 2 } }
  );

  act(() => result.current.results[1]([2]));
  rerender({ totalCount: 1 });

  expect(result.current.results[0]).toEqual([2]);
  expect(result.current.totalCount[0]).toBe(1);
  expect(result.current.canFetchMore).toBe(false);
});

test('ignores page requests from the previous result set', async () => {
  let resolveFetch: ((rows: number[]) => void) | undefined;
  const fetchMore = jest.fn(
    () =>
      new Promise<number[]>((resolve) => {
        resolveFetch = resolve;
      })
  );
  const { result, rerender } = renderHook(
    ({ initialRecords, totalCount }) =>
      usePaginatedCollection({
        initialRecords,
        totalCount,
        fetchMore,
        fetchSize: 2,
      }),
    {
      initialProps: {
        initialRecords: [1, 2],
        totalCount: 4,
      },
    }
  );

  let request: Promise<ReadonlyArray<number> | undefined> | undefined;
  act(() => {
    request = result.current.onFetchMore();
  });
  rerender({
    initialRecords: [3, 4],
    totalCount: 2,
  });

  await act(async () => {
    resolveFetch?.([5, 6]);
    await request;
  });

  expect(result.current.results[0]).toEqual([3, 4]);
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
