/**
 * Express Search UI
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useId } from '../../hooks/useId';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { ajax } from '../../utils/ajax';
import type { GetSet, IR, RA } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { WelcomeView } from '../HomePage';
import { Dialog } from '../Molecules/Dialog';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { QueryResults } from '../QueryBuilder/Results';
import { formatUrl, parseUrl } from '../Router/queryString';
import { OverlayContext } from '../Router/Router';
import type {
  QueryTableResult,
  RawExpressSearchResult,
} from './ExpressSearchHooks';
import {
  expressSearchFetchSize,
  usePrimarySearch,
  useSecondarySearch,
} from './ExpressSearchHooks';
import { useMenuItem } from './useMenuItem';

export function ExpressSearchOverlay(): JSX.Element {
  useMenuItem('search');
  const [query = ''] = useSearchParameter('q');
  const value = React.useState(query);
  const [pendingQuery] = value;
  const navigate = useNavigate();
  const formId = useId('express-search')('form');
  const handleClose = React.useContext(OverlayContext);
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Blue form={formId}>{commonText.search()}</Submit.Blue>
        </>
      }
      header={headerText.expressSearch()}
      onClose={handleClose}
    >
      <Form
        id={formId}
        onSubmit={(): void =>
          navigate(formatUrl('/specify/express-search/', { q: pendingQuery }))
        }
      >
        <SearchField value={value} />
      </Form>
    </Dialog>
  );
}

function SearchField({
  value: [value, setValue],
}: {
  readonly value: GetSet<string>;
}): JSX.Element {
  return (
    <Input.Generic
      aria-label={commonText.search()}
      autoComplete="on"
      className="flex-1"
      // Name is for autocomplete purposes only
      name="searchQuery"
      placeholder={commonText.search()}
      required
      type="search"
      value={value}
      onValueChange={setValue}
    />
  );
}

export function ExpressSearchView(): JSX.Element {
  const [query = '', setQuery] = useSearchParameter('q');
  const value = useTriggerState(query);
  const [pendingQuery] = value;

  const primaryResults = usePrimarySearch(query);
  const secondaryResults = useSecondarySearch(query);

  return (
    <Container.Full
      className={`
        p-0
        ${
          query.length === 0
            ? 'grid h-full grid-cols-1 grid-rows-[1fr_auto_1fr]'
            : ''
        }
      `}
    >
      <div className="flex flex-col gap-2 p-4">
        <H2>{headerText.expressSearch()}</H2>
        <Form onSubmit={(): void => setQuery(pendingQuery)}>
          <SearchField value={value} />
          <Submit.Blue className="sr-only">{commonText.search()}</Submit.Blue>
        </Form>
      </div>
      {query.length > 0 ? (
        <div className="flex flex-col gap-8 p-4">
          {primaryResults !== false && (
            <TableResults
              header={headerText.primarySearch()}
              queryResults={primaryResults}
            />
          )}
          {secondaryResults !== false && (
            <TableResults
              header={headerText.secondarySearch()}
              queryResults={secondaryResults}
            />
          )}
        </div>
      ) : (
        <>
          <WelcomeView />
          <div />
        </>
      )}
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
    <section className="flex flex-col gap-4">
      <H3>{header}</H3>
      {queryResults === undefined ? (
        <p aria-live="polite">{commonText.running()}</p>
      ) : Object.keys(queryResults).length === 0 ? (
        <p aria-live="polite">{commonText.noMatches()}</p>
      ) : (
        queryResults.map((results, index) => (
          <TableResult key={index} {...results} />
        ))
      )}
    </section>
  );
}

function TableResult({
  model,
  caption,
  tableResults,
  ajaxUrl,
}: RawExpressSearchResult): JSX.Element {
  const handleFetch = React.useCallback(
    async (offset: number): Promise<RA<RA<number | string>>> =>
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
      ),
    [ajaxUrl, model.name]
  );

  return (
    <details>
      <summary
        className={`
          link list-item rounded bg-brand-200 p-1.5
          hover:!text-white dark:bg-brand-500 hover:dark:!bg-brand-400
        `}
      >
        {commonText.countLine({
          resource: caption,
          count: tableResults.totalCount,
        })}
      </summary>
      <ErrorBoundary dismissible>
        <QueryResults
          createRecordSet={undefined}
          extraButtons={undefined}
          fetchResults={handleFetch}
          fetchSize={expressSearchFetchSize}
          fieldSpecs={tableResults.fieldSpecs.map(
            ({ stringId, isRelationship }) =>
              QueryFieldSpec.fromStringId(stringId, isRelationship)
          )}
          hasIdField
          initialData={tableResults.results}
          label={model.label}
          model={model}
          queryResource={undefined}
          tableClassName="max-h-[70vh]"
          totalCount={tableResults.totalCount}
        />
      </ErrorBoundary>
    </details>
  );
}
