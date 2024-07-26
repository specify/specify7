import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { f } from '../../utils/functools';
import { type GetSet, type RA } from '../../utils/types';
import { Container, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpQuery } from '../DataModel/types';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { RecordMergingLink } from '../Merging';
import { loadingGif } from '../Molecules';
import { SortIndicator } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from '../Permissions/helpers';
import { fetchPickList } from '../PickLists/fetch';
import { userPreferences } from '../Preferences/userPreferences';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { recordSetFromQueryLoading } from './Components';
import { CreateRecordSet } from './CreateRecordSet';
import type { QueryFieldSpec } from './fieldSpec';
import type { QueryField } from './helpers';
import { sortTypes } from './helpers';
import { useFetchQueryResults } from './hooks';
import { QueryResultsTable } from './ResultsTable';
import { QueryToForms } from './ToForms';
import { QueryToMap } from './ToMap';

export type QueryResultRow = RA<number | string | null>;

export type QueryResultsProps = {
  readonly table: SpecifyTable;
  readonly label?: LocalizedString;
  readonly queryResource: SpecifyResource<SpQuery> | undefined;
  /**
   * A hint for how many records a fetch can return at maximum. This is used to
   * optimize fetch performance when using "Browse in forms" and going
   * backwards in the list from the end.
   */
  readonly fetchSize: number;
  readonly fetchResults:
    | ((offset: number) => Promise<RA<QueryResultRow>>)
    | undefined;
  readonly totalCount: number | undefined;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly displayedFields: RA<QueryField>;
  readonly allFields: RA<QueryField>;
  // This is undefined when running query in countOnly mode
  readonly initialData: RA<QueryResultRow> | undefined;
  readonly sortConfig?: RA<QueryField['sortType']>;
  readonly onSelected?: (selected: RA<number>) => void;
  readonly onSortChange?: (
    fieldSpec: QueryFieldSpec,
    direction: 'ascending' | 'descending' | undefined
  ) => void;
  readonly onReRun: () => void;
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element | undefined;
  readonly tableClassName?: string;
  readonly selectedRows: GetSet<ReadonlySet<number>>;
  readonly resultsRef?: React.MutableRefObject<
    RA<QueryResultRow | undefined> | undefined
  >;
};

export function QueryResults(props: QueryResultsProps): JSX.Element {
  const {
    table,
    label = commonText.results(),
    queryResource,
    fetchResults,
    fieldSpecs,
    allFields,
    initialData,
    sortConfig,
    onSelected: handleSelected,
    onSortChange: handleSortChange,
    onReRun: handleReRun,
    createRecordSet,
    extraButtons,
    tableClassName = '',
    selectedRows: [selectedRows, setSelectedRows],
    resultsRef,
    displayedFields,
  } = props;

  const {
    results: [results, setResults],
    onFetchMore: handleFetchMore,
    totalCount: [totalCount, setTotalCount],
    canFetchMore,
  } = useFetchQueryResults(props);

  const canMergeTable = canMerge(table);

  const visibleFieldSpecs = fieldSpecs.filter(({ isPhantom }) => !isPhantom);
  if (resultsRef !== undefined) resultsRef.current = results;

  const [pickListsLoaded = false] = useAsyncState(
    React.useCallback(
      async () =>
        // Fetch all pick lists so that they are accessible synchronously later
        Promise.all(
          fieldSpecs.map(async (fieldSpec) =>
            typeof fieldSpec.parser.pickListName === 'string'
              ? fetchPickList(fieldSpec.parser.pickListName)
              : undefined
          )
        ).then(f.true),
      [fieldSpecs]
    ),
    /*
     * Loading screen is disabled because it was interrupting auto-scroll to
     * query results in query builder.
     * See https://github.com/specify/specify7/issues/1354
     */
    false
  );

  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, false);

  const lastSelectedRow = React.useRef<number | undefined>(undefined);
  // Unselect all rows when query is reRun
  React.useEffect(() => setSelectedRows(new Set()), [fieldSpecs]);

  const showResults =
    Array.isArray(results) &&
    fieldSpecs.length > 0 &&
    pickListsLoaded &&
    treeRanksLoaded;

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const { isFetching, handleScroll } = useInfiniteScroll(
    canFetchMore ? handleFetchMore : undefined,
    scrollerRef
  );

  const undefinedResult = results?.indexOf(undefined);
  const loadedResults = (
    undefinedResult === -1 ? results : results?.slice(0, undefinedResult)
  ) as RA<QueryResultRow> | undefined;

  // TEST: try deleting while records are being fetched
  /**
   * Note: this may be called with a recordId that is not part of query results
   */
  const handleDelete = React.useCallback(
    (recordId: number): void => {
      let removeCount = 0;
      function newResults(results: RA<QueryResultRow | undefined> | undefined) {
        if (!Array.isArray(results) || totalCount === undefined) return;
        const newResults = results.filter(
          (result) => result?.[queryIdField] !== recordId
        );
        removeCount = results.length - newResults.length;
        if (resultsRef !== undefined) resultsRef.current = newResults;
        return newResults;
      }
      setResults(newResults(results));
      if (removeCount === 0) return;
      setTotalCount((totalCount) =>
        totalCount === undefined ? undefined : totalCount - removeCount
      );
      const newSelectedRows = (selectedRows: ReadonlySet<number>) =>
        new Set(Array.from(selectedRows).filter((id) => id !== recordId));
      setSelectedRows(newSelectedRows(selectedRows));
    },
    [setResults, setTotalCount, totalCount]
  );

  const [showLineNumber] = userPreferences.use(
    'queryBuilder',
    'appearance',
    'showLineNumber'
  );

  const isDistinct =
    typeof loadedResults?.[0]?.[0] === 'string' && loadedResults !== undefined;
  const metaColumns = (showLineNumber ? 1 : 0) + 2;

  return (
    <Container.Base className="w-full !bg-[color:var(--form-background)]">
      <div className="flex items-center items-stretch gap-2">
        <H3>
          {commonText.colonLine({
            label,
            value: `(${
              selectedRows.size === 0
                ? totalCount ?? commonText.loading()
                : `${selectedRows.size}/${totalCount ?? commonText.loading()}`
            })`,
          })}
        </H3>
        {selectedRows.size > 0 && (
          <Button.Small onClick={(): void => setSelectedRows(new Set())}>
            {interactionsText.deselectAll()}
          </Button.Small>
        )}
        <div className="-ml-2 flex-1" />
        {displayedFields.length > 0 &&
        visibleFieldSpecs.length > 0 &&
        totalCount !== 0
          ? extraButtons
          : null}
        {Array.isArray(results) &&
        Array.isArray(loadedResults) &&
        results.length > 0 &&
        typeof fetchResults === 'function' &&
        visibleFieldSpecs.length > 0 ? (
          <>
            {canMergeTable ? (
              <RecordMergingLink
                selectedRows={selectedRows}
                table={table}
                onDeleted={handleDelete}
                onMerged={handleReRun}
              />
            ) : undefined}
            {hasToolPermission('recordSets', 'create') && totalCount !== 0 ? (
              selectedRows.size > 0 && !isDistinct ? (
                <CreateRecordSet
                  /*
                   * This is needed so that IDs are in the same order as they
                   * are in query results (selectedRows set may be out of order
                   * if records were selected out of order)
                   */
                  baseTableName={fieldSpecs[0].baseTable.name}
                  defaultRecordSetName={
                    queryResource?.isNew() ?? true
                      ? undefined
                      : queryResource?.get('name')
                  }
                  recordIds={(): RA<number> =>
                    loadedResults
                      .filter((result) =>
                        selectedRows.has(result[queryIdField] as number)
                      )
                      .map((result) => result[queryIdField] as number)
                  }
                  saveComponent={recordSetFromQueryLoading}
                />
              ) : (
                createRecordSet
              )
            ) : undefined}
            <QueryToMap
              fields={allFields}
              fieldSpecs={fieldSpecs}
              results={loadedResults}
              selectedRows={selectedRows}
              table={table}
              totalCount={totalCount}
              onFetchMore={
                canFetchMore && !isFetching ? handleFetchMore : undefined
              }
            />
            {isDistinct ? null : (
              <QueryToForms
                results={results}
                selectedRows={selectedRows}
                table={table}
                totalCount={totalCount}
                onDelete={handleDelete}
                onFetchMore={isFetching ? undefined : handleFetchMore}
              />
            )}
          </>
        ) : undefined}
      </div>
      <div
        // REFACTOR: turn this into a reusable table component
        className={`
          grid-table auto-rows-min
          overflow-auto rounded
          ${tableClassName}
          ${showResults ? 'border-b border-gray-500' : ''}
        `}
        ref={scrollerRef}
        role="table"
        style={{
          gridTemplateColumns: [
            ...Array.from({ length: metaColumns }).fill('min-content'),
            ...Array.from({ length: visibleFieldSpecs.length }).fill('auto'),
          ].join(' '),
        }}
        onScroll={showResults && !canFetchMore ? undefined : handleScroll}
      >
        {showResults && visibleFieldSpecs.length > 0 ? (
          <div role="rowgroup">
            <div role="row">
              {showLineNumber && (
                <TableHeaderCell
                  fieldSpec={undefined}
                  sortConfig={undefined}
                  onSortChange={undefined}
                />
              )}
              <TableHeaderCell
                fieldSpec={undefined}
                sortConfig={undefined}
                onSortChange={undefined}
              />
              <TableHeaderCell
                fieldSpec={undefined}
                sortConfig={undefined}
                onSortChange={undefined}
              />
              {fieldSpecs.map((fieldSpec, index) =>
                fieldSpec.isPhantom ? undefined : (
                  <TableHeaderCell
                    fieldSpec={fieldSpec}
                    key={index}
                    sortConfig={sortConfig?.[index]}
                    onSortChange={
                      typeof handleSortChange === 'function'
                        ? (sortType): void =>
                            handleSortChange?.(fieldSpec, sortType)
                        : undefined
                    }
                  />
                )
              )}
            </div>
          </div>
        ) : null}
        <div role="rowgroup">
          {showResults &&
          visibleFieldSpecs.length > 0 &&
          Array.isArray(loadedResults) &&
          Array.isArray(initialData) ? (
            <QueryResultsTable
              fieldSpecs={fieldSpecs}
              results={loadedResults}
              selectedRows={selectedRows}
              table={table}
              onSelected={(rowIndex, isSelected, isShiftClick): void => {
                /*
                 * If shift/ctrl/cmd key was held during click, toggle all rows
                 * between the current one, and the last selected one
                 */
                const ids = (
                  isShiftClick && typeof lastSelectedRow.current === 'number'
                    ? Array.from(
                        {
                          length:
                            Math.abs(lastSelectedRow.current - rowIndex) + 1,
                        },
                        (_, index) =>
                          Math.min(lastSelectedRow.current!, rowIndex) + index
                      )
                    : [rowIndex]
                ).map(
                  (rowIndex) => loadedResults[rowIndex][queryIdField] as number
                );
                const newSelectedRows = [
                  ...Array.from(selectedRows).filter(
                    (id) => isSelected || !ids.includes(id)
                  ),
                  ...(isSelected ? ids : []),
                ];
                setSelectedRows(new Set(newSelectedRows));
                handleSelected?.(newSelectedRows);

                lastSelectedRow.current = rowIndex;
              }}
            />
          ) : undefined}
          {isFetching || (!showResults && Array.isArray(results)) ? (
            <div className="col-span-full" role="cell">
              {loadingGif}
            </div>
          ) : undefined}
        </div>
      </div>
    </Container.Base>
  );
}

function TableHeaderCell({
  fieldSpec,
  sortConfig,
  onSortChange: handleSortChange,
}: {
  readonly fieldSpec: QueryFieldSpec | undefined;
  readonly sortConfig: QueryField['sortType'];
  readonly onSortChange?: (sortType: QueryField['sortType']) => void;
}): JSX.Element {
  // TableName refers to the table the field is from, not the base table name of the query
  const tableName = fieldSpec?.table?.name;

  const content =
    typeof fieldSpec === 'object' ? (
      <>
        {tableName && <TableIcon label name={tableName} />}
        {generateMappingPathPreview(
          fieldSpec.baseTable.name,
          fieldSpec.toMappingPath()
        )}
      </>
    ) : undefined;

  return (
    <div
      className="bg-brand-100 dark:bg-brand-500 sticky z-[2] w-full
        min-w-max border-b border-gray-500 p-1 [inset-block-start:_0]"
      role={typeof content === 'object' ? `columnheader` : 'cell'}
    >
      {typeof handleSortChange === 'function' ? (
        <Button.LikeLink
          onClick={(): void =>
            handleSortChange?.(
              sortTypes[(sortTypes.indexOf(sortConfig) + 1) % sortTypes.length]
            )
          }
        >
          {content}
          {typeof sortConfig === 'string' && (
            <SortIndicator
              fieldName="field"
              sortConfig={{
                sortField: 'field',
                ascending: sortConfig === 'ascending',
              }}
            />
          )}
        </Button.LikeLink>
      ) : (
        content
      )}
    </div>
  );
}

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

/** Record ID column index in Query Results when not in distinct mode */
export const queryIdField = 0;

function canMerge(table: SpecifyTable): boolean {
  const isEmbeddedCollectingEvent = schema.embeddedCollectingEvent;
  const isEmbeddedPaleoContext = schema.embeddedPaleoContext;
  const canMerge =
    hasPermission('/record/merge', 'update') &&
    hasTablePermission(table.name, 'update');
  const canMergePaleoContext =
    table.name === 'PaleoContext' && !isEmbeddedPaleoContext && canMerge;
  const canMergeCollectingEvent =
    table.name === 'CollectingEvent' && !isEmbeddedCollectingEvent && canMerge;
  const canMergeOtherTables =
    table.name !== 'PaleoContext' &&
    table.name !== 'CollectingEvent' &&
    canMerge;
  return canMergeOtherTables || canMergePaleoContext || canMergeCollectingEvent;
}
