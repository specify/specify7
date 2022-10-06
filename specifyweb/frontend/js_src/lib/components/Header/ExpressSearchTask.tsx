/**
 * Express Search UI
 */

import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { Container, H3 } from '../Atoms';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { QueryResults } from '../QueryBuilder/Results';
import { formatUrl, parseUrl } from '../Router/queryString';
import type {
  QueryTableResult,
  RawExpressSearchResult,
} from './ExpressSearchHooks';
import {
  expressSearchFetchSize,
  usePrimarySearch,
  useSecondarySearch,
} from './ExpressSearchHooks';

export function ExpressSearchView(): JSX.Element {
  const [query = ''] = useSearchParameter('q');
  /*
   * Opening an overlay clears the query string, thus causing new stats
   * requests, which fail
   */
  const queryRef = React.useRef(query);
  const ajaxUrl = formatUrl('/express_search/', {
    q: queryRef.current,
    limit: expressSearchFetchSize.toString(),
  });

  const primaryResults = usePrimarySearch(ajaxUrl);
  const secondaryResults = useSecondarySearch(queryRef.current);

  return (
    <Container.Full>
      {primaryResults !== false && (
        <TableResults
          header={commonText('primarySearch')}
          queryResults={primaryResults}
        />
      )}
      <TableResults
        header={commonText('secondarySearch')}
        queryResults={secondaryResults}
      />
    </Container.Full>
  );
}

function TableResults({
  header,
  queryResults,
}: {
  readonly header: string;
  readonly queryResults: RA<RawExpressSearchResult> | undefined;
}): JSX.Element {
  return (
    <section className="flex flex-col gap-1">
      <H3>{header}</H3>
      {queryResults === undefined ? (
        <p aria-live="polite">{commonText('running')}</p>
      ) : Object.keys(queryResults).length === 0 ? (
        <p aria-live="polite">{commonText('noMatches')}</p>
      ) : (
        queryResults.map(({ model, caption, tableResults, ajaxUrl }, index) => (
          <details key={index}>
            <summary
              className="link list-item rounded bg-brand-200 p-1.5
                hover:!text-white dark:bg-brand-500 hover:dark:!bg-brand-400"
            >
              {`${caption} (${tableResults.totalCount})`}
            </summary>
            <ErrorBoundary dismissable>
              <QueryResults
                createRecordSet={undefined}
                extraButtons={undefined}
                fetchResults={async (
                  offset: number
                ): Promise<RA<RA<number | string>>> =>
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
                fetchSize={expressSearchFetchSize}
                fieldSpecs={tableResults.fieldSpecs.map(
                  ({ stringId, isRelationship }) =>
                    QueryFieldSpec.fromStringId(stringId, isRelationship)
                )}
                hasIdField
                initialData={tableResults.results}
                label={model.label}
                model={model}
                tableClassName="max-h-[70vh]"
                totalCount={tableResults.totalCount}
              />
            </ErrorBoundary>
          </details>
        ))
      )}
    </section>
  );
}
