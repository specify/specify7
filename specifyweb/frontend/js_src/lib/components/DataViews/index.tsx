import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import {
  type CollectionFetchFilters,
  DEFAULT_FETCH_LIMIT,
  fetchCollection,
} from '../DataModel/collection';
import { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { NotFoundView } from '../Router/NotFoundView';
import { f } from '../../utils/functools';
import { commonText } from '../../localization/common';
import { dataViewsText } from '../../localization/dataViews';
import { usePaginatedCollection } from '../../hooks/usePaginatedCollection';
import { Tables } from '../DataModel/types';
import { useAsyncState } from '../../hooks/useAsyncState';
import { RA } from '../../utils/types';
import { Label } from '../Atoms/Form';
import { OrderPicker, type OrderPickerOrder } from '../Preferences/Renderers';

const tableRecordsText = dataViewsText.tableRecords as (values: {
  readonly tableLabel: LocalizedString;
}) => LocalizedString;

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
  const defaultOrder =
    table.getLiteralField('timestampCreated') === undefined
      ? '-id'
      : '-timestampcreated';
  const [order, setOrder] = React.useState<OrderPickerOrder<SCHEMA, 'id'>>(
    defaultOrder as OrderPickerOrder<SCHEMA, 'id'>
  );
  const [isScoped, setIsScoped] = React.useState(true);
  const canBeScoped =
    table.name === 'Attachment' || typeof table.getScope() === 'object';
  const handleFetchingCollection = React.useCallback(
    (offset: number = 0) =>
      fetchCollection(table.name, {
        offset,
        limit: DEFAULT_FETCH_LIMIT,
        domainFilter: isScoped,
        orderBy: order,
      } as CollectionFetchFilters<Tables[SCHEMA['tableName']]>),
    [isScoped, order, table]
  );
  const [collection] = useAsyncState(handleFetchingCollection, true);

  return collection === undefined ? null : (
    <DataViewFromTable
      key={`${order}:${isScoped}`}
      table={table}
      initialRecords={collection.records}
      totalCount={collection.totalCount}
      onFetchRecords={(index) =>
        handleFetchingCollection(index).then(({ records }) => records)
      }
      headerButtons={
        <>
          <Label.Inline>
            {dataViewsText.orderBy()}
            <div>
              <OrderPicker<SCHEMA, 'id'>
                additionalFields={[{ name: 'id', label: commonText.id() }]}
                includeHiddenFields
                includeVirtualFields={false}
                order={order}
                table={table}
                onChange={setOrder}
              />
            </div>
          </Label.Inline>
          {canBeScoped ? (
            <Label.Inline>
              <input
                checked={isScoped}
                className="h-4 w-4 accent-brand-400"
                type="checkbox"
                onChange={({ target }): void => setIsScoped(target.checked)}
              />
              {dataViewsText.useCurrentScope()}
            </Label.Inline>
          ) : undefined}
        </>
      }
    />
  );
}

function DataViewFromTable<SCHEMA extends AnySchema>({
  table,
  totalCount: initialTotalCount,
  initialRecords,
  onFetchRecords: handleFetchRecords,
  headerButtons,
}: {
  readonly table: SpecifyTable<SCHEMA>;
  readonly totalCount: number;
  readonly initialRecords: RA<SerializedResource<Tables[SCHEMA['tableName']]>>;
  readonly onFetchRecords: (
    index: number
  ) => Promise<RA<SerializedResource<Tables[SCHEMA['tableName']]>>>;
  readonly headerButtons: JSX.Element;
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
      headerButtons={headerButtons}
      dialog={false}
      ids={collection.map((record) => record?.id)}
      isDependent={false}
      isInRecordSet={false}
      newResource={undefined}
      table={table}
      title={tableRecordsText({ tableLabel: table.label })}
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
