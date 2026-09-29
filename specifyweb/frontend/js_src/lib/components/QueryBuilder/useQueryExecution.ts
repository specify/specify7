import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery, SpQueryField } from '../DataModel/types';
import { hasPermission } from '../Permissions/helpers';
import type { RA } from '../../utils/types';
import type { QueryField } from './helpers';

export function useQueryExecution({
  query,
  fields,
  getQueryFieldRecords,
  setQuery,
  onRun,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly getQueryFieldRecords:
    | ((fields: RA<QueryField>) => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly setQuery: (query: SerializedResource<SpQuery>) => void;
  readonly onRun: () => void;
}): {
  readonly runQuery: (
    mode: 'count' | 'regular',
    fields?: RA<QueryField>
  ) => void;
  readonly scheduleQueryRun: () => void;
} {
  const [isQueryRunPending, scheduleQueryRun, clearQueryRunPending] =
    useBooleanState();
  const runQuery = React.useCallback(
    (mode: 'count' | 'regular', queryFields: RA<QueryField> = fields): void => {
      if (!hasPermission('/querybuilder/query', 'execute')) return;
      setQuery({
        ...query,
        fields: getQueryFieldRecords?.(queryFields) ?? query.fields,
        countOnly: mode === 'count',
      });
      globalThis.setTimeout(onRun, 0);
    },
    [fields, getQueryFieldRecords, onRun, query, setQuery]
  );

  React.useEffect(() => {
    if (!isQueryRunPending) return;
    clearQueryRunPending();
    runQuery('regular');
  }, [clearQueryRunPending, isQueryRunPending, runQuery]);

  return { runQuery, scheduleQueryRun };
}
