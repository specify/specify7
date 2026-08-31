import React from 'react';
import Splitter from 'm-react-splitters';
import { useParams } from 'react-router-dom';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource } from '../DataModel/resource';
import { SpecifyTable } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { ResourceView } from '../Forms/ResourceView';
import { commonText } from '../../localization/common';
import { dataViewsText } from '../../localization/dataViews';
import type { SpQuery } from '../DataModel/types';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Container, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { loadingGif } from '../Molecules';
import { Http } from '../../utils/ajax/definitions';
import { userPreferences } from '../Preferences/userPreferences';
import { interactionsText } from '../../localization/interactions';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import {
  flippedSortTypes,
  type SortTypes,
  sortTypes,
} from '../QueryBuilder/helpers';
import { QueryResultsTable } from '../QueryBuilder/ResultsTable';
import { type QueryResultRow, TableHeaderCell } from '../QueryBuilder/Results';
import { runQuery } from '../QueryBuilder/ResultsWrapper';
import { QueryToForms } from '../QueryBuilder/ToForms';
import { queryCountPromiseGenerator } from '../Statistics/hooks';

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

/** The table's saved Data View query (Spquery.isDataView=true), or false if none exists */
function useDataViewQuery(
  table: SpecifyTable
): SerializedResource<SpQuery> | false | undefined {
  const [query] = useAsyncState<SerializedResource<SpQuery> | false>(
    React.useCallback(async () => {
      const { records } = await fetchCollection('SpQuery', {
        contextTableId: table.tableId,
        isDataView: true,
        domainFilter: false,
        limit: 1,
      });
      return records.length === 0
        ? false
        : fetchResource('SpQuery', records[0].id);
    }, [table]),
    true
  );
  return query;
}

function DataViewFromTableWrapped<SCHEMA extends AnySchema>({
  table,
}: {
  readonly table: SpecifyTable<SCHEMA>;
}): JSX.Element | null {
  const dataViewQuery = useDataViewQuery(table);

  const displayFields = React.useMemo(
    () =>
      dataViewQuery === undefined || dataViewQuery === false
        ? undefined
        : dataViewQuery.fields
            .filter((field) => field.isDisplay)
            .sort((left, right) => left.position - right.position),
    [dataViewQuery]
  );

  const fieldSpecs = React.useMemo(
    () =>
      displayFields?.map((field) =>
        QueryFieldSpec.fromStringId(field.stringId, field.isRelFld ?? false)
      ),
    [displayFields]
  );

  const [columnSort, setColumnSort] = React.useState<RA<SortTypes>>([]);
  React.useEffect(
    () =>
      setColumnSort(
        displayFields?.map((field) => sortTypes[field.sortType]) ?? []
      ),
    [displayFields]
  );

  // The executed query, with each display field's sortType overridden by columnSort
  const sortedQuery = React.useMemo(():
    | SerializedResource<SpQuery>
    | undefined => {
    if (
      displayFields === undefined ||
      dataViewQuery === undefined ||
      dataViewQuery === false
    )
      return undefined;
    const sortByStringId = new Map(
      displayFields.map((field, index) => [field.stringId, columnSort[index]])
    );
    return {
      ...dataViewQuery,
      fields: dataViewQuery.fields.map((field) =>
        sortByStringId.has(field.stringId)
          ? {
              ...field,
              sortType:
                flippedSortTypes[sortByStringId.get(field.stringId) ?? 'none'],
            }
          : field
      ),
    };
  }, [dataViewQuery, displayFields, columnSort]);

  const totalCountRef = React.useRef<number | undefined>(undefined);

  const fetchRows = React.useCallback(
    async (
      offset: number,
      limit = DEFAULT_FETCH_LIMIT
    ): Promise<RA<QueryResultRow>> => {
      if (
        dataViewQuery === undefined ||
        dataViewQuery === false ||
        sortedQuery === undefined
      )
        return [];
      if (totalCountRef.current === undefined) {
        const countResponse = await queryCountPromiseGenerator(dataViewQuery)();
        totalCountRef.current =
          countResponse.status === Http.OK ? countResponse.data.count : 0;
      }
      return runQuery<QueryResultRow>(sortedQuery, { limit, offset });
    },
    [dataViewQuery, sortedQuery]
  );

  const [initialRows] = useAsyncState(
    React.useCallback(
      async () => (dataViewQuery === undefined ? undefined : fetchRows(0)),
      [dataViewQuery, fetchRows]
    ),
    true
  );

  if (dataViewQuery === false)
    return (
      <Container.Full className="h-full items-center justify-center">
        <p>{dataViewsText.noDataViewQuery()}</p>
      </Container.Full>
    );

  return fieldSpecs === undefined || initialRows === undefined ? null : (
    <DataViewFromTable
      key={`${table.name}:${columnSort.join(',')}`}
      table={table}
      columnSort={columnSort}
      fieldSpecs={fieldSpecs}
      initialRows={initialRows}
      totalCount={totalCountRef.current ?? initialRows.length}
      onFetchRows={fetchRows}
      onSortChange={(index, sortType): void =>
        setColumnSort((previous) => replaceItem(previous, index, sortType))
      }
    />
  );
}

function DataViewFromTable<SCHEMA extends AnySchema>({
  table,
  fieldSpecs,
  totalCount,
  initialRows,
  columnSort,
  onFetchRows: handleFetchRows,
  onSortChange: handleSortChange,
}: {
  readonly table: SpecifyTable<SCHEMA>;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly totalCount: number;
  readonly initialRows: RA<QueryResultRow>;
  readonly columnSort: RA<SortTypes>;
  readonly onFetchRows: (
    offset: number,
    limit?: number
  ) => Promise<RA<QueryResultRow>>;
  readonly onSortChange: (index: number, sortType: SortTypes) => void;
}): JSX.Element | null {
  const [rows, setRows] = React.useState<RA<QueryResultRow>>(initialRows);
  const [selectedRows, setSelectedRows] = React.useState<ReadonlySet<number>>(
    new Set()
  );
  const [activeId, setActiveId] = React.useState<number | undefined>(undefined);
  const canFetchMore = rows.length < totalCount;

  const [showLineNumber] = userPreferences.use(
    'queryBuilder',
    'appearance',
    'showLineNumber'
  );

  const handleLoadMore = React.useCallback(async (): Promise<void> => {
    const newRows = await handleFetchRows(rows.length);
    setRows((previousRows) => [...previousRows, ...newRows]);
  }, [handleFetchRows, rows.length]);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const { isFetching, handleScroll } = useInfiniteScroll(
    canFetchMore ? handleLoadMore : undefined,
    scrollerRef
  );

  const handleDelete = (id: number): void => {
    setRows((previousRows) => previousRows.filter((row) => row[0] !== id));
    setSelectedRows(
      (previousSelected) =>
        new Set(Array.from(previousSelected).filter((rowId) => rowId !== id))
    );
    setActiveId((previousActiveId) =>
      previousActiveId === id ? undefined : previousActiveId
    );
  };

  const handleSaved = async (): Promise<void> => {
    const refreshedRows = await handleFetchRows(0, rows.length);
    setRows(refreshedRows);
  };

  return (
    <Container.Full className="h-full">
      <div className="flex items-center items-stretch gap-2">
        <H3>
          {commonText.colonLine({
            label: dataViewsText.tableRecords({ tableLabel: table.label }),
            value: `(${
              selectedRows.size === 0
                ? totalCount
                : `${selectedRows.size}/${totalCount}`
            })`,
          })}
        </H3>
        {selectedRows.size > 0 && (
          <Button.Small onClick={(): void => setSelectedRows(new Set())}>
            {interactionsText.deselectAll()}
          </Button.Small>
        )}
        <div className="-ml-2 flex-1" />
        <QueryToForms
          table={table}
          results={rows}
          selectedRows={selectedRows}
          totalCount={selectedRows.size === 0 ? rows.length : selectedRows.size}
          onDelete={handleDelete}
          onFetchMore={undefined}
        />
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded border border-gray-500">
        <Splitter
          className="flex flex-1 overflow-hidden"
          position="vertical"
          primaryPaneMaxWidth="80%"
          primaryPaneMinWidth="30%"
          primaryPaneWidth="55%"
        >
          <div
            className="grid-table h-full auto-rows-min overflow-auto"
            ref={scrollerRef}
            role="table"
            onScroll={handleScroll}
            style={{
              gridTemplateColumns: [
                ...(showLineNumber ? ['min-content'] : []),
                'min-content',
                'min-content',
                ...fieldSpecs.map(() => 'minmax(120px,1fr)'),
              ].join(' '),
            }}
          >
            <div role="rowgroup">
              <div role="row">
                {showLineNumber && (
                  <TableHeaderCell
                    fieldSpec={undefined}
                    sortConfig={undefined}
                  />
                )}
                <TableHeaderCell fieldSpec={undefined} sortConfig={undefined} />
                <TableHeaderCell fieldSpec={undefined} sortConfig={undefined} />
                {fieldSpecs.map((fieldSpec, index) => (
                  <TableHeaderCell
                    fieldSpec={fieldSpec}
                    key={index}
                    sortConfig={columnSort[index]}
                    onSortChange={(sortType): void =>
                      handleSortChange(index, sortType)
                    }
                  />
                ))}
              </div>
            </div>
            <div role="rowgroup">
              <QueryResultsTable
                fieldSpecs={fieldSpecs}
                results={rows}
                selectedRows={selectedRows}
                showCellEllipsis
                table={table}
                wrapQueryResults={false}
                onSelected={(index, isSelected, isShiftClick): void => {
                  const id = rows[index][0] as number;
                  setSelectedRows((previousSelected) => {
                    const newSelected = new Set(previousSelected);
                    if (isSelected) newSelected.add(id);
                    else newSelected.delete(id);
                    return newSelected;
                  });
                  if (isShiftClick) return;
                  setActiveId((previousActiveId) =>
                    isSelected
                      ? id
                      : previousActiveId === id
                        ? undefined
                        : previousActiveId
                  );
                }}
              />
              {isFetching && (
                <div className="col-span-full" role="cell">
                  {loadingGif}
                </div>
              )}
            </div>
          </div>
          <DataViewRecordPane
            recordId={activeId}
            table={table}
            onClose={(): void => setActiveId(undefined)}
            onDeleted={(id): void => handleDelete(id)}
            onSaved={(): void => void handleSaved()}
          />
        </Splitter>
      </div>
    </Container.Full>
  );
}

function DataViewRecordPane<SCHEMA extends AnySchema>({
  table,
  recordId,
  onClose: handleClose,
  onSaved: handleSaved,
  onDeleted: handleDeleted,
}: {
  readonly table: SpecifyTable<SCHEMA>;
  readonly recordId: number | undefined;
  readonly onClose: () => void;
  readonly onSaved: (id: number) => void;
  readonly onDeleted: (id: number) => void;
}): JSX.Element {
  const resource = React.useMemo<SpecifyResource<SCHEMA> | undefined>(
    () =>
      recordId === undefined ? undefined : new table.Resource({ id: recordId }),
    [table, recordId]
  );

  return (
    <div className="flex h-full flex-col overflow-auto border-l border-gray-500 p-2">
      {resource === undefined ? (
        <div className="flex flex-1 items-center justify-center text-center text-gray-500">
          {dataViewsText.selectRecordToView()}
        </div>
      ) : (
        <ResourceView
          dialog={false}
          isDependent={false}
          isSubForm={false}
          resource={resource}
          onAdd={undefined}
          onClose={handleClose}
          onDeleted={(): void => handleDeleted(recordId!)}
          onSaved={(): void => handleSaved(recordId!)}
        />
      )}
    </div>
  );
}
