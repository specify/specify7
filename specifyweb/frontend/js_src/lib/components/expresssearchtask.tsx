/**
 * Express Search UI
 */

import React from 'react';

import { ajax } from '../ajax';
import { contextUnlockedPromise, foreverFetch } from '../initialcontext';
import { commonText } from '../localization/common';
import { QueryFieldSpec } from '../queryfieldspec';
import { formatUrl, parseUrl } from '../querystring';
import { getModel } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { legacyLocalize } from '../stringlocalization';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { Container, H3 } from './basic';
import { useAsyncState, useTitle } from './hooks';
import { QueryResultsTable } from './queryresultstable';

const relatedSearchesPromise = contextUnlockedPromise.then(async (entrypoint) =>
  entrypoint === 'main'
    ? ajax<RA<string>>(
        '/context/available_related_searches.json',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Accept: 'application/json' } }
      ).then(({ data }) => data)
    : foreverFetch<RA<string>>()
);

type FieldSpec = {
  readonly stringId: string;
  readonly isRelationship: boolean;
};

export type QueryTableResult = {
  readonly fieldSpecs: RA<FieldSpec>;
  readonly results: RA<RA<string | number>>;
  readonly totalCount: number;
};

type RawQueryTableResult = {
  readonly model: SpecifyModel;
  readonly caption: string;
  readonly tableResults: QueryTableResult;
  readonly ajaxUrl: string;
};

type RelatedTableResult = {
  readonly definition: {
    readonly columns: RA<string>;
    readonly fieldSpecs: RA<FieldSpec>;
    readonly link: string | null;
    readonly name: string;
    readonly root: string;
  };
  readonly results: RA<RA<string | number>>;
  readonly totalCount: number;
};

function TableResults({
  header,
  queryResults,
}: {
  readonly header: string;
  readonly queryResults: RA<RawQueryTableResult> | undefined;
}): JSX.Element {
  return (
    <section className="flex flex-col gap-1">
      <H3>{header}</H3>
      {typeof queryResults === 'undefined' ? (
        <p aria-live="polite">{commonText('running')}</p>
      ) : Object.keys(queryResults).length === 0 ? (
        <p aria-live="polite">{commonText('noMatches')}</p>
      ) : (
        queryResults.map(({ model, caption, tableResults, ajaxUrl }, index) => (
          <details key={index}>
            <summary
              className="link list-item bg-brand-200 dark:bg-brand-500 p-1.5
                rounded hover:!text-white hover:dark:!bg-brand-400"
            >
              {caption}
            </summary>
            <QueryResultsTable
              fieldSpecs={tableResults.fieldSpecs.map(
                ({ stringId, isRelationship }) =>
                  QueryFieldSpec.fromStringId(stringId, isRelationship)
              )}
              hasIdField={true}
              totalCount={tableResults.totalCount}
              model={model}
              label={model.label}
              initialData={tableResults.results}
              fetchResults={async (
                offset: number
              ): Promise<RA<RA<string | number>>> =>
                ajax<IR<QueryTableResult> | QueryTableResult>(
                  formatUrl(ajaxUrl, {
                    name: model.name,
                    // The URL may already have a "name" parameter
                    ...parseUrl(ajaxUrl),
                    offset: offset.toString(),
                  }),
                  {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    headers: { Accept: 'application/json' },
                  }
                ).then(
                  ({ data }) =>
                    (model.name in data
                      ? (data as IR<QueryTableResult>)[model.name]
                      : (data as QueryTableResult)
                    ).results
                )
              }
              createRecordSet={undefined}
              tableClassName="max-h-[70vh]"
            />
          </details>
        ))
      )}
    </section>
  );
}

export function ExpressSearchView(): JSX.Element {
  useTitle(commonText('expressSearch'));

  const query = parseUrl().q;
  const ajaxUrl = formatUrl('/express_search/', { q: query });

  const [primaryResults] = useAsyncState<RA<RawQueryTableResult>>(
    React.useCallback(
      async () =>
        ajax<IR<QueryTableResult>>(ajaxUrl, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        }).then(({ data }) =>
          Object.entries(data)
            .filter(([_tableName, { totalCount }]) => totalCount > 0)
            .map(([tableName, tableResults]) => ({
              model: defined(getModel(tableName)),
              caption: defined(getModel(tableName)).label,
              tableResults,
              ajaxUrl,
            }))
        ),
      [ajaxUrl]
    ),
    false
  );
  const [secondaryResults] = useAsyncState<RA<RawQueryTableResult>>(
    React.useCallback(
      async () =>
        relatedSearchesPromise
          .then(async (relatedSearches) =>
            Promise.all(
              relatedSearches.map(async (name) => {
                const ajaxUrl = formatUrl('/express_search/related/', {
                  q: query,
                  name,
                });
                return ajax<RelatedTableResult>(ajaxUrl, {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  headers: { Accept: 'application/json' },
                }).then(({ data }) => [ajaxUrl, data] as const);
              })
            )
          )
          .then((results) =>
            results
              .filter(([_ajaxUrl, { totalCount }]) => totalCount > 0)
              .map(([ajaxUrl, tableResult]) => {
                let model = defined(getModel(tableResult.definition.root));
                let idFieldIndex = 0;
                /*const fieldSpecs = tableResult.definition.fieldSpecs.map(
                  ({ stringId, isRelationship }) =>
                    QueryFieldSpec.fromStringId(stringId, isRelationship)
                );
                if (tableResult.definition.link !== null) {
                  idFieldIndex = fieldSpecs.length - 1;
                  const relationship = defined(
                    fieldSpecs.slice(-1)[0]?.getField()
                  );
                  if (relationship.isRelationship)
                    model = relationship.relatedModel;
                  // If field is TaxonID
                  else if (relationship === relationship.model.idField)
                    model = relationship.model;
                  else throw new Error('Unable to extract relationship');
                }*/

                return {
                  model,
                  idFieldIndex,
                  caption:
                    legacyLocalize(tableResult.definition.name) ??
                    tableResult.definition.name,
                  tableResults: {
                    results: tableResult.results,
                    fieldSpecs: tableResult.definition.fieldSpecs,
                    totalCount: tableResult.totalCount,
                  },
                  ajaxUrl,
                };
              })
          ),
      [query]
    ),
    false
  );

  return (
    <Container.Full>
      <TableResults
        header={commonText('primarySearch')}
        queryResults={primaryResults}
      />
      <TableResults
        header={commonText('secondarySearch')}
        queryResults={secondaryResults}
      />
    </Container.Full>
  );
}
