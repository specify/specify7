import React from 'react';
import { useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { dataViewsText } from '../../localization/dataViews';
import { useResponsiveSplitView } from '../../hooks/useResponsiveSplitView';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission } from '../Permissions/helpers';
import {
  PermissionDenied,
  ProtectedTable,
} from '../Permissions/PermissionDenied';
import { userPreferences } from '../Preferences/userPreferences';
import { parseQueryFields, unParseQueryFields } from '../QueryBuilder/helpers';
import { queryIdField } from '../QueryBuilder/Results';
import { QueryResultsWrapper } from '../QueryBuilder/ResultsWrapper';
import {
  SplitViewOrientationButton,
  SplitViewToggleButton,
  useSplitViewOrientation,
} from '../QueryBuilder/SplitView';
import { QueryFormView } from '../QueryBuilder/ToForms';
import { NotFoundView } from '../Router/NotFoundView';
import type { DataViewQueriesFile } from './queries';
import {
  getDataViewQueryDefinition,
  makeDataViewQuery,
  saveUserDataViewQueries,
  serializeDataViewQueries,
  useDataViewQueries,
} from './queries';
import { DataViewQueryEditorContent } from './QueryEditor';

export function TableDataView(): JSX.Element {
  const { tableName = '' } = useParams();
  const table = getTable(tableName);

  return table === undefined ? (
    <NotFoundView />
  ) : (
    <ProtectedTable tableName={table.name} action="read">
      {hasPermission('/querybuilder/query', 'execute') ? (
        <DataViewFromTable tableName={table.name} />
      ) : (
        <PermissionDenied resource="/querybuilder/query" action="execute" />
      )}
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
  const [queries, reloadQueries] = useDataViewQueries();
  const lastQueriesRef = React.useRef(queries);
  if (queries !== undefined) lastQueriesRef.current = queries;
  const loadedQueries = queries ?? lastQueriesRef.current;
  return loadedQueries === undefined ? null : (
    <LoadedDataViewFromTable
      key={tableName}
      tableName={tableName}
      queries={loadedQueries}
      reloadQueries={reloadQueries}
    />
  );
}

function LoadedDataViewFromTable({
  tableName,
  queries,
  reloadQueries,
}: {
  readonly tableName: keyof Tables;
  readonly queries: DataViewQueriesFile;
  readonly reloadQueries: () => void;
}): JSX.Element | null {
  const table = getTable(tableName);
  const [selectedIds, setSelectedIds] = React.useState<ReadonlyArray<number>>(
    []
  );
  const selectedIdsRef = React.useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const resultOrderRef = React.useRef<ReadonlyArray<number>>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const selectedIndexRef = React.useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const resultsScrollRef = React.useRef<HTMLDivElement | null>(null);
  const restoreScrollTopRef = React.useRef<number | undefined>(undefined);
  const [splitViewByDefault] = userPreferences.use(
    'dataViews',
    'general',
    'splitViewByDefault'
  );
  const [splitViewOrientation] = userPreferences.use(
    'dataViews',
    'general',
    'splitViewOrientation'
  );
  const [rawIsSplit, setIsSplit] = React.useState(splitViewByDefault);
  const isSplit = rawIsSplit;
  const { isHorizontal: preferredIsHorizontal, toggleOrientation } =
    useSplitViewOrientation(splitViewOrientation === 'horizontal');
  const {
    canUseHorizontalSplit,
    containerRef: splitViewRef,
    isHorizontal,
    maximumPrimaryPaneWidth,
  } = useResponsiveSplitView(preferredIsHorizontal);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [queryRunCount, setQueryRunCount] = React.useState(1);
  const [queryData, setQueryData] = React.useState<string | undefined>();
  const [isQueryDirty, setIsQueryDirty] = React.useState(false);
  const [isSavingQuery, setIsSavingQuery] = React.useState(false);
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
      const focusedId = selectedIdsRef.current[selectedIndexRef.current];
      const orderedIds = rows.flatMap((row) => {
        const id = getNumericResultId(row?.[queryIdField]);
        return id === undefined ? [] : [id];
      });
      resultOrderRef.current = orderedIds;

      if (selectedIdsRef.current.length === 0) return;

      const positions = new Map(
        orderedIds.map((id, index) => [id, index] as const)
      );
      const reordered = selectedIdsRef.current
        .filter((id) => positions.has(id))
        .sort((left, right) => positions.get(left)! - positions.get(right)!);
      if (reordered.length === 0) {
        setSelectedIds([]);
        setSelectedIndex(0);
        return;
      }
      setSelectedIds(reordered);
      const focusedIndex = reordered.indexOf(focusedId);
      setSelectedIndex(
        focusedIndex >= 0
          ? focusedIndex
          : Math.min(selectedIndexRef.current, reordered.length - 1)
      );
    },
    []
  );
  const handleRefresh = React.useCallback((): void => {
    if (resultsScrollRef.current !== null)
      restoreScrollTopRef.current = resultsScrollRef.current.scrollTop;
    setRefreshToken((token) => token + 1);
  }, []);
  const handleCloseQueryEditor = (): void => setQueryData(undefined);
  const handleOpenQueryEditor = (): void => {
    setIsQueryDirty(false);
    setQueryData(
      serializeDataViewQueries({
        version: 1,
        queries: {
          [tableName]: getDataViewQueryDefinition(queries, tableName),
        },
      })
    );
  };

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

  if (table === undefined) return null;

  if (queryData !== undefined)
    return (
      <Dialog
        buttons={
          <>
            <Button.Secondary
              disabled={isSavingQuery}
              onClick={handleCloseQueryEditor}
            >
              {commonText.cancel()}
            </Button.Secondary>
            <Button.Success
              disabled={isSavingQuery || !isQueryDirty}
              onClick={(): void => {
                if (isSavingQuery || !isQueryDirty) return;
                setIsSavingQuery(true);
                saveUserDataViewQueries(queryData, tableName)
                  .then(() => {
                    setRuntimeFields(undefined);
                    reloadQueries();
                  })
                  .then(handleCloseQueryEditor)
                  .catch(raise)
                  .finally(() => setIsSavingQuery(false));
              }}
            >
              {commonText.save()}
            </Button.Success>
          </>
        }
        header={dataViewsText.configureQuery()}
        onClose={isSavingQuery ? undefined : handleCloseQueryEditor}
      >
        <DataViewQueryEditorContent
          data={queryData}
          tableName={tableName}
          onChange={(nextData): void => {
            setQueryData(nextData);
            setIsQueryDirty(true);
          }}
        />
      </Dialog>
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
      containerClassName="!rounded-none"
      tableClassName="rounded-none"
      fields={fields}
      selectedRows={selectedRows}
      table={table}
      onResults={handleResults}
      refreshToken={refreshToken}
      isSplit={isSplit}
      splitHorizontal={isHorizontal}
      splitPrimaryPaneMaxWidth={`${maximumPrimaryPaneWidth}px`}
      renderSplitPane={({
        results,
        selectedRows: resultSelection,
        totalCount,
        onFetchMore,
        onDelete,
      }) => (
        <QueryFormView
          results={results}
          selectedRows={resultSelection}
          selectedIndex={selectedIndex}
          table={table}
          title={dataViewsText.tableRecords({ tableLabel: table.label })}
          totalCount={totalCount}
          onClose={(): void => {
            setSelectedIds([]);
            setSelectedIndex(0);
          }}
          onDelete={onDelete}
          onFetchMore={onFetchMore}
          onSaved={handleRefresh}
          onSlide={setSelectedIndex}
        />
      )}
      restoreScrollTopRef={restoreScrollTopRef}
      scrollRef={resultsScrollRef}
    />
  );

  return (
    <div className="flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-col items-center justify-between gap-2 overflow-x-auto whitespace-nowrap sm:flex-row sm:overflow-x-visible p-4">
        <div className="flex items-center justify-center gap-2">
          <TableIcon label name={table.name} />
          <H2 className="overflow-x-auto">
            {dataViewsText.tableRecords({ tableLabel: table.label })}
          </H2>
          <DataEntry.Edit onClick={handleOpenQueryEditor} />
        </div>
        <SplitViewToggleButton
          isSplit={isSplit}
          onToggle={(): void => setIsSplit((split) => !split)}
        />
        <SplitViewOrientationButton
          disabled={!isSplit || !canUseHorizontalSplit}
          isHorizontal={isHorizontal}
          onToggle={toggleOrientation}
        />
        <span className="-ml-2 flex-1" />
      </header>
      <div
        className="flex h-full max-h-full min-h-0 min-w-0 flex-1 overflow-hidden"
        ref={splitViewRef}
      >
        {results}
      </div>
    </div>
  );
}
