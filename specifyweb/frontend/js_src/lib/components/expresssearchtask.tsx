import React from 'react';

import ajax from '../ajax';
import commonText from '../localization/common';
import QueryFieldSpec from '../queryfieldspec';
import QueryResultsTable from '../queryresultstable';
import * as querystring from '../querystring';
import router from '../router';
import { getModel } from '../schema';
import * as app from '../specifyapp';
import type SpecifyModel from '../specifymodel';
import * as s from '../stringlocalization';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { crash } from './errorboundary';
import { useTitle } from './hooks';
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

type TableResult = {
  readonly displayOrder: number;
  readonly fieldSpecs: RA<FieldSpec>;
  readonly results: RA<RA<string | number>>;
  readonly totalCount: number;
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

// TODO: translate QueryResultsTable to React
type View = {
  readonly results: {
    readonly fetchMoreWhileAppropriate: () => void;
  };
  readonly render: () => { readonly el: HTMLElement };
  readonly remove: () => void;
};

function TableResults({
  summary,
  view,
}: {
  readonly summary: string;
  readonly view: View;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (containerRef.current === null) return undefined;
    containerRef.current.append(view.render().el);
    return (): void => {
      view.remove();
    };
  }, [view]);

  return (
    <details
      onToggle={({ target }): void =>
        (target as HTMLElement).hasAttribute('open')
          ? view.results.fetchMoreWhileAppropriate()
          : undefined
      }
    >
      <summary className="link list-item bg-brand-200 p-1.5 rounded hover:text-white">
        {summary}
      </summary>
      <div ref={containerRef} />
    </details>
  );
}

function Results(): JSX.Element {
  useTitle(commonText('expressSearch'));

  const [primaryResults, setPrimaryResults] = React.useState<
    IR<View> | undefined
  >(undefined);
  const [secondaryResults, setSecondaryResults] = React.useState<
    IR<View> | undefined
  >(undefined);

  React.useEffect(() => {
    const query = querystring.parse().q;
    const ajaxUrl = querystring.format('/express_search/', { q: query });

    ajax<IR<TableResult>>(ajaxUrl, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    })
      .then(({ data }) => {
        if (destructorCalled) return undefined;

        const views = Object.entries(data)
          .filter(([_tableName, { totalCount }]) => totalCount !== 0)
          .map(([tableName, tableResults]) => {
            const model = defined(getModel(tableName));

            const view: View = new QueryResultsTable({
              noHeader: true,
              model,
              fieldSpecs: tableResults.fieldSpecs.map(
                ({ stringId, isRelationship }) =>
                  QueryFieldSpec.fromStringId(stringId, isRelationship)
              ),
              format: true,
              initialData: tableResults,
              async fetchResults(offset: number): Promise<TableResult> {
                const url = querystring.format(ajaxUrl, {
                  name: model.name,
                  offset: offset.toString(),
                });
                return ajax<IR<TableResult>>(url, {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  headers: { Accept: 'application/json' },
                }).then(({ data }) => data[model.name]);
              },
            });

            const summary = `${model.getLocalizedName()} - ${
              tableResults.totalCount
            }`;
            return [summary, view] as const;
          });
        setPrimaryResults(Object.fromEntries(views));

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
            const fieldSpecs = tableResult.definition.fieldSpecs.map(
              ({ stringId, isRelationship }) =>
                QueryFieldSpec.fromStringId(stringId, isRelationship)
            );
            let model = defined(getModel(tableResult.definition.root));
            let linkField = 0;
            if (tableResult.definition.link !== null) {
              const linkFieldSpec = fieldSpecs.pop();
              linkField = fieldSpecs.length + 1;
              model = linkFieldSpec.joinPath
                .slice(-1)[0]
                .getRelatedModel() as SpecifyModel;
            }

            const view: View = new QueryResultsTable({
              noHeader: true,
              model,
              fieldSpecs,
              linkField,
              initialData: tableResult,
              ajaxUrl,
            });
            const summary = `${s.localizeFrom(
              'expresssearch',
              tableResult.definition.name
            )} - ${tableResult.totalCount}`;

            return [summary, view] as const;
          });
        setSecondaryResults(Object.fromEntries(views));

        return undefined;
      })
      .catch(crash);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return (
    <>
      <section>
        <h3>{commonText('primarySearch')}</h3>
        {typeof primaryResults === 'undefined' ? (
          <p aria-live="polite">{commonText('running')}</p>
        ) : Object.keys(primaryResults).length === 0 ? (
          <p aria-live="polite">{commonText('noMatches')}</p>
        ) : (
          Object.entries(primaryResults).map(([summary, view]) => (
            <TableResults key={summary} summary={summary} view={view} />
          ))
        )}
      </section>

      <section>
        <h3>{commonText('secondarySearch')}</h3>
        {typeof secondaryResults === 'undefined' ? (
          <p aria-live="polite">{commonText('running')}</p>
        ) : Object.keys(secondaryResults).length === 0 ? (
          <p aria-live="polite">{commonText('noMatches')}</p>
        ) : (
          Object.entries(secondaryResults).map(([summary, view]) => (
            <TableResults key={summary} summary={summary} view={view} />
          ))
        )}
      </section>
    </>
  );
}

const ResultsView = createBackboneView(Results);

export default function (): void {
  router.route('express_search/', 'esearch', function () {
    app.setCurrentView(new ResultsView({}));
  });
}
