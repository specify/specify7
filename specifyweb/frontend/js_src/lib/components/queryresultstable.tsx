import React from 'react';

import { ajax } from '../ajax';
import type { SpQuery, Tables } from '../datamodel';
import type { AnyTree } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { queryFieldsToFieldSpecs } from '../querybuilderutils';
import type { QueryFieldSpec } from '../queryfieldspec';
import { getModel } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { getTreeDefinitionItems } from '../treedefinitions';
import type { RA } from '../types';
import { defined } from '../types';
import { ContainerBase } from './basic';
import { TableIcon } from './common';
import { crash } from './errorboundary';
import { useAsyncState } from './hooks';
import { dateParts } from './internationalization';
import { QueryResults } from './queryresults';

function TableHeaderCell({
  fieldSpec,
}: {
  readonly fieldSpec: QueryFieldSpec;
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

  return (
    <div
      role="columnheader"
      className="w-full min-w-max bg-brand-100 dark:bg-brand-500 border-b
            border-gray-500 p-1 [inset-block-start:_0] sticky"
    >
      <div className="contents">
        {tableName && <TableIcon tableName={tableName} />}
        {label}
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
}): JSX.Element {
  const [isFetching, setIsFetching] = React.useState(false);
  const [results, setResults] = React.useState<
    RA<RA<string | number | null>> | undefined
  >(initialData);
  React.useEffect(() => setResults(initialData), [initialData]);

  return (
    <ContainerBase>
      {<h3>{`${label}: (${totalCount})`}</h3>}
      {typeof results === 'object' && fieldSpecs.length > 0 && (
        <div
          role="table"
          className={`grid-table grid-cols-[repeat(var(--cols),auto)]
            overflow-auto max-h-[75vh] border-b border-gray-500`}
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
                <TableHeaderCell key={index} fieldSpec={fieldSpec} />
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
      {isFetching && (
        <div>
          <img
            src="/static/img/specify128spinner.gif"
            alt={commonText('loading')}
            className="w-10"
            aria-live="polite"
          />
        </div>
      )}
    </ContainerBase>
  );
}

export function QueryResultsWrapper({
  baseTableName,
  model,
  queryRunCount,
  queryResource,
  fields,
  recordSetId,
}: {
  readonly baseTableName: keyof Tables;
  readonly model: SpecifyModel;
  readonly queryRunCount: number;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly recordSetId: number | undefined;
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

  const [payload] = useAsyncState(
    React.useCallback(async () => {
      if (queryRunCount === 0) return undefined;

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
    }, [queryRunCount])
  );

  return typeof payload === 'undefined' ? null : (
    <QueryResultsTable
      model={model}
      idFieldIndex={
        queryResource.get('selectDistinct') === true ? undefined : 0
      }
      fetchResults={fetchResults}
      totalCount={payload.totalCount}
      fieldSpecs={payload.fieldSpecs}
      initialData={payload.initialData}
    />
  );
}
