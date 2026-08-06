import React from 'react';
import { GetOrSet, R, RA } from '../utils/types';
import { useTriggerState } from './useTriggerState';
import { removeKey, SET } from '../utils/utils';
import { DEFAULT_FETCH_LIMIT } from '../components/DataModel/collection';
import { raise, softFail } from '../components/Errors/Crash';

export function usePaginatedCollection<COLLECTION_TYPE>({
  initialRecords,
  totalCount: initialTotalCount,
  fetchSize = DEFAULT_FETCH_LIMIT,
  fetchMore: rawHandleFetchMore,
}: {
  readonly initialRecords?: RA<COLLECTION_TYPE>;
  readonly totalCount?: number;
  readonly fetchSize?: number;
  readonly fetchMore:
    | ((offset: number) => Promise<RA<COLLECTION_TYPE>>)
    | undefined;
}) {
  const [results, setResults] = useTriggerState<
    RA<COLLECTION_TYPE> | undefined
  >(initialRecords);
  const resultsRef = React.useRef(results);
  const handleSetResults: GetOrSet<
    RA<COLLECTION_TYPE> | undefined
  >[typeof SET] = React.useCallback(
    (results) => {
      const resolved =
        typeof results === 'function' ? results(resultsRef.current) : results;
      setResults(resolved);
      resultsRef.current = resolved;
    },
    [setResults]
  );

  // Queue for fetching
  const fetchersRef = React.useRef<R<Promise<RA<COLLECTION_TYPE> | undefined>>>(
    {}
  );

  const getSetTotalCount = useTriggerState<number | undefined>(
    initialTotalCount
  );
  const [totalCount] = getSetTotalCount;
  const canFetchMore =
    !Array.isArray(results) ||
    totalCount === undefined ||
    results.length < totalCount;

  const internalFetchMore = React.useCallback(
    async (index: number = 0): Promise<RA<COLLECTION_TYPE> | undefined> => {
      const currentResults = resultsRef.current ?? [];
      if (rawHandleFetchMore == undefined) return undefined;
      // Prevent concurrent fetching in different places
      fetchersRef.current[index] ??= rawHandleFetchMore(index)
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
          combinedResults[index] ??= undefined;
          combinedResults.splice(index, newResults.length, ...newResults);

          handleSetResults(combinedResults);

          fetchersRef.current = removeKey(
            fetchersRef.current,
            index.toString()
          );

          if (typeof index === 'number' && index >= combinedResults.length)
            return handleFetchMore(index);
          return newResults;
        })
        .catch((error) => {
          raise(error);
          return undefined;
        });
      return fetchersRef.current[index];
    },
    [totalCount, setResults, rawHandleFetchMore]
  );

  const handleFetchMore = React.useCallback(
    async (index?: number): Promise<RA<COLLECTION_TYPE> | undefined> => {
      const currentResults = resultsRef.current;
      const canFetch = Array.isArray(currentResults);

      if (!canFetch || rawHandleFetchMore === undefined) return undefined;

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

      return internalFetchMore(fetchIndex);
    },
    [rawHandleFetchMore, fetchSize, setResults, totalCount]
  );

  return {
    results: [results, handleSetResults] as const,
    onFetchMore: handleFetchMore,
    totalCount: getSetTotalCount,
    canFetchMore,
  };
}
