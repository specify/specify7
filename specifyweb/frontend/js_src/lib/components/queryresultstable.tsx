import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import type { RecordSet, SpQuery, Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { keysToLowerCase, removeItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { queryText } from '../localization/query';
import { hasToolPermission } from '../permissions';
import { fetchPickList } from '../picklistmixins';
import type { QueryField } from '../querybuilderutils';
import {
  addAuditLogFields,
  queryFieldsToFieldSpecs,
  sortTypes,
  unParseQueryFields,
} from '../querybuilderutils';
import type { QueryFieldSpec } from '../queryfieldspec';
import { createResource } from '../resource';
import { getModel, schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { treeRanksPromise } from '../treedefinitions';
import type { RA } from '../types';
import { defined } from '../types';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import { Button, Container, H3 } from './basic';
import { SortIndicator, TableIcon } from './common';
import { LoadingContext } from './contexts';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useTriggerState } from './hooks';
import {
  RecordSetCreated,
  recordSetFromQueryLoading,
} from './querybuildercomponents';
import { QueryResults } from './queryresults';
import { RecordSelectorFromIds } from './recordselectorutils';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';

function TableHeaderCell({
  fieldSpec,
  ariaLabel,
  sortConfig,
  onSortChange: handleSortChange,
}: {
  readonly fieldSpec: QueryFieldSpec | undefined;
  readonly ariaLabel?: string;
  readonly sortConfig: QueryField['sortType'];
  readonly onSortChange?: (sortType: QueryField['sortType']) => void;
}): JSX.Element {
  const tableName = fieldSpec?.getField()?.model.name;

  const content =
    typeof fieldSpec === 'object' ? (
      <>
        {tableName && <TableIcon name={tableName} />}
        {generateMappingPathPreview(
          fieldSpec.baseTable.name,
          fieldSpec.toMappingPath()
        )}
      </>
    ) : undefined;
  return (
    <div
      role="columnheader"
      className="w-full min-w-max bg-brand-100 dark:bg-brand-500 border-b
        border-gray-500 p-1 [inset-block-start:_0] sticky [z-index:2]"
      aria-label={ariaLabel}
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
              fieldName={'field'}
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

function ViewRecords({
  model,
  results,
  selectedRows,
  onFetchMore: handleFetchMore,
  onDelete: handleDelete,
  totalCount,
}: {
  readonly model: SpecifyModel;
  readonly results: RA<RA<string | number | null>>;
  readonly selectedRows: Set<number>;
  readonly onFetchMore: ((index: number) => void) | undefined;
  readonly onDelete: (index: number) => void;
  readonly totalCount: number;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const [ids, setIds] = React.useState<RA<number>>([]);
  React.useEffect(() => {
    if (!isOpen) return;
    setIds(
      selectedRows.size === 0
        ? (results.map((row) => row[queryIdField]) as RA<number>)
        : Array.from(selectedRows)
    );
  }, [results, isOpen, selectedRows]);

  const unParseIndex = (index: number): number =>
    selectedRows.size === 0
      ? index
      : f.var(Array.from(selectedRows)[index], (deletedRecordId) =>
          results.findIndex((row) => row[queryIdField] === deletedRecordId)
        );

  return (
    <>
      <Button.Small onClick={handleOpen} disabled={results.length === 0}>
        {commonText('browseInForms')}
      </Button.Small>
      {isOpen && (
        <RecordSelectorFromIds
          totalCount={selectedRows.size === 0 ? totalCount : selectedRows.size}
          ids={ids}
          newResource={undefined}
          defaultIndex={0}
          model={model}
          onAdd={undefined}
          onDelete={(index): void => handleDelete(unParseIndex(index))}
          /*
           * TODO: make fetching more efficient when fetching last query item
           *   (don't fetch all intermediate results)
           */
          onSlide={(index): void =>
            index >= ids.length - 1 && selectedRows.size === 0
              ? handleFetchMore?.(unParseIndex(index))
              : undefined
          }
          dialog="modal"
          onClose={handleClose}
          onSaved={f.void}
          isDependent={false}
          title={undefined}
          mode="edit"
          canAddAnother={false}
          canRemove={false}
          urlContext={false}
        />
      )}
    </>
  );
}

/**
 * Create a record set frm selected records.
 * See also `MakeRecordSetButton`
 */
function CreateRecordSet({
  getIds,
  baseTableName,
}: {
  readonly getIds: () => RA<number>;
  readonly baseTableName: keyof Tables;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'Main'>
    | State<'Editing', { recordSet: SpecifyResource<RecordSet> }>
    | State<'Saving'>
    | State<'Saved', { recordSet: SpecifyResource<RecordSet> }>
  >({ type: 'Main' });

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        onClick={(): void =>
          setState({
            type: 'Editing',
            recordSet: new schema.models.RecordSet.Resource(),
          })
        }
      >
        {queryText('createRecordSet')}
      </Button.Small>
      {state.type === 'Editing' && (
        <ResourceView
          dialog="modal"
          canAddAnother={false}
          resource={state.recordSet}
          onSaving={(): false => {
            setState({ type: 'Saving' });
            createResource('RecordSet', {
              ...serializeResource(state.recordSet),
              version: 1,
              type: 0,
              dbTableId: defined(getModel(baseTableName)).tableId,
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
              .catch(crash);
            return false;
          }}
          onSaved={f.never}
          onClose={(): void => setState({ type: 'Main' })}
          onDeleted={f.never}
          mode="edit"
          isSubForm={false}
          isDependent={false}
        />
      )}
      {state.type === 'Saving' && recordSetFromQueryLoading}
      {state.type === 'Saved' && (
        <RecordSetCreated
          recordSet={state.recordSet}
          onClose={(): void => setState({ type: 'Main' })}
        />
      )}
    </>
  );
}

const threshold = 20;
const isScrolledBottom = (scrollable: HTMLElement): boolean =>
  scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight >
  threshold;

export function QueryResultsTable({
  model,
  label = commonText('results'),
  hasIdField,
  fetchResults,
  totalCount: initialTotalCount,
  fieldSpecs,
  initialData,
  sortConfig,
  onSelected: handleSelected,
  onSortChange: handleSortChange,
  createRecordSet,
  extraButtons,
  tableClassName,
}: {
  readonly model: SpecifyModel;
  readonly label?: string;
  readonly hasIdField: boolean;
  readonly fetchResults: (
    offset: number
  ) => Promise<RA<RA<string | number | null>>>;
  readonly totalCount: number;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly initialData: RA<RA<string | number | null>> | undefined;
  readonly sortConfig?: RA<QueryField['sortType']>;
  readonly onSelected?: (resource: SpecifyResource<AnySchema>) => void;
  readonly onSortChange?: (
    fieldIndex: number,
    direction: 'ascending' | 'descending' | undefined
  ) => void;
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element | undefined;
  readonly tableClassName?: string;
}): JSX.Element {
  const [isFetching, handleFetching, handleFetched] = useBooleanState();
  const [results, setResults] = useTriggerState(initialData);

  const [pickListsLoaded] = useAsyncState(
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

  const [treeRanksLoaded] = useAsyncState(
    React.useCallback(async () => treeRanksPromise.then(f.true), []),
    false
  );

  const [totalCount, setTotalCount] = useTriggerState(initialTotalCount);

  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
    new Set()
  );
  const lastSelectedRow = React.useRef<number | undefined>(undefined);
  // Unselect all rows when query is reRun
  React.useEffect(() => setSelectedRows(new Set()), [initialTotalCount]);

  function fetchMore(
    index?: number,
    currentResults: RA<RA<string | number | null>> | undefined = results
  ): void {
    if (
      !Array.isArray(currentResults) ||
      isFetching ||
      currentResults.length === totalCount
    )
      return;
    handleFetching();
    fetchResults(currentResults.length)
      .then((newResults) => [...currentResults, ...newResults])
      .then((combinedResults): void => {
        setResults(combinedResults);
        if (typeof index === 'undefined' || index < combinedResults.length)
          handleFetched();
        else fetchMore(index, combinedResults);
      })
      .catch(crash);
  }

  React.useEffect(fetchMore, []);

  const loading = React.useContext(LoadingContext);
  const showResults =
    Array.isArray(results) &&
    fieldSpecs.length > 0 &&
    pickListsLoaded === true &&
    treeRanksLoaded === true;

  return (
    <Container.Base className="w-full bg-[color:var(--form-background)]">
      <div className="gap-x-2 flex items-center">
        <H3>{`${label}: (${
          selectedRows.size === 0
            ? totalCount
            : `${selectedRows.size}/${totalCount}`
        })`}</H3>
        {selectedRows.size > 0 && (
          <Button.Small onClick={(): void => setSelectedRows(new Set())}>
            {formsText('deselectAll')}
          </Button.Small>
        )}
        <div className="flex-1 -ml-2" />
        {hasIdField && Array.isArray(results) && results.length > 0 ? (
          <>
            {extraButtons}
            {hasToolPermission('recordSets', 'create') ? (
              selectedRows.size > 0 ? (
                <CreateRecordSet
                  /*
                   * This is needed so that IDs are in the same order as they
                   * are in query results (selectedRows set may be out of order
                   * if records were selected out of order)
                   */
                  getIds={(): RA<number> =>
                    defined(results)
                      .filter((result) =>
                        selectedRows.has(result[queryIdField] as number)
                      )
                      .map((result) => result[queryIdField] as number)
                  }
                  baseTableName={fieldSpecs[0].baseTable.name}
                />
              ) : (
                createRecordSet
              )
            ) : undefined}
            {typeof handleSelected === 'undefined' && (
              <ViewRecords
                selectedRows={selectedRows}
                results={results}
                model={model}
                onFetchMore={isFetching ? undefined : fetchMore}
                onDelete={(index): void => {
                  setTotalCount(totalCount - 1);
                  setResults(removeItem(results, index));
                  setSelectedRows(
                    new Set(
                      Array.from(selectedRows).filter(
                        (id) => id !== results[index][queryIdField]
                      )
                    )
                  );
                }}
                totalCount={totalCount}
              />
            )}
          </>
        ) : undefined}
      </div>
      <div
        // TODO: turn this into a reusable table component
        role="table"
        className={`grid-table overflow-auto
          auto-rows-min rounded
          ${tableClassName ?? ''}
          ${showResults ? 'border-b border-gray-500' : ''}
          ${
            hasIdField
              ? 'grid-cols-[min-content_min-content_repeat(var(--columns),auto)]'
              : 'grid-cols-[repeat(var(--columns),auto)]'
          }
       `}
        style={
          {
            '--columns': fieldSpecs.length,
          } as React.CSSProperties
        }
        onScroll={
          showResults && (isFetching || results.length === totalCount)
            ? undefined
            : ({ target }): void =>
                isScrolledBottom(target as HTMLElement)
                  ? undefined
                  : fetchMore()
        }
      >
        {showResults && (
          <div role="rowgroup">
            <div role="row">
              {hasIdField && (
                <>
                  <TableHeaderCell
                    fieldSpec={undefined}
                    ariaLabel={commonText('selectRecord')}
                    sortConfig={undefined}
                    onSortChange={undefined}
                  />
                  <TableHeaderCell
                    fieldSpec={undefined}
                    ariaLabel={commonText('viewRecord')}
                    sortConfig={undefined}
                    onSortChange={undefined}
                  />
                </>
              )}
              {fieldSpecs.map((fieldSpec, index) => (
                <TableHeaderCell
                  key={index}
                  fieldSpec={fieldSpec}
                  sortConfig={sortConfig?.[index]}
                  onSortChange={
                    typeof handleSortChange === 'function'
                      ? (sortType): void => handleSortChange?.(index, sortType)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
        <div role="rowgroup">
          {showResults ? (
            <QueryResults
              model={model}
              fieldSpecs={fieldSpecs}
              hasIdField={hasIdField}
              results={results}
              selectedRows={selectedRows}
              onSelected={(id, isSelected, isShiftClick): void => {
                /*
                 * If a custom select handler is set, fetch the resource and call
                 * the handler
                 */
                if (typeof handleSelected === 'function') {
                  loading(
                    new model.Resource({ id }).fetch().then(handleSelected)
                  );
                  return;
                }

                /*
                 * If shift/ctrl/cmd key was held during click, toggle all rows
                 * between the current one, and the last selected one
                 */
                const rowIndex = results.findIndex(
                  (row) => row[queryIdField] === id
                );
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
                ).map((rowIndex) => results[rowIndex][queryIdField] as number);
                setSelectedRows(
                  new Set([
                    ...Array.from(selectedRows).filter(
                      (id) => isSelected || !ids.includes(id)
                    ),
                    ...(isSelected ? ids : []),
                  ])
                );
                lastSelectedRow.current = rowIndex;
              }}
            />
          ) : undefined}
          {isFetching || !showResults ? (
            <div role="cell" className="col-span-full">
              {loadingGif}
            </div>
          ) : undefined}
        </div>
      </div>
    </Container.Base>
  );
}

export const loadingGif = (
  <img
    src="/static/img/specify128spinner.gif"
    alt={commonText('loading')}
    className="w-20 rounded"
    aria-live="polite"
  />
);

/** Record ID column index in Query Results when not in distinct mode */
export const queryIdField = 0;

export function QueryResultsWrapper({
  baseTableName,
  model,
  queryRunCount,
  queryResource,
  fields,
  recordSetId,
  createRecordSet,
  extraButtons,
  onSelected: handleSelected,
  onSortChange: handleSortChange,
}: {
  readonly baseTableName: keyof Tables;
  readonly model: SpecifyModel;
  readonly queryRunCount: number;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly recordSetId: number | undefined;
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element;
  readonly onSelected?: (resource: SpecifyResource<AnySchema>) => void;
  readonly onSortChange?: (
    fieldIndex: number,
    direction: 'ascending' | 'descending' | undefined
  ) => void;
}): JSX.Element | null {
  const fetchResults = React.useCallback(
    async (offset: number) =>
      ajax<{ readonly results: RA<RA<string | number | null>> }>(
        '/stored_query/ephemeral/',
        {
          method: 'POST',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
          body: keysToLowerCase({
            ...queryResource.toJSON(),
            fields: unParseQueryFields(
              baseTableName,
              addAuditLogFields(baseTableName, fields),
              []
            ),
            recordSetId,
            limit: 40,
            offset,
          }),
        }
      ).then(({ data }) => data.results),
    [fields, baseTableName, queryResource, recordSetId]
  );

  /*
   * Need to store all props in a state so that query field edits do not affect
   * the query results until query is reRun
   */
  const [props, setProps] = React.useState<
    Parameters<typeof QueryResultsTable>[0] | undefined
  >(undefined);

  const previousQueryRunCount = React.useRef(queryRunCount);
  React.useEffect(() => {
    if (queryRunCount === previousQueryRunCount.current) return;
    previousQueryRunCount.current = queryRunCount;
    // Display the loading GIF
    setProps(undefined);

    const allFields = addAuditLogFields(baseTableName, fields);

    const totalCount = ajax<{ readonly count: number }>(
      '/stored_query/ephemeral/',
      {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'application/json' },
        body: keysToLowerCase({
          ...queryResource.toJSON(),
          fields: unParseQueryFields(baseTableName, allFields, []),
          recordSetId,
          countOnly: true,
        }),
      }
    ).then(({ data }) => data.count);

    const displayedFields = allFields.filter((field) => field.isDisplay);
    // Run as count only if there are no visible fields
    const initialData =
      queryResource.get('countOnly') === true || displayedFields.length === 0
        ? undefined
        : fetchResults(0);
    const fieldSpecs = queryFieldsToFieldSpecs(
      baseTableName,
      displayedFields
    ).map(([_field, fieldSpec]) => fieldSpec);

    f.all({ totalCount, initialData })
      .then(({ totalCount, initialData }) =>
        setProps({
          model,
          hasIdField: queryResource.get('selectDistinct') !== true,
          fetchResults,
          totalCount,
          fieldSpecs,
          initialData,
          sortConfig: fields.map((field) => field.sortType),
          onSortChange: handleSortChange,
          createRecordSet,
          extraButtons,
        })
      )
      .catch(crash);
  }, [
    fields,
    baseTableName,
    fetchResults,
    queryResource,
    queryRunCount,
    recordSetId,
    model,
  ]);

  return typeof props === 'undefined' ? (
    queryRunCount === 0 ? null : (
      <div className="snap-start flex-1">{loadingGif}</div>
    )
  ) : (
    <div
      className={`nap-start flex flex-1 ${
        typeof handleSelected === 'function' ? 'max-h-[70vh]' : ''
      }`}
    >
      <QueryResultsTable {...props} onSelected={handleSelected} />
    </div>
  );
}
