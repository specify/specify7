import React from 'react';

import { ajax } from '../ajax';
import commonText from '../localization/common';
import { QueryFieldSpec } from '../queryfieldspec';
import * as querystring from '../querystring';
import { router } from '../router';
import { getModel } from '../schema';
import * as app from '../specifyapp';
import type { Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import * as s from '../stringlocalization';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { crash } from './errorboundary';
import { useTitle } from './hooks';
import { QueryResultsTable } from './queryresultstable';
import createBackboneView from './reactbackboneextend';

const relatedSearchesPromise = ajax<RA<string>>(
  '/context/available_related_searches.json',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  { headers: { Accept: 'application/json' } }
).then(({ data }) => data);

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
  readonly idFieldIndex: number;
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
      <h3>{header}</h3>
      {typeof queryResults === 'undefined' ? (
        <p aria-live="polite">{commonText('running')}</p>
      ) : Object.keys(queryResults).length === 0 ? (
        <p aria-live="polite">{commonText('noMatches')}</p>
      ) : (
        queryResults.map(
          ({ model, caption, tableResults, ajaxUrl, idFieldIndex }) => (
            <details key={ajaxUrl}>
              <summary
                className={`link list-item bg-brand-200 dark:bg-brand-500 p-1.5
        rounded hover:text-white hover:dark:bg-brand-400`}
              >
                {caption}
              </summary>
              <QueryResultsTable
                hasHeader={false}
                fieldSpecs={tableResults.fieldSpecs.map(
                  ({ stringId, isRelationship }) =>
                    QueryFieldSpec.fromStringId(stringId, isRelationship)
                )}
                idFieldIndex={idFieldIndex}
                totalCount={tableResults.totalCount}
                model={model}
                label={model.getLocalizedName()}
                initialData={tableResults.results}
                fetchResults={async (
                  offset: number
                ): Promise<RA<RA<string | number>>> =>
                  ajax<IR<QueryTableResult>>(
                    querystring.format(ajaxUrl, {
                      name: model.name,
                      offset: offset.toString(),
                    }),
                    {
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      headers: { Accept: 'application/json' },
                    }
                  ).then(({ data }) => data[model.name].results)
                }
              />
            </details>
          )
        )
      )}
    </section>
  );
}

function Results(): JSX.Element {
  useTitle(commonText('expressSearch'));

  const [primaryResults, setPrimaryResults] = React.useState<
    RA<RawQueryTableResult> | undefined
  >(undefined);
  const [secondaryResults, setSecondaryResults] = React.useState<
    RA<RawQueryTableResult> | undefined
  >(undefined);

  React.useEffect(() => {
    const query = querystring.parse().q;
    const ajaxUrl = querystring.format('/express_search/', { q: query });

    ajax<IR<QueryTableResult>>(ajaxUrl, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    })
      .then(({ data }) => {
        if (destructorCalled) return undefined;

        const views = Object.entries(data)
          .filter(([_tableName, { totalCount }]) => totalCount !== 0)
          .map(([tableName, tableResults]) => ({
            model: defined(getModel(tableName)),
            caption: defined(getModel(tableName)).getLocalizedName(),
            idFieldIndex: 0,
            tableResults,
            ajaxUrl,
          }));
        setPrimaryResults(views);

        return undefined;
      })
      .catch(crash);

    relatedSearchesPromise
      .then(async (relatedSearches) =>
        Promise.all(
          relatedSearches.map(async (tableName) => {
            const ajaxUrl = querystring.format('/express_search/related/', {
              q: query,
              name: tableName,
            });
            return ajax<RelatedTableResult>(ajaxUrl, {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              headers: { Accept: 'application/json' },
            }).then(({ data }) => [ajaxUrl, data] as const);
          })
        )
      )
      .then((results) => {
        if (destructorCalled) return undefined;

        const views = results
          .filter(([_ajaxUrl, { totalCount }]) => totalCount !== 0)
          .map(([ajaxUrl, tableResult]) => {
            let model = defined(getModel(tableResult.definition.root));
            let idFieldIndex = 0;
            const fieldSpecs = tableResult.definition.fieldSpecs.map(
              ({ stringId, isRelationship }) =>
                QueryFieldSpec.fromStringId(stringId, isRelationship)
            );
            if (tableResult.definition.link !== null) {
              const linkFieldSpec = fieldSpecs.pop();
              idFieldIndex = fieldSpecs.length + 1;
              model = defined(
                (
                  linkFieldSpec?.joinPath.slice(-1)[0] as Relationship
                ).getRelatedModel()
              );
            }

            return {
              model,
              idFieldIndex,
              caption: s.localizeFrom(
                'expresssearch',
                tableResult.definition.name
              ),
              tableResults: {
                results: tableResult.results,
                fieldSpecs: tableResult.definition.fieldSpecs,
                totalCount: tableResult.totalCount,
              },
              ajaxUrl,
            };
          });
        setSecondaryResults(views);

        return undefined;
      })
      .catch(crash);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return (
    <div className="gap-y-4 flex flex-col">
      <TableResults
        header={commonText('primarySearch')}
        queryResults={primaryResults}
      />
      <TableResults
        header={commonText('secondarySearch')}
        queryResults={secondaryResults}
      />
    </div>
  );
}

const ResultsView = createBackboneView(Results);

export default function (): void {
  router.route('express_search/', 'esearch', function () {
    app.setCurrentView(new ResultsView({}));
  });
}
