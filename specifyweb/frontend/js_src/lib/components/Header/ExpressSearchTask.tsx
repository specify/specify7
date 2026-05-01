/**
 * Express Search UI
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useId } from '../../hooks/useId';
import { useTriggerState } from '../../hooks/useTriggerState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { GetSet, IR, RA } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { serializeResource } from '../DataModel/serializers';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { ExpressSearchConfigDialog } from '../ExpressSearchConfig/ExpressSearchConfigDialog';
import { WelcomeView } from '../HomePage';
import { Dialog } from '../Molecules/Dialog';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { parseQueryFields } from '../QueryBuilder/helpers';
import { QueryResults } from '../QueryBuilder/Results';
import { formatUrl, parseUrl } from '../Router/queryString';
import { OverlayContext } from '../Router/Router';
import { hasToolPermission } from '../Permissions/helpers';
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

const expressSearchDocumentationUrl =
  'https://discourse.specifysoftware.org/t/simple-search/185';

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
      <SearchForm formId={formId} />
    </Dialog>
  );
}

export function SearchForm({
  formId,
}: {
  readonly formId: string;
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
      <SearchField value={value} />
    </Form>
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
      className="flex-1 bg-[color:var(--field-background)] py-2"
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

function ExpressSearchInstructions({
  onClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200">
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold">
          {commonText.expressSearchInstructionsTitle()}
        </p>
        <div className="flex items-center gap-2">
          {typeof expressSearchDocumentationUrl === 'string' && (
            <Link.NewTab href={expressSearchDocumentationUrl}>
              {headerText.documentation()}
            </Link.NewTab>
          )}
          <Button.Icon
            icon="x"
            title={commonText.close()}
            onClick={onClose}
          />
        </div>
      </div>
      <ul className="mt-2 space-y-1 list-disc pl-5">
        <li>{commonText.expressSearchInstructions()}</li>
        <li>{commonText.expressSearchPhraseExample()}</li>
        <li>{commonText.expressSearchDateFormats()}</li>
      </ul>
    </div>
  );
}

export function ExpressSearchView(): JSX.Element {
  const [query = '', setQuery] = useSearchParameter('q');
  const value = useTriggerState(query);
  const [pendingQuery] = value;
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);
  const [configRefreshTrigger, setConfigRefreshTrigger] = React.useState(0);
  const [showInstructions = true, setShowExpressSearchInstructions] = useCachedState(
    'expressSearch',
    'showSearchTips'
  );
  const canEditExpressSearchConfig =
    hasToolPermission('resources', 'read') &&
    hasToolPermission('resources', 'create') &&
    hasToolPermission('resources', 'update');

  const primaryResults = usePrimarySearch(query, configRefreshTrigger);
  const secondaryResults = useSecondarySearch(query, configRefreshTrigger);

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
        <div className="flex items-center gap-2">
          <H2>{headerText.simpleSearch()}</H2>
          <Button.Icon
            icon="questionCircle"
            title={commonText.expressSearchInstructionsTitle()}
            onClick={(): void => setShowExpressSearchInstructions((value) => !value)}
          />
        </div>
        {showInstructions && (
          <ExpressSearchInstructions onClose={(): void => setShowExpressSearchInstructions(false)} />
        )}
        <Form onSubmit={(): void => setQuery(pendingQuery)}>
          <div className="flex items-center gap-2">
            <SearchField value={value} />
            {canEditExpressSearchConfig && (
              <Button.BorderedGray
                className="!px-2"
                title={commonText.configureExpressSearch()}
                onClick={() => setIsConfigOpen(true)}
              >
                {icons.cog}
              </Button.BorderedGray>
            )}
          </div>
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
          <WelcomeView hideSearchBar />
          <div />
        </>
      )}
      {canEditExpressSearchConfig && (
        <ExpressSearchConfigDialog
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onSave={() => setConfigRefreshTrigger((value) => value + 1)}
        />
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
          link bg-brand-300 dark:bg-brand-400 hover:dark:!bg-brand-400 list-item
          rounded p-1.5 !text-white
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
