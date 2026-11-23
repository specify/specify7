import React from 'react';

import { usePaginatedCollection } from '../../hooks/usePaginatedCollection';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { raise } from '../Errors/Crash';
import type { QueryResultRow } from './Results';
import type { SelectedQuery } from './selection';
import { isSelectionEmpty, selectionPayload } from './selection';

const fetchSize = 40;

export function fetchSelectedQuery(
  selectedQuery: SelectedQuery,
  countOnly: true
): Promise<{ readonly count: number }>;
export function fetchSelectedQuery(
  selectedQuery: SelectedQuery,
  countOnly: false,
  offset?: number
): Promise<{ readonly results: RA<QueryResultRow> }>;
export async function fetchSelectedQuery(
  { query, selection }: SelectedQuery,
  countOnly: boolean,
  offset = 0
): Promise<
  { readonly results: RA<QueryResultRow> } | { readonly count: number }
> {
  const { data } = await ajax<
    { readonly results: RA<QueryResultRow> } | { readonly count: number }
  >('/stored_query/ephemeral/', {
    method: 'POST',
    errorMode: 'dismissible',
    headers: { Accept: 'application/json' },
    body: keysToLowerCase({
      ...query,
      selection: selectionPayload(selection),
      countOnly,
      limit: fetchSize,
      offset,
    }),
  });
  return data;
}

export function useSelectedQueryCount(
  selectedQuery: SelectedQuery | undefined,
  totalCount: number | undefined
): number | undefined {
  const [result, setResult] = React.useState<{
    readonly query: SelectedQuery;
    readonly count: number;
  }>();
  React.useEffect(() => {
    if (selectedQuery === undefined || selectedQuery.selection.ids.size === 0)
      return;
    let current = true;
    const timer = globalThis.setTimeout(() => {
      // Count exceptions rather than scanning the potentially huge complement.
      fetchSelectedQuery(
        {
          ...selectedQuery,
          selection: { ...selectedQuery.selection, mode: 'include' },
        },
        true
      )
        .then(({ count }) => {
          if (current) setResult({ query: selectedQuery, count });
        })
        .catch((error) => {
          if (current) raise(error);
        });
    }, 150);
    return (): void => {
      current = false;
      globalThis.clearTimeout(timer);
    };
  }, [selectedQuery]);
  if (selectedQuery === undefined) return undefined;
  if (isSelectionEmpty(selectedQuery.selection)) return 0;
  if (selectedQuery.selection.ids.size === 0) return totalCount;
  if (result?.query !== selectedQuery) return undefined;
  return selectedQuery.selection.mode === 'include'
    ? result.count
    : totalCount === undefined
      ? undefined
      : Math.max(0, totalCount - result.count);
}

export function useSelectedQueryResults(
  selectedQuery: SelectedQuery | undefined,
  active: boolean,
  totalCount: number | undefined
) {
  const [initial, setInitial] = React.useState<{
    readonly query: SelectedQuery;
    readonly results: RA<QueryResultRow>;
  }>();
  React.useEffect(() => {
    if (selectedQuery === undefined || !active) return;
    let current = true;
    if (isSelectionEmpty(selectedQuery.selection)) {
      setInitial({ query: selectedQuery, results: [] });
      return;
    }
    fetchSelectedQuery(selectedQuery, false)
      .then(({ results }) => {
        if (current) setInitial({ query: selectedQuery, results });
      })
      .catch((error) => {
        if (current) raise(error);
      });
    return (): void => {
      current = false;
    };
  }, [selectedQuery, active]);
  const fetchMore = React.useCallback(
    async (offset: number) =>
      selectedQuery === undefined
        ? []
        : fetchSelectedQuery(selectedQuery, false, offset).then(
            ({ results }) => results
          ),
    [selectedQuery]
  );
  return usePaginatedCollection({
    initialRecords:
      initial?.query === selectedQuery ? initial?.results : undefined,
    totalCount,
    fetchSize,
    fetchMore: selectedQuery === undefined || !active ? undefined : fetchMore,
  });
}
