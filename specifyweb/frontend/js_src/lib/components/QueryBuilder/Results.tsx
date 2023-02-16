import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { R, RA } from '../../utils/types';
import { removeItem, removeKey } from '../../utils/utils';
import { Container, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { createResource } from '../DataModel/resource';
import { schema, strictGetModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { RecordSet, SpQuery, Tables } from '../DataModel/types';
import { raise, softFail } from '../Errors/Crash';
import { recordSetView } from '../FormParse/webOnlyViews';
import { ResourceView } from '../Forms/ResourceView';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { loadingGif } from '../Molecules';
import { SortIndicator } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import { fetchPickList } from '../PickLists/fetch';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { RecordSetCreated, recordSetFromQueryLoading } from './Components';
import type { QueryFieldSpec } from './fieldSpec';
import type { QueryField } from './helpers';
import { sortTypes } from './helpers';
import { QueryResultsTable } from './ResultsTable';
import { QueryToForms } from './ToForms';
import { QueryToMap } from './ToMap';

export type QueryResultRow = RA<number | string | null>;

export function QueryResults({
  model,
  label = commonText.results(),
  hasIdField,
  queryResource,
  fetchSize,
  fetchResults,
  totalCount: initialTotalCount,
  fieldSpecs,
  initialData,
  sortConfig,
  onSelected: handleSelected,
  onSortChange: handleSortChange,
  createRecordSet,
  extraButtons,
  tableClassName = '',
}: {
  readonly model: SpecifyModel;
  readonly label?: LocalizedString;
  readonly hasIdField: boolean;
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
  // This is undefined when running query in countOnly mode
  readonly initialData: RA<QueryResultRow> | undefined;
  readonly sortConfig?: RA<QueryField['sortType']>;
  readonly onSelected?: (selected: RA<number>) => void;
  readonly onSortChange?: (
    fieldSpec: QueryFieldSpec,
    direction: 'ascending' | 'descending' | undefined
  ) => void;
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element | undefined;
  readonly tableClassName?: string;
}): JSX.Element {
  /*
   * Warning:
   * "results" can be a sparse array. Using sparse array to allow
   * efficiently retrieving the last query result in a query that returns
   * hundreds of thousands of results.
   */
  const [results, setResults] = useTriggerState<
    RA<QueryResultRow | undefined> | undefined
  >(initialData);
  const visibleFieldSpecs = fieldSpecs.filter(({ isPhantom }) => !isPhantom);
  const resultsRef = React.useRef(results);

  const [pickListsLoaded = false] = useAsyncState(
    React.useCallback(
      async () =>
        // Fetch all pick lists so that they are accessible synchronously later
        Promise.all(
          fieldSpecs.map((fieldSpec) =>
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

  const [totalCount, setTotalCount] = useTriggerState(initialTotalCount);

  // Ids of selected records
  const [selectedRows, setSelectedRows] = React.useState<ReadonlySet<number>>(
    new Set()
  );
  const lastSelectedRow = React.useRef<number | undefined>(undefined);
  // Unselect all rows when query is reRun
  React.useEffect(() => setSelectedRows(new Set()), [fieldSpecs]);

  // Queue for fetching
  const fetchersRef = React.useRef<R<Promise<RA<QueryResultRow> | void>>>({});

  const handleFetchMore = React.useCallback(
    async (index?: number): Promise<RA<QueryResultRow> | void> => {
      const currentResults = resultsRef.current;
      const canFetch = Array.isArray(currentResults);
      if (!canFetch || fetchResults === undefined) return undefined;
      const alreadyFetched =
        currentResults.length === totalCount &&
        !currentResults.includes(undefined);
      if (alreadyFetched) return undefined;

      /*
       * REFACTOR: make this smarter
       *   when going to the last record, fetch 40 before the last
       *   when somewhere in the middle, adjust the fetch region to get the
       *   most unhatched records fetched
       */
      const naiveFetchIndex = index ?? currentResults.length;
      if (currentResults[naiveFetchIndex] !== undefined) return undefined;
      const fetchIndex =
        /* If navigating backwards, fetch the previous 40 records */
        typeof index === 'number' &&
        typeof currentResults[index + 1] === 'object' &&
        currentResults[index - 1] === undefined &&
        index > fetchSize
          ? naiveFetchIndex - fetchSize + 1
          : naiveFetchIndex;

      // Prevent concurrent fetching in different places
      fetchersRef.current[fetchIndex] ??= fetchResults(fetchIndex)
        .then((newResults) => {
          if (
            process.env.NODE_ENV === 'development' &&
            newResults.length > fetchSize
          )
            softFail(
              new Error(
                `Returned ${newResults.length} results, when expected at most ${fetchSize}`
              )
            );

          // Results might have changed while fetching
          const newCurrentResults = resultsRef.current ?? currentResults;

          // Not using Array.from() so as not to expand the sparse array
          const combinedResults = newCurrentResults.slice();
          /*
           * This extends the sparse array to fit new results. Without this,
           * splice won't place the results in the correct place.
           */
          combinedResults[fetchIndex] =
            combinedResults[fetchIndex] ?? undefined;
          combinedResults.splice(fetchIndex, newResults.length, ...newResults);

          setResults(combinedResults);
          resultsRef.current = combinedResults;
          fetchersRef.current = removeKey(
            fetchersRef.current,
            fetchIndex.toString()
          );

          if (typeof index === 'number' && index >= combinedResults.length)
            return handleFetchMore(index);
          return newResults;
        })
        .catch(raise);

      return fetchersRef.current[fetchIndex];
    },
    [fetchResults, fetchSize, setResults, totalCount]
  );

  const showResults =
    Array.isArray(results) &&
    fieldSpecs.length > 0 &&
    pickListsLoaded &&
    treeRanksLoaded;
  const canFetchMore =
    !Array.isArray(results) ||
    totalCount === undefined ||
    results.length < totalCount;

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const { isFetching, handleScroll } = useInfiniteScroll(
    canFetchMore ? handleFetchMore : undefined,
    scrollerRef
  );

  const undefinedResult = results?.indexOf(undefined);
  const loadedResults = (
    undefinedResult === -1 ? results : results?.slice(0, undefinedResult)
  ) as RA<QueryResultRow> | undefined;

  return (
    <Container.Base className="w-full bg-[color:var(--form-background)]">
      <div className="flex items-center items-stretch gap-2">
        <H3>{`${label}: (${
          selectedRows.size === 0
            ? totalCount ?? commonText.loading()
            : `${selectedRows.size}/${totalCount ?? commonText.loading()}`
        })`}</H3>
        {selectedRows.size > 0 && (
          <Button.Small onClick={(): void => setSelectedRows(new Set())}>
            {interactionsText.deselectAll()}
          </Button.Small>
        )}
        <div className="-ml-2 flex-1" />
        {extraButtons}
        {hasIdField &&
        Array.isArray(results) &&
        Array.isArray(loadedResults) &&
        results.length > 0 &&
        typeof fetchResults === 'function' ? (
          <>
            {hasToolPermission('recordSets', 'create') ? (
              selectedRows.size > 0 ? (
                <CreateRecordSet
                  /*
                   * This is needed so that IDs are in the same order as they
                   * are in query results (selectedRows set may be out of order
                   * if records were selected out of order)
                   */
                  baseTableName={fieldSpecs[0].baseTable.name}
                  getIds={(): RA<number> =>
                    loadedResults
                      .filter((result) =>
                        selectedRows.has(result[queryIdField] as number)
                      )
                      .map((result) => result[queryIdField] as number)
                  }
                  queryResource={queryResource}
                />
              ) : (
                createRecordSet
              )
            ) : undefined}
            <QueryToMap
              fieldSpecs={fieldSpecs}
              model={model}
              results={loadedResults}
              selectedRows={selectedRows}
              totalCount={totalCount}
              onFetchMore={
                canFetchMore && !isFetching ? handleFetchMore : undefined
              }
            />
            <QueryToForms
              model={model}
              results={results}
              selectedRows={selectedRows}
              totalCount={totalCount}
              onDelete={(index): void => {
                // Don't allow deleting while query results are being fetched
                if (Object.keys(fetchersRef.current).length > 0) return;
                setTotalCount(totalCount! - 1);
                const newResults = removeItem(results, index);
                setResults(newResults);
                resultsRef.current = newResults;
                setSelectedRows(
                  new Set(
                    Array.from(selectedRows).filter(
                      (id) => id !== loadedResults[index][queryIdField]
                    )
                  )
                );
              }}
              onFetchMore={isFetching ? undefined : handleFetchMore}
            />
          </>
        ) : undefined}
      </div>
      <div
        // REFACTOR: turn this into a reusable table component
        className={`
          grid-table auto-rows-min overflow-auto rounded
          ${tableClassName}
          ${showResults ? 'border-b border-gray-500' : ''}
          ${
            hasIdField
              ? 'grid-cols-[min-content_min-content_repeat(var(--columns),auto)]'
              : 'grid-cols-[repeat(var(--columns),auto)]'
          }
       `}
        ref={scrollerRef}
        role="table"
        style={
          {
            '--columns': visibleFieldSpecs.length,
          } as React.CSSProperties
        }
        onScroll={showResults && !canFetchMore ? undefined : handleScroll}
      >
        {showResults && (
          <div role="rowgroup">
            <div role="row">
              {hasIdField && (
                <>
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
                </>
              )}
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
        )}
        <div role="rowgroup">
          {showResults &&
          Array.isArray(loadedResults) &&
          Array.isArray(initialData) ? (
            <QueryResultsTable
              fieldSpecs={fieldSpecs}
              hasIdField={hasIdField}
              model={model}
              results={loadedResults}
              selectedRows={selectedRows}
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
  // TableName refers to the table the filed is from, not the base table name of the query
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
      className="sticky w-full min-w-max border-b border-gray-500
        bg-brand-100 p-1 [inset-block-start:_0] [z-index:2] dark:bg-brand-500"
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

/**
 * Create a record set frm selected records.
 * See also `MakeRecordSetButton`
 */
function CreateRecordSet({
  getIds,
  baseTableName,
  queryResource,
}: {
  readonly getIds: () => RA<number>;
  readonly baseTableName: keyof Tables;
  readonly queryResource: SpecifyResource<SpQuery> | undefined;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'Editing', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'Main'>
    | State<'Saved', { readonly recordSet: SpecifyResource<RecordSet> }>
    | State<'Saving'>
  >({ type: 'Main' });

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        onClick={(): void => {
          const recordSet = new schema.models.RecordSet.Resource();
          if (queryResource !== undefined && !queryResource.isNew())
            recordSet.set('name', queryResource.get('name'));
          setState({
            type: 'Editing',
            recordSet,
          });
        }}
      >
        {queryText.createRecordSet({
          recordSetTable: schema.models.RecordSet.label,
        })}
      </Button.Small>
      {state.type === 'Editing' && (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={state.recordSet}
          viewName={recordSetView}
          onAdd={undefined}
          onClose={(): void => setState({ type: 'Main' })}
          onDeleted={f.never}
          onSaved={f.never}
          onSaving={(): false => {
            setState({ type: 'Saving' });
            createResource('RecordSet', {
              ...serializeResource(state.recordSet),
              version: 1,
              type: 0,
              dbTableId: strictGetModel(baseTableName).tableId,
              /*
               * Back-end has an exception for RecordSet table allowing passing
               * inline data for record set items.
               * Need to make IDs unique as query may return results with
               * duplicate IDs (when displaying a -to-many relationship)
               */
              // @ts-expect-error
              recordSetItems: f.unique(getIds()).map((id) => ({
                recordId: id,
              })),
            })
              .then((recordSet) =>
                setState({
                  type: 'Saved',
                  recordSet: deserializeResource(recordSet),
                })
              )
              .catch((error) => {
                setState({ type: 'Main' });
                raise(error);
              });
            return false;
          }}
        />
      )}
      {state.type === 'Saving' && recordSetFromQueryLoading()}
      {state.type === 'Saved' && (
        <RecordSetCreated
          recordSet={state.recordSet}
          onClose={(): void => setState({ type: 'Main' })}
        />
      )}
    </>
  );
}

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

/** Record ID column index in Query Results when not in distinct mode */
export const queryIdField = 0;
