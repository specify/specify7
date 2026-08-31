import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { dataViewsText } from '../../localization/dataViews';
import { commonText } from '../../localization/common';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource, resourceOn } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpQuery } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { createQuery } from '../QueryBuilder';
import { QueryBuilder } from '../QueryBuilder/Wrapped';

/**
 * Let a user create or edit the single "Data View" query for a table
 */
export function DataViewQueryEditor({
  table,
  queryId,
  onClose: handleClose,
  onSaved: handleSaved,
}: {
  readonly table: SpecifyTable;
  readonly queryId: number | undefined;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}): JSX.Element | null {
  const [query] = useAsyncState<SpecifyResource<SpQuery>>(
    React.useCallback(async () => {
      if (typeof queryId === 'number')
        return fetchResource('SpQuery', queryId).then(deserializeResource);
      const newQuery = createQuery(
        dataViewsText.dataViewQueryName({ tableLabel: table.label }),
        table
      );
      newQuery.set('isDataView', true);
      return newQuery;
    }, [queryId, table]),
    true
  );

  React.useEffect(
    () =>
      query === undefined
        ? undefined
        : resourceOn(query, 'saved', handleSaved, false),
    [query, handleSaved]
  );

  return query === undefined ? null : (
    <Dialog
      buttons={commonText.close()}
      className={{ container: dialogClassNames.wideContainer }}
      header={dataViewsText.dataViewQueryEditorTitle({
        tableLabel: table.label,
      })}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun={false}
        forceCollection={undefined}
        hideRunButton
        query={query}
        recordSet={undefined}
      />
    </Dialog>
  );
}
