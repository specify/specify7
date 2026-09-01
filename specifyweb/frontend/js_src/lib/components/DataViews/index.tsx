import React from 'react';
import { useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { dataViewsText } from '../../localization/dataViews';
import { DataEntry } from '../Atoms/DataEntry';
import type { Tables } from '../DataModel/types';
import { getTable } from '../DataModel/tables';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { QueryResultsWrapper } from '../QueryBuilder/ResultsWrapper';
import { parseQueryFields, unParseQueryFields } from '../QueryBuilder/helpers';
import { queryIdField } from '../QueryBuilder/Results';
import {
  SplitView,
  SplitViewOrientationButton,
  useSplitViewOrientation,
} from '../QueryBuilder/SplitView';
import { NotFoundView } from '../Router/NotFoundView';
import {
  getDataViewQueryDefinition,
  makeDataViewQuery,
  useDataViewQueries,
} from './queries';
import type { DataViewQueriesFile } from './queries';

export function TableDataView(): JSX.Element {
  const { tableName = '' } = useParams();
  const table = getTable(tableName);

  return table === undefined ? (
    <NotFoundView />
  ) : (
    <ProtectedTable tableName={table.name} action="read">
      <DataViewFromTable tableName={table.name} />
    </ProtectedTable>
  );
}

export function getNumericResultId(value: unknown): number | undefined {
  const numericId =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : undefined;
  return typeof numericId === 'number' && Number.isFinite(numericId)
    ? numericId
    : undefined;
}

function DataViewFromTable({
  tableName,
}: {
  readonly tableName: keyof Tables;
}): JSX.Element | null {
  const [queries] = useDataViewQueries();
  return queries === undefined ? null : (
    <LoadedDataViewFromTable
      key={tableName}
      tableName={tableName}
      queries={queries}
    />
  );
}

function LoadedDataViewFromTable({
  tableName,
  queries,
}: {
  readonly tableName: keyof Tables;
  readonly queries: DataViewQueriesFile;
}): JSX.Element | null {
  const table = getTable(tableName);
  const [selectedIds, setSelectedIds] = React.useState<ReadonlyArray<number>>(
    []
  );
  const selectedIdsRef = React.useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const resultOrderRef = React.useRef<ReadonlyArray<number>>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const resultsScrollRef = React.useRef<HTMLDivElement | null>(null);
  const restoreScrollTopRef = React.useRef<number | undefined>(undefined);
  const { isHorizontal, toggleOrientation } = useSplitViewOrientation();
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [queryRunCount, setQueryRunCount] = React.useState(1);
  const [runtimeFields, setRuntimeFields] = React.useState<
    ReturnType<typeof unParseQueryFields> | undefined
  >(undefined);
  const selectedRows = React.useMemo(
    () => [new Set(selectedIds), (): void => undefined] as const,
    [selectedIds]
  );
  React.useEffect(() => {
    setSelectedIds([]);
    setSelectedIndex(0);
  }, [tableName]);

  const handleResults = React.useCallback(
    (rows: ReadonlyArray<ReadonlyArray<unknown> | undefined>): void => {
      const orderedIds = rows.flatMap((row) => {
        const id = getNumericResultId(row?.[queryIdField]);
        return id === undefined ? [] : [id];
      });
      resultOrderRef.current = orderedIds;

      if (selectedIdsRef.current.length === 0) {
        const firstId = orderedIds[0];
        if (firstId !== undefined) {
          setSelectedIds([firstId]);
          setSelectedIndex(0);
        }
        return;
      }

      const positions = new Map(
        orderedIds.map((id, index) => [id, index] as const)
      );
      const reordered = [...selectedIdsRef.current].sort(
        (left, right) =>
          (positions.get(left) ?? Number.MAX_SAFE_INTEGER) -
          (positions.get(right) ?? Number.MAX_SAFE_INTEGER)
      );
      setSelectedIds(reordered);
    },
    []
  );
  const handleRefresh = React.useCallback((): void => {
    if (resultsScrollRef.current !== null)
      restoreScrollTopRef.current = resultsScrollRef.current.scrollTop;
    setRefreshToken((token) => token + 1);
  }, []);
  if (table === undefined) return null;

  const definition = React.useMemo(
    () => getDataViewQueryDefinition(queries, tableName),
    [queries, tableName]
  );
  const query = React.useMemo(
    () =>
      makeDataViewQuery(tableName, {
        ...definition,
        fields: runtimeFields ?? definition.fields,
      }),
    [definition, runtimeFields, tableName]
  );
  const fields = React.useMemo(
    () => parseQueryFields(runtimeFields ?? definition.fields),
    [definition.fields, runtimeFields]
  );

  const results = (
    <QueryResultsWrapper
      key={`${tableName}:${JSON.stringify(definition)}`}
      createRecordSet={undefined}
      extraButtons={undefined}
      onReRun={handleRefresh}
      onSortChange={(newFields): void => {
        setRuntimeFields(unParseQueryFields(table.name, newFields));
        setQueryRunCount((count) => count + 1);
      }}
      onSelected={(ids): void => {
        const positions = new Map(
          resultOrderRef.current.map((id, index) => [id, index] as const)
        );
        const orderedIds = [...ids].sort(
          (left, right) =>
            (positions.get(left) ?? Number.MAX_SAFE_INTEGER) -
            (positions.get(right) ?? Number.MAX_SAFE_INTEGER)
        );
        setSelectedIds(orderedIds);
        const focusedId = ids.at(-1);
        setSelectedIndex(
          focusedId === undefined
            ? 0
            : Math.max(0, orderedIds.indexOf(focusedId))
        );
      }}
      queryRunCount={queryRunCount}
      queryResource={query}
      recordSetId={undefined}
      forceCollection={undefined}
      fields={fields}
      selectedRows={selectedRows}
      table={table}
      onResults={handleResults}
      refreshToken={refreshToken}
      restoreScrollTopRef={restoreScrollTopRef}
      scrollRef={resultsScrollRef}
    />
  );
  const form = (
    <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto bg-[color:var(--form-background)]">
      {selectedIds.length === 0 ? (
        <p className="m-auto text-neutral-500">{commonText.select()}</p>
      ) : (
        <RecordSelectorFromIds
          canRemove={false}
          defaultIndex={selectedIndex}
          dialog={false}
          ids={[...selectedIds]}
          isDependent={false}
          isInRecordSet={false}
          newResource={undefined}
          table={table}
          title={dataViewsText.tableRecords({ tableLabel: table.label })}
          totalCount={selectedIds.length}
          onAdd={undefined}
          onClone={undefined}
          onClose={(): void => {
            setSelectedIds([]);
            setSelectedIndex(0);
          }}
          onDelete={undefined}
          onSaved={handleRefresh}
          onSlide={(index): void => setSelectedIndex(index)}
        />
      )}
    </div>
  );

  return (
    <div className="flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2">
      <DataEntry.Header className="shrink-0">
        <DataEntry.Title>
          {dataViewsText.tableRecords({ tableLabel: table.label })}
        </DataEntry.Title>
        <span className="flex-1" />
        <SplitViewOrientationButton
          isHorizontal={isHorizontal}
          onToggle={toggleOrientation}
        />
      </DataEntry.Header>
      <div className="flex h-full max-h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <SplitView
          isHorizontal={isHorizontal}
          primaryPane={results}
          primaryPaneKey="query-results"
          secondaryPane={form}
          secondaryPaneKey="record-preview"
        />
      </div>
    </div>
  );
}
