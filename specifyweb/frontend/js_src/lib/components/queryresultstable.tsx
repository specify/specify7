import React from 'react';

import { ajax } from '../ajax';
import type { SpQuery, Tables } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { queryFieldsToFieldSpecs, sortTypes } from '../querybuilderutils';
import type { QueryFieldSpec } from '../queryfieldspec';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import { Button, ContainerBase } from './basic';
import { SortIndicator, TableIcon } from './common';
import { crash } from './errorboundary';
import { QueryResults } from './queryresults';

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
        {tableName && <TableIcon tableName={tableName} />}
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
      <div className="contents">
        {typeof handleSortChange === 'function' ? (
          <Button.LikeLink
            onClick={(): void =>
              handleSortChange?.(
                sortTypes[
                  (sortTypes.indexOf(sortConfig) + 1) % sortTypes.length
                ]
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
    </div>
  );
}

const threshold = 20;
const isScrolledBottom = (scrollable: HTMLElement): boolean =>
  scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight >
  threshold;

export function QueryResultsTable({
  model,
  label = queryText('results'),
  idFieldIndex,
  fetchResults,
  totalCount,
  fieldSpecs,
  initialData,
  sortConfig,
  onSortChange: handleSortChange,
}: {
  readonly model: SpecifyModel;
  readonly label?: string;
  readonly idFieldIndex: number | undefined;
  readonly fetchResults: (
    offset: number
  ) => Promise<RA<RA<string | number | null>>>;
  readonly totalCount: number;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly initialData: RA<RA<string | number | null>> | undefined;
  readonly sortConfig?: RA<QueryField['sortType']>;
  readonly onSortChange?: (
    fieldIndex: number,
    direction: 'ascending' | 'descending' | undefined
  ) => void;
}): JSX.Element {
  const [isFetching, setIsFetching] = React.useState(false);
  const [results, setResults] = React.useState<
    RA<RA<string | number | null>> | undefined
  >(initialData);
  React.useEffect(() => setResults(initialData), [initialData]);

  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
    new Set()
  );
  const lastSelectedRow = React.useRef<number | undefined>(undefined);
  React.useEffect(() => setSelectedRows(new Set()), [totalCount]);

  return (
    <ContainerBase className="overflow-hidden">
      {<h3>{`${label}: (${totalCount})`}</h3>}
      {typeof results === 'object' && fieldSpecs.length > 0 && (
        <div
          role="table"
          className={`grid-table overflow-auto max-h-[75vh] border-b
             border-gray-500 auto-rows-min
            ${
              typeof idFieldIndex === 'number'
                ? `grid-cols-[min-content,min-content,repeat(var(--cols),auto)]`
                : `grid-cols-[repeat(var(--cols),auto)]`
            }`}
          style={{ '--cols': fieldSpecs.length } as React.CSSProperties}
          onScroll={
            isFetching || results.length === totalCount
              ? undefined
              : ({ target }): void => {
                  if (isScrolledBottom(target as HTMLElement)) return;
                  setIsFetching(true);
                  fetchResults(results.length)
                    .then((newResults) =>
                      setResults([...results, ...newResults])
                    )
                    .then(() => setIsFetching(false))
                    .catch(crash);
                }
          }
        >
          <div role="rowgroup">
            <div role="row">
              {typeof idFieldIndex === 'number' && (
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
                  onSortChange={(sortType): void =>
                    handleSortChange?.(index, sortType)
                  }
                />
              ))}
            </div>
          </div>
          <QueryResults
            model={model}
            fieldSpecs={fieldSpecs}
            idFieldIndex={idFieldIndex}
            results={results}
            selectedRows={selectedRows}
            onSelected={(id, isSelected, isShiftClick): void => {
              if (typeof idFieldIndex !== 'number') return;
              const rowIndex = results.findIndex(
                (row) => row[idFieldIndex] === id
              );
              const range =
                isShiftClick && typeof lastSelectedRow.current === 'number'
                  ? Array.from(
                      {
                        length:
                          Math.abs(lastSelectedRow.current - rowIndex) + 1,
                      },
                      (_, index) =>
                        Math.min(lastSelectedRow.current!, rowIndex) + index
                    )
                  : [rowIndex];
              setSelectedRows(
                new Set([
                  ...Array.from(selectedRows).filter(
                    (id) => isSelected || !range.includes(id)
                  ),
                  ...(isSelected ? range : []),
                ])
              );
              lastSelectedRow.current = rowIndex;
            }}
          />
        </div>
      )}
      {isFetching && <QueryResultsLoading />}
    </ContainerBase>
  );
}

export function QueryResultsLoading(): JSX.Element {
  return (
    <img
      src="/static/img/specify128spinner.gif"
      alt={commonText('loading')}
      className="w-10"
      aria-live="polite"
    />
  );
}

export function QueryResultsWrapper({
  baseTableName,
  model,
  queryRunCount,
  queryResource,
  fields,
  recordSetId,
  onSortChange: handleSortChange,
}: {
  readonly baseTableName: keyof Tables;
  readonly model: SpecifyModel;
  readonly queryRunCount: number;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly recordSetId: number | undefined;
  readonly onSortChange?: (
    fieldIndex: number,
    direction: 'ascending' | 'descending' | undefined
  ) => void;
}): JSX.Element | null {
  const fetchResults = React.useCallback(
    async (offset: number) => {
      return ajax<{ readonly results: RA<RA<string | number | null>> }>(
        '/stored_query/ephemeral/',
        {
          method: 'POST',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
          body: {
            ...queryResource.toJSON(),
            recordsetid: recordSetId,
            limit: 40,
            offset,
          },
        }
      ).then(({ data }) => data.results);
    },
    [queryResource, recordSetId]
  );

  const [payload, setPayload] = React.useState<
    | {
        readonly fieldSpecs: RA<QueryFieldSpec>;
        readonly totalCount: number;
        readonly initialData: RA<RA<string | number | null>> | undefined;
      }
    | undefined
  >(undefined);
  React.useEffect(() => {
    if (queryRunCount === 0) return;
    setPayload(undefined);

    const totalCount = ajax<{ readonly count: number }>(
      '/stored_query/ephemeral/',
      {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'application/json' },
        body: {
          ...queryResource.toJSON(),
          recordsetid: recordSetId,
          countonly: true,
        },
      }
    ).then(({ data }) => data.count);

    const displayedFields = fields.filter((field) => field.isDisplay);
    const initialData =
      queryResource.get('countOnly') === true || displayedFields.length === 0
        ? undefined
        : fetchResults(0);
    const fieldSpecs = queryFieldsToFieldSpecs(
      baseTableName,
      displayedFields
    ).map(([_field, fieldSpec]) => fieldSpec);

    Promise.all([totalCount, initialData])
      .then(([totalCount, initialData]) =>
        setPayload({
          fieldSpecs,
          totalCount,
          initialData,
        })
      )
      .catch(crash);
  }, [baseTableName, fetchResults, queryResource, queryRunCount, recordSetId]);

  return typeof payload === 'undefined' ? (
    queryRunCount === 0 ? null : (
      <QueryResultsLoading />
    )
  ) : (
    <QueryResultsTable
      model={model}
      idFieldIndex={
        queryResource.get('selectDistinct') === true ? undefined : 0
      }
      fetchResults={fetchResults}
      totalCount={payload.totalCount}
      fieldSpecs={payload.fieldSpecs}
      initialData={payload.initialData}
      sortConfig={fields.map((field) => field.sortType)}
      onSortChange={handleSortChange}
    />
  );
}
