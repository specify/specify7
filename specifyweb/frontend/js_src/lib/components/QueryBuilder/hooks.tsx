import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import type { GetOrSet, IR, R, RA } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { raise, softFail } from '../Errors/Crash';
import type { QueryResultRow, QueryResultsProps } from './Results';

export function useFetchQueryResults({
  initialData,
  fetchResults,
  totalCount: initialTotalCount,
  fetchSize,
}: Pick<
  QueryResultsProps,
  'fetchResults' | 'fetchSize' | 'initialData' | 'totalCount'
>): {
  readonly results: GetOrSet<RA<QueryResultRow | undefined> | undefined>;
  readonly fetchersRef: {
    readonly current: IR<Promise<RA<QueryResultRow> | void>>;
  };
  readonly onFetchMore: (index?: number) => Promise<RA<QueryResultRow> | void>;
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
    RA<QueryResultRow | undefined> | undefined
  >(initialData);
  const [results, setResults] = getSetResults;
  const resultsRef = React.useRef(results);
  const handleSetResults: GetOrSet<
    RA<QueryResultRow | undefined> | undefined
  >[1] = React.useCallback(
    (results) => {
      const resolved =
        typeof results === 'function' ? results(resultsRef.current) : results;
      setResults(resolved);
      resultsRef.current = resolved;
    },
    [setResults]
  );

  // Queue for fetching
  const fetchersRef = React.useRef<R<Promise<RA<QueryResultRow> | void>>>({});

  const getSetTotalCount = useTriggerState(initialTotalCount);
  const [totalCount] = getSetTotalCount;
  const canFetchMore =
    !Array.isArray(results) ||
    totalCount === undefined ||
    results.length < totalCount;

  const handleFetchMore = React.useCallback(
    async (index?: number): Promise<RA<QueryResultRow> | void> => {
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
      fetchersRef.current[fetchIndex] ??= fetchResults(fetchIndex)
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

          handleSetResults(combinedResults);

          fetchersRef.current = removeKey(
            fetchersRef.current,
            fetchIndex.toString()
          );

          if (typeof index === 'number' && index >= combinedResults.length)
            return handleFetchMore(index);
          return newResults;
        })
        .catch(raise);

      return fetchersRef.current[fetchIndex];
    },
    [fetchResults, fetchSize, setResults, totalCount]
  );

  return {
    fetchersRef,
    results: [results, handleSetResults],
    onFetchMore: handleFetchMore,
    totalCount: getSetTotalCount,
    canFetchMore,
  };
}
