import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery } from '../DataModel/types';
import { hasPermission } from '../Permissions/helpers';

export function useQueryExecution({
  query,
  onRun,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly onRun: () => void;
}): {
  readonly isCountOnly: boolean;
  readonly runQuery: (mode: 'count' | 'regular') => void;
  readonly scheduleQueryRun: () => void;
} {
  const [isQueryRunPending, scheduleQueryRun, clearQueryRunPending] =
    useBooleanState();
  const [isCountOnly, setIsCountOnly] = React.useState(
    query.countOnly === true
  );
  const runQuery = React.useCallback(
    (mode: 'count' | 'regular'): void => {
      if (!hasPermission('/querybuilder/query', 'execute')) return;
      setIsCountOnly(mode === 'count');
      globalThis.setTimeout(onRun, 0);
    },
    [onRun]
  );

  React.useEffect(() => {
    if (!isQueryRunPending) return;
    clearQueryRunPending();
    runQuery('regular');
  }, [clearQueryRunPending, isQueryRunPending, runQuery]);

  return { isCountOnly, runQuery, scheduleQueryRun };
}
