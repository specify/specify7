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
import { f } from '../../utils/functools';
import type { GetSet, IR, RA } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { serializeResource } from '../DataModel/serializers';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { WelcomeView } from '../HomePage';
import { Dialog } from '../Molecules/Dialog';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { parseQueryFields } from '../QueryBuilder/helpers';
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
import { useMenuItem } from './MenuContext';

export function ExpressSearchOverlay(): JSX.Element {
  useMenuItem('search');
  const formId = useId('express-search')('form');
  const handleClose = React.useContext(OverlayContext);
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Info form={formId}>{commonText.search()}</Submit.Info>
        </>
      }
      header={headerText.simpleSearch()}
      icon={icons.search}
      onClose={handleClose}
    >
      <SearchForm autoFocus formId={formId} />
    </Dialog>
  );
}

export function SearchForm({
  formId,
  autoFocus,
}: {
  readonly formId: string;
  readonly autoFocus: boolean;
}): JSX.Element {
  const navigate = useNavigate();
  const [query = ''] = useSearchParameter('q');
  const value = React.useState(query);
  const [pendingQuery] = value;
  return (
    <Form
      id={formId}
      onSubmit={(): void =>
        navigate(formatUrl('/specify/express-search/', { q: pendingQuery }))
      }
    >
      <SearchField autoFocus={autoFocus} value={value} />
    </Form>
  );
}

function SearchField({
  value: [value, setValue],
  autoFocus,
}: {
  readonly value: GetSet<string>;
  readonly autoFocus: boolean;
}): JSX.Element {
  return (
    <Input.Generic
      aria-label={commonText.search()}
      autoComplete="on"
      autoFocus={autoFocus}
      placeholder={commonText.search()}
      required
      type="search"
      value={value}
      onValueChange={setValue}
      className="flex-1 bg-[color:var(--field-background)]"
      // Name is for autocomplete purposes only
      name="searchQuery"
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
        <H2>{headerText.simpleSearch()}</H2>
        <Form onSubmit={(): void => setQuery(pendingQuery)}>
          <SearchField autoFocus value={value} />
          <Submit.Info className="sr-only">{commonText.search()}</Submit.Info>
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
  table,
  caption,
  tableResults,
  ajaxUrl,
}: RawExpressSearchResult): JSX.Element {
  const handleFetch = React.useCallback(
    async (offset: number): Promise<RA<RA<number | string>>> =>
      ajax<IR<QueryTableResult> | QueryTableResult>(
        formatUrl(ajaxUrl, {
          name: table.name,
          // The URL may already have a "name" parameter
          ...parseUrl(ajaxUrl),
          offset,
        }),
        {
          headers: { Accept: 'application/json' },
        }
      ).then(
        ({ data }) =>
          (table.name in data
            ? (data as IR<QueryTableResult>)[table.name]
            : (data as QueryTableResult)
          ).results
      ),
    [ajaxUrl, table.name]
  );

  const fieldSpecs = React.useMemo(
    () =>
      tableResults.fieldSpecs.map(({ stringId, isRelationship }) =>
        QueryFieldSpec.fromStringId(stringId, isRelationship)
      ),
    [tableResults.fieldSpecs]
  );

  const allFields = React.useMemo(
    () =>
      parseQueryFields(
        fieldSpecs.map((fieldSpec) =>
          serializeResource(fieldSpec.toSpQueryField())
        )
      ),
    [fieldSpecs]
  );

  const [selectedRows, setSelectedRows] = React.useState<ReadonlySet<number>>(
    new Set()
  );

  return (
    <details>
      <summary
        className={`
          link bg-brand-200 dark:bg-brand-500 hover:dark:!bg-brand-400 list-item
          rounded p-1.5 hover:!text-white
        `}
      >
        {commonText.countLine({
          resource: caption,
          count: tableResults.totalCount,
        })}
      </summary>
      <ErrorBoundary dismissible>
        <QueryResults
          allFields={allFields}
          createRecordSet={undefined}
          displayedFields={allFields}
          extraButtons={undefined}
          fetchResults={handleFetch}
          fetchSize={expressSearchFetchSize}
          fieldSpecs={fieldSpecs}
          initialData={tableResults.results}
          label={table.label}
          queryResource={undefined}
          selectedRows={[selectedRows, setSelectedRows]}
          table={table}
          tableClassName="max-h-[70vh]"
          totalCount={tableResults.totalCount}
          // Note, results won't be refreshed after doing record merging
          onReRun={f.void}
        />
      </ErrorBoundary>
    </details>
  );
}
