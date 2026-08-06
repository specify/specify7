import React from 'react';
import { useParams } from 'react-router-dom';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { NotFoundView } from '../Router/NotFoundView';
import { f } from '../../utils/functools';
import { dataViewsText } from '../../localization/dataViews';
import { usePaginatedCollection } from '../../hooks/usePaginatedCollection';
import { Tables } from '../DataModel/types';
import { useAsyncState } from '../../hooks/useAsyncState';
import { RA } from '../../utils/types';

export function TableDataView(): JSX.Element {
  const { tableName = '' } = useParams();

  const table = getTable(tableName);

  return table === undefined ? (
    <NotFoundView />
  ) : (
    <ProtectedTable tableName={table.name} action="read">
      <DataViewFromTableWrapped table={table} />
    </ProtectedTable>
  );
}

function DataViewFromTableWrapped<SCHEMA extends AnySchema>({
  table,
}: {
  readonly table: SpecifyTable<SCHEMA>;
}): JSX.Element | null {
  const handleFetchingCollection = React.useCallback(
    (offset: number = 0) =>
      fetchCollection(table.name, {
        offset,
        limit: DEFAULT_FETCH_LIMIT,
        domainFilter: true,
        orderBy:
          table.getLiteralField('timestampCreated') === undefined
            ? '-id'
            : '-timestampcreated',
      }),
    [table]
  );
  const [collection] = useAsyncState(handleFetchingCollection, true);

  return collection === undefined ? null : (
    <DataViewFromTable
      table={table}
      initialRecords={collection.records}
      totalCount={collection.totalCount}
      onFetchRecords={(index) =>
        handleFetchingCollection(index).then(({ records }) => records)
      }
    />
  );
}

function DataViewFromTable<SCHEMA extends AnySchema>({
  table,
  totalCount: initialTotalCount,
  initialRecords,
  onFetchRecords: handleFetchRecords,
}: {
  readonly table: SpecifyTable<SCHEMA>;
  readonly totalCount: number;
  readonly initialRecords: RA<SerializedResource<Tables[SCHEMA['tableName']]>>;
  readonly onFetchRecords: (
    index: number
  ) => Promise<RA<SerializedResource<Tables[SCHEMA['tableName']]>>>;
}): JSX.Element | null {
  // FEATURE: Use useNavigator and keep current record/index in query
  // parameter of page

  const {
    results: [collection],
    totalCount: [totalCount],
    onFetchMore: handleFetchMore,
  } = usePaginatedCollection({
    fetchMore: handleFetchRecords,
    initialRecords,
    totalCount: initialTotalCount,
  });

  return collection === undefined ? null : (
    <RecordSelectorFromIds
      canRemove={false}
      defaultIndex={0}
      // FEATURE: Add support for sorting on one or more fields, and specifying
      // whether records should be scoped or not
      // headerButtons={
      //   <>
      //     <span className="-ml-2 " />
      //     <OrderPicker
      //       table={table}
      //       order={'catalogNumber'}
      //       onChange={(order) => order}
      //     />
      //   </>
      // }
      dialog={false}
      ids={collection.map(({ id }) => id)}
      isDependent={false}
      isInRecordSet={false}
      newResource={undefined}
      table={table}
      title={dataViewsText.tableRecords({ tableLabel: table.label })}
      totalCount={totalCount}
      onAdd={undefined}
      onClone={undefined}
      onClose={() => undefined}
      onDelete={undefined}
      onSaved={f.void}
      onSlide={(new_index) => {
        handleFetchMore(new_index);
      }}
    />
  );
}
