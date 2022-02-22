import React from 'react';

import { ajax } from '../ajax';
import type { SpQuery, Tables } from '../datamodel';
import type { AnyTree } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { queryFieldsToFieldSpecs, sortTypes } from '../querybuilderutils';
import type { QueryFieldSpec } from '../queryfieldspec';
import { getModel } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { getTreeDefinitionItems } from '../treedefinitions';
import type { RA } from '../types';
import { defined } from '../types';
import { Button, ContainerBase } from './basic';
import { SortIndicator, TableIcon } from './common';
import { crash } from './errorboundary';
import { useAsyncState } from './hooks';
import { dateParts } from './internationalization';
import { QueryResults } from './queryresults';

function TableHeaderCell({
  fieldSpec,
  sortConfig,
  onSortChange: handleSortChange,
}: {
  readonly fieldSpec: QueryFieldSpec;
  readonly sortConfig: QueryField['sortType'];
  readonly onSortChange: (sortType: QueryField['sortType']) => void;
}): JSX.Element {
  const field = fieldSpec.getField();
  const tableName = field?.model.name;
  const name = field?.label ?? field?.name ?? '';

  let label;
  if (Array.isArray(fieldSpec.treeRank)) {
    const rankLabel =
      getTreeDefinitionItems(
        fieldSpec.table.name as AnyTree['tableName'],
        false
      ).find(
        ({ name }) =>
          name.toLowerCase() === fieldSpec.treeRank?.[0].toLowerCase()
      )?.title ?? fieldSpec.treeRank[0];
    const fieldLabel = defined(
      defined(getModel(fieldSpec.table.name)).getField(fieldSpec.treeRank[1])
    ).label;
    label = [rankLabel, fieldLabel].join(' ');
  } else if (
    typeof fieldSpec.datePart === 'string' &&
    fieldSpec.datePart !== 'fullDate'
  )
    label = `${name} (${dateParts[fieldSpec.datePart]})`;
  else label = name;

  const content = (
    <>
      {tableName && <TableIcon tableName={tableName} />}
      {label}
    </>
  );
  return (
    <div
      role="columnheader"
      className="w-full min-w-max bg-brand-100 dark:bg-brand-500 border-b
            border-gray-500 p-1 [inset-block-start:_0] sticky"
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

  return (
    <ContainerBase className="overflow-hidden">
      {<h3>{`${label}: (${totalCount})`}</h3>}
      {typeof results === 'object' && fieldSpecs.length > 0 && (
        <div
          role="table"
          className={`grid-table grid-cols-[repeat(var(--cols),auto)]
            overflow-auto max-h-[75vh] border-b border-gray-500 auto-rows-min`}
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

  const previousRunCount = React.useRef(0);
  const [payload] = useAsyncState(
    React.useCallback(async () => {
      if (previousRunCount.current === queryRunCount) return undefined;
      previousRunCount.current = queryRunCount;

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

      return {
        fieldSpecs,
        totalCount: await totalCount,
        initialData: await initialData,
      };
    }, [
      baseTableName,
      fetchResults,
      fields,
      queryResource,
      queryRunCount,
      recordSetId,
    ])
  );

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
