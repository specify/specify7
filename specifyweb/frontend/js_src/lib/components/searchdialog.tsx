import React from 'react';

import { error } from '../assert';
import type { AnySchema, CommonFields } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import { sortFunction } from '../helpers';
import { load } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { queryText } from '../localization/query';
import { formatUrl } from '../querystring';
import { getResourceViewUrl } from '../resource';
import { queryCbxExtendedSearch } from '../specifyapi';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { Button, className, Form, Link, Submit, Ul } from './basic';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import { ProtectedAction } from './permissiondenied';
import { QueryBuilder } from './querybuilder';
import { createQuery } from './querytask';
import { SpecifyForm } from './specifyform';

const dialogDefinitions = load<Element>(
  formatUrl('/context/app.resource', { name: 'DialogDefs' }),
  'application/xml'
);

const resourceLimit = 100;

export type QueryComboBoxFilter<SCHEMA extends AnySchema> = {
  readonly field: keyof SCHEMA['fields'] | keyof CommonFields;
  readonly operation: 'notIn' | 'in' | 'notBetween' | 'lessThan';
  readonly values: RA<string>;
};

/**
 * Display a resource search dialog
 */
export function SearchDialog<SCHEMA extends AnySchema>({
  forceCollection,
  extraFilters = [],
  templateResource,
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly forceCollection: number | undefined;
  readonly extraFilters: RA<QueryComboBoxFilter<SCHEMA>> | undefined;
  readonly templateResource: SpecifyResource<SCHEMA>;
  readonly onClose: () => void;
  readonly onSelected: (resource: SpecifyResource<SCHEMA>) => void;
}): JSX.Element | null {
  const [viewName, setViewName] = useAsyncState(
    React.useCallback(
      async () =>
        dialogDefinitions.then(
          (element) =>
            element
              .querySelector(
                `dialog[type="search"][name="${templateResource.specifyModel.searchDialog}"]`
              )
              ?.getAttribute('view') ?? false
        ),
      [templateResource]
    ),
    true
  );

  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const [results, setResults] = React.useState<
    | RA<{
        readonly id: number;
        readonly formatted: string;
        readonly resource: SpecifyResource<SCHEMA>;
      }>
    | undefined
  >(undefined);
  const id = useId('search-dialog');
  return typeof viewName === 'string' ? (
    <Dialog
      header={commonText('search')}
      modal={false}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <ProtectedAction resource="/querybuilder/query" action="execute">
            <Button.Blue onClick={(): void => setViewName(false)}>
              {queryText('queryBuilder')}
            </Button.Blue>
          </ProtectedAction>
          <Submit.Green form={id('form')}>{commonText('search')}</Submit.Green>
        </>
      }
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void => {
          handleLoading();
          queryCbxExtendedSearch(templateResource, forceCollection)
            .then(async (resources) =>
              Promise.all(
                filterResults(resources, extraFilters).map(
                  async (resource) => ({
                    id: resource.id,
                    formatted: await format(resource).then(
                      (formatted) => formatted ?? resource.id.toString()
                    ),
                    resource,
                  })
                )
              ).then((results) =>
                setResults(
                  results.sort(sortFunction(({ formatted }) => formatted))
                )
              )
            )
            .catch(crash)
            .finally(handleLoaded);
        }}
      >
        <SpecifyForm
          resource={templateResource}
          viewName={viewName}
          formType="form"
          mode="search"
          display="inline"
        />
        <Ul className="dark:bg-neutral-700 min-w-96 h-40 p-2 overflow-auto bg-white rounded">
          {isLoading ? (
            <li>{commonText('loading')}</li>
          ) : typeof results === 'undefined' ? undefined : results.length ===
            0 ? (
            <li>{commonText('noResults')}</li>
          ) : (
            <>
              {results.map(({ id, formatted, resource }) => (
                <li key={id}>
                  <Link.Default
                    href={getResourceViewUrl(
                      templateResource.specifyModel.name,
                      id
                    )}
                    className={className.navigationHandled}
                    onClick={(event): void => {
                      event.preventDefault();
                      handleSelected(resource);
                      handleClose();
                    }}
                  >
                    {formatted}
                  </Link.Default>
                </li>
              ))}
              {results.length === resourceLimit && (
                <li aria-label={formsText('additionalResultsOmitted')}>...</li>
              )}
            </>
          )}
        </Ul>
      </Form>
    </Dialog>
  ) : viewName === false ? (
    <QueryBuilderSearch
      model={templateResource.specifyModel}
      onClose={handleClose}
      onSelected={(resource) => {
        handleSelected(resource);
        handleClose();
      }}
    />
  ) : null;
}

const filterResults = <SCHEMA extends AnySchema>(
  results: RA<SpecifyResource<SCHEMA>>,
  extraFilters: RA<QueryComboBoxFilter<SCHEMA>>
): RA<SpecifyResource<SCHEMA>> =>
  results.filter((result) =>
    extraFilters.every((filter) => testFilter(result, filter))
  );

const testFilter = <SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>,
  { operation, field, values }: QueryComboBoxFilter<SCHEMA>
): boolean =>
  operation === 'notBetween'
    ? resource.get(field) < values[0] || resource.get(field) > values[1]
    : operation === 'in'
    ? values.some(f.equal(resource.get(field)))
    : operation === 'notIn'
    ? values.every(f.notEqual(resource.get(field)))
    : operation === 'lessThan'
    ? values.every((value) => resource.get(field) < value)
    : error('Invalid Query Combo Box search filter', {
        filter: {
          operation,
          field,
          values,
        },
        resource,
      });

function QueryBuilderSearch<SCHEMA extends AnySchema>({
  model,
  onSelected: handleSelected,
  onClose: handleClose,
}: {
  readonly model: SpecifyModel<SCHEMA>;
  readonly onClose: () => void;
  readonly onSelected: (resource: SpecifyResource<SCHEMA>) => void;
}): JSX.Element {
  const query = React.useMemo(
    () => createQuery(commonText('search'), model),
    [model]
  );
  return (
    <Dialog
      header={queryText('queryBuilder')}
      onClose={handleClose}
      buttons={commonText('close')}
      className={{
        container: dialogClassNames.wideContainer,
      }}
    >
      <QueryBuilder
        query={query}
        isReadOnly={false}
        model={model}
        recordSet={undefined}
        onSelected={handleSelected}
      />
    </Dialog>
  );
}
