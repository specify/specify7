import React from 'react';
import { useTriggerState } from '../../hooks/useTriggerState';
import { GetOrSet, R, RA } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { DEFAULT_FETCH_LIMIT } from '../DataModel/collection';
import { raise, softFail } from '../Errors/Crash';

/**
 * Provides a way to somewhat lazily paginate through an arbitary set of
 * records.
 * Pseudocode Example:
 * ```ts
 * // Say we have some record IDs that can be in some set of arbitary size, and
 * // we want to handle pagination within that set.
 * const initialIds = [1, 2, 3];
 * const totalCount = 200;
 * // The "fetch" function fetches a page of records at some offset up to some
 * // limit
 * const fetchMoreIds = (offset: number) => fetch("url", {offset, limit: 20});
 * const {
 *   results: [results, setResults],
 *   onFetchMore: handleFetchMore,
 *   totalCount: [totalCount, setTotalCount],
 *   canFetchMore
 * } = usePaginatedRecords({
 *      initialData: initialIds,
 *      totalCount,
 *      fetchSize: 3,
 *      fetchResults: fetchMoreIds
 * });
 *
 * // We can call handleFetchMore to automatically grab the next fetchSize
 * // records
 * const fetchedNext = await handleFetchMore();
 * console.log(fetchedNext); // [4, 5, 6]
 * // Now results will have the next fetchSize results
 * console.log(results); // [1, 2, 3, 4, 5, 6]
 * // We can pass in a specific index to fetch only from that index
 * const fetchFromFar = await handleFetchMore(100);
 * console.log(fetchFromFar); // [99, 100, 101]
 * // Note that the results array can be sparse, with holes at the indexes
 * // where results have not been fetched
 * console.log(results);
 * // [1, 2, 3, 4, 5, 6, <holes at in-between indexes>, 99, 100, 101]
 * ```
 */
export function usePaginatedRecords<
  PAGINATED_TYPE,
  FETCH_ARGS extends RA<unknown>,
>({
  initialData,
  totalCount: initialTotalCount,
  fetchSize = DEFAULT_FETCH_LIMIT,
  fetchResults,
}: {
  readonly initialData: RA<PAGINATED_TYPE> | undefined;
  readonly totalCount: number | undefined;
  readonly fetchSize?: number;
  readonly fetchResults:
    | ((offset: number, ...args: FETCH_ARGS) => Promise<RA<PAGINATED_TYPE>>)
    | undefined;
}): {
  readonly results: GetOrSet<RA<PAGINATED_TYPE | undefined> | undefined>;
  readonly onFetchMore: (
    index?: number,
    ...args: FETCH_ARGS
  ) => Promise<RA<PAGINATED_TYPE> | void>;
  readonly totalCount: GetOrSet<number | undefined>;
  readonly canFetchMore: boolean;
} {
  /*
   * Warning:
   * "results" can be a sparse array. Using sparse array to allow
   * efficiently retrieving the last query result in a query that returns
   * hundreds of thousands of results.
   */
  const getSetResults = useTriggerState<
    RA<PAGINATED_TYPE | undefined> | undefined
  >(initialData);
  const [results, setResults] = getSetResults;
  const resultsRef = React.useRef(results);

  // Queue for fetching
  const fetchersRef = React.useRef<R<Promise<RA<PAGINATED_TYPE> | void>>>({});

  const getSetTotalCount = useTriggerState(initialTotalCount);
  const [totalCount] = getSetTotalCount;

  const canFetchMore =
    !Array.isArray(results) ||
    totalCount === undefined ||
    results.length < totalCount;

  const handleFetchMore = React.useCallback(
    async (
      index?: number,
      ...args: FETCH_ARGS
    ): Promise<RA<PAGINATED_TYPE> | void> => {
      const currentResults = resultsRef.current;
      const canFetch = Array.isArray(currentResults);

      if (!canFetch || fetchResults === undefined) return undefined;

      const alreadyFetched =
        currentResults.length === totalCount &&
        !currentResults.includes(undefined);
      if (alreadyFetched) return undefined;

      /*
       * REFACTOR: make this smarter
       *   when going to the last record, fetch 40 before the last
       *   when somewhere in the middle, adjust the fetch region to get the
       *   most unhatched records fetched
       */
      const naiveFetchIndex = index ?? currentResults.length;
      if (currentResults[naiveFetchIndex] !== undefined) return undefined;

      const fetchIndex =
        /* If navigating backwards, fetch the previous 40 records */
        typeof index === 'number' &&
        typeof currentResults[index + 1] === 'object' &&
        currentResults[index - 1] === undefined &&
        index > fetchSize
          ? naiveFetchIndex - fetchSize + 1
          : naiveFetchIndex;

      // Prevent concurrent fetching in different places
      fetchersRef.current[fetchIndex] ??= fetchResults(fetchIndex, ...args)
        .then(async (newResults) => {
          if (
            process.env.NODE_ENV === 'development' &&
            newResults.length > fetchSize
          )
            softFail(
              new Error(
                `Returned ${newResults.length} results, when expected at most ${fetchSize}`
              )
            );

          // Results might have changed while fetching
          const newCurrentResults = resultsRef.current ?? currentResults;

          // Not using Array.from() so as not to expand the sparse array
          const combinedResults = newCurrentResults.slice();
          /*
           * This extends the sparse array to fit new results. Without this,
           * splice won't place the results in the correct place.
           */
          combinedResults[fetchIndex] ??= undefined;
          combinedResults.splice(fetchIndex, newResults.length, ...newResults);

          setResults(combinedResults);

          fetchersRef.current = removeKey(
            fetchersRef.current,
            fetchIndex.toString()
          );

          if (typeof index === 'number' && index >= combinedResults.length)
            return handleFetchMore(index, ...args);
          return newResults;
        })
        .catch(raise);

      return fetchersRef.current[fetchIndex];
    },
    [fetchResults, fetchSize, setResults, totalCount]
  );

  return {
    results: [results, setResults],
    onFetchMore: handleFetchMore,
    totalCount: getSetTotalCount,
    canFetchMore,
  };
}
