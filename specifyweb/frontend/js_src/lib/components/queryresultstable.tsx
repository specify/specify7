import React from 'react';

import { ajax } from '../ajax';
import type { SpQuery, Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { keysToLowerCase } from '../datamodelutils';
import { f } from '../functools';
import { removeItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import { fetchPickList } from '../picklistmixins';
import type { QueryField } from '../querybuilderutils';
import {
  addAuditLogFields,
  queryFieldsToFieldSpecs,
  sortTypes,
  unParseQueryFields,
} from '../querybuilderutils';
import type { QueryFieldSpec } from '../queryfieldspec';
import type { SpecifyModel } from '../specifymodel';
import { treeRanksPromise } from '../treedefinitions';
import type { RA } from '../types';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import { Button, Container, H3 } from './basic';
import { SortIndicator, TableIcon } from './common';
import { LoadingContext } from './contexts';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useTriggerState } from './hooks';
import { QueryResults } from './queryresults';
import { RecordSelectorFromIds } from './recordselectorutils';

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
  readonly onFetchMore: (() => void) | undefined;
  readonly onDelete: (id: number) => void;
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

  return (
    <>
      <Button.Simple onClick={handleOpen} disabled={results.length === 0}>
        {commonText('viewRecords')}
      </Button.Simple>
      {isOpen && (
        <RecordSelectorFromIds
          totalCount={selectedRows.size === 0 ? totalCount : selectedRows.size}
          ids={ids}
          isAddingNew={false}
          defaultIndex={0}
          model={model}
          onAdd={undefined}
          onDelete={handleDelete}
          onSlide={(index): void =>
            index >= ids.length - 1 ? handleFetchMore?.() : undefined
          }
          dialog="modal"
          onClose={handleClose}
          onSaved={f.void}
          isDependent={false}
          title={undefined}
          mode="edit"
          canAddAnother={false}
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
  totalCount,
  fieldSpecs,
  initialData,
  sortConfig,
  onSelected: handleSelected,
  onSortChange: handleSortChange,
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
    true
  );

  const [treeRanksLoaded] = useAsyncState(
    React.useCallback(async () => treeRanksPromise.then(f.true), []),
    true
  );

  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
    new Set()
  );
  const lastSelectedRow = React.useRef<number | undefined>(undefined);
  React.useEffect(() => setSelectedRows(new Set()), [totalCount]);

  function fetchMore(): void {
    if (!Array.isArray(results)) return;
    handleFetching();
    fetchResults(results.length)
      .then((newResults) => setResults([...results, ...newResults]))
      .then(handleFetched)
      .catch(crash);
  }

  const loading = React.useContext(LoadingContext);

  return (
    <Container.Base className="overflow-hidden">
      <div className="gap-x-2 flex items-center">
        <H3>{`${label}: (${
          selectedRows.size === 0
            ? totalCount
            : `${selectedRows.size}/${totalCount}`
        })`}</H3>
        <div className="flex-1 -ml-2" />
        {hasIdField &&
        Array.isArray(results) &&
        typeof handleSelected === 'undefined' ? (
          <ViewRecords
            selectedRows={selectedRows}
            results={results}
            model={model}
            onFetchMore={isFetching ? undefined : fetchMore}
            onDelete={(index): void => {
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
        ) : undefined}
      </div>
      {Array.isArray(results) &&
      fieldSpecs.length > 0 &&
      pickListsLoaded === true &&
      treeRanksLoaded === true ? (
        <div
          role="table"
          className={`grid-table overflow-auto max-h-[75vh] border-b
             border-gray-500 auto-rows-min
            ${
              hasIdField
                ? `grid-cols-[min-content,min-content,repeat(var(--cols),auto)]`
                : `grid-cols-[repeat(var(--cols),auto)]`
            }`}
          style={{ '--cols': fieldSpecs.length } as React.CSSProperties}
          onScroll={
            isFetching || results.length === totalCount
              ? undefined
              : ({ target }): void =>
                  isScrolledBottom(target as HTMLElement)
                    ? undefined
                    : fetchMore()
          }
        >
          <div role="rowgroup">
            <div role="row">
              {hasIdField && (
                <>
                  <TableHeaderCell
                    key="select-record"
                    fieldSpec={undefined}
                    ariaLabel={commonText('selectRecord')}
                    sortConfig={undefined}
                    onSortChange={undefined}
                  />
                  <TableHeaderCell
                    key="view-record"
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
          <QueryResults
            model={model}
            fieldSpecs={fieldSpecs}
            hasIdField={hasIdField}
            results={results}
            selectedRows={selectedRows}
            onSelected={(id, isSelected, isShiftClick): void => {
              f.maybe(handleSelected, (callback) =>
                loading(new model.Resource({ id }).fetch().then(callback))
              );
              if (!hasIdField) return;
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
        </div>
      ) : undefined}
      {isFetching && loadingGif}
    </Container.Base>
  );
}

export const loadingGif = (
  <img
    src="/static/img/specify128spinner.gif"
    alt={commonText('loading')}
    className="w-10"
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
  onSelected: handleSelected,
  onSortChange: handleSortChange,
}: {
  readonly baseTableName: keyof Tables;
  readonly model: SpecifyModel;
  readonly queryRunCount: number;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly recordSetId: number | undefined;
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
  ]);

  return typeof props === 'undefined' ? (
    queryRunCount === 0 ? null : (
      loadingGif
    )
  ) : (
    <QueryResultsTable {...props} onSelected={handleSelected} />
  );
}
