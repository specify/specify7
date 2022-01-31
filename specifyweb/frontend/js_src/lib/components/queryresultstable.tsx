import React from 'react';

import type { AnyTree } from '../datamodelutils';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryFieldSpec } from '../queryfieldspec';
import type { SpecifyModel } from '../specifymodel';
import { getTreeDefinitionItems } from '../treedefinitions';
import type { RA } from '../types';
import { ContainerBase } from './basic';
import { TableIcon } from './common';
import { crash } from './errorboundary';
import { dateParts } from './internationalization';
import { QueryResults } from './queryresults';

function TableHeaderCell({
  fieldSpec,
}: {
  readonly fieldSpec: QueryFieldSpec;
}): JSX.Element {
  const field = fieldSpec.getField();
  const tableName = field?.model.name;
  const name = field?.getLocalizedName() ?? field?.name ?? '';

  const label =
    typeof fieldSpec.treeRank === 'string'
      ? getTreeDefinitionItems(
          fieldSpec.table.name as AnyTree['tableName'],
          false
        ).find(({ name }) => name === fieldSpec.treeRank)?.title ??
        fieldSpec.treeRank
      : typeof fieldSpec.datePart === 'string' &&
        fieldSpec.datePart !== 'fullDate'
      ? `${name} (${dateParts[fieldSpec.datePart]})`
      : name;

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
  countOnly = false,
  hasHeader,
  idFieldIndex,
  fetchResults,
  totalCount,
  fieldSpecs,
  initialData,
}: {
  readonly model: SpecifyModel;
  readonly label?: string;
  readonly countOnly?: boolean;
  readonly hasHeader: boolean;
  readonly idFieldIndex: number | undefined;
  readonly fetchResults: (offset: number) => Promise<RA<RA<string | number>>>;
  readonly totalCount: number;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly initialData: RA<RA<string | number>>;
}): JSX.Element {
  const [isFetching, setIsFetching] = React.useState(false);
  const [results, setResults] =
    React.useState<RA<RA<string | number>>>(initialData);

  return (
    <ContainerBase>
      {hasHeader && <h3 aria-live="polite">${`${label}: (${totalCount})`}</h3>}
      {!countOnly && (
        <div
          role="table"
          className="grid-table grid-cols-[repeat(var(--cols),auto)] overflow-auto max-h-[75vh]"
          style={{ '--cols': fieldSpecs.length } as React.CSSProperties}
          onScroll={
            isFetching || results.length === totalCount
              ? ({ target }): void => {
                  if (!isScrolledBottom(target as HTMLElement)) return;
                  setIsFetching(true);
                  fetchResults(results.length)
                    .then((newResults) =>
                      setResults([...results, ...newResults])
                    )
                    .then(() => setIsFetching(false))
                    .catch(crash);
                }
              : undefined
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
