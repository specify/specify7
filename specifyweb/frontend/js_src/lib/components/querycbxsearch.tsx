import React from 'react';

import { error } from '../assert';
import type { AnySchema, CommonFields } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { load } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { getResourceViewUrl } from '../resource';
import { queryCbxExtendedSearch } from '../specifyapi';
import type { RA } from '../types';
import { f, sortObjectsByKey } from '../wbplanviewhelper';
import { Button, className, Form, Link, Submit, Ul } from './basic';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { Dialog } from './modaldialog';
import { SpecifyForm } from './specifyform';

const dialogDefinitions = load<Element>(
  '/context/app.resource?name=DialogDefs',
  'application/xml'
);

const resourceLimit = 100;

export type QueryComboBoxFilter<SCHEMA extends AnySchema> = {
  readonly field: keyof SCHEMA['fields'] | keyof CommonFields;
  readonly operation: 'notIn' | 'in' | 'between' | 'lessThan';
  readonly values: RA<string>;
};

// TODO: update usages
export function QueryComboBoxSearch<SCHEMA extends AnySchema>({
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
  readonly onSelected: (resurce: SpecifyResource<SCHEMA>) => void;
}): JSX.Element | null {
  const [viewName] = useAsyncState(
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
  const id = useId('query-combo-box-search');
  return typeof viewName === 'string' ? (
    <Dialog
      header={commonText('search')}
      modal={false}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
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
                setResults(sortObjectsByKey(results, 'formatted'))
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
          hasHeader={false}
        />
        <Ul className="bg-white dark:bg-neutral-700 h-40 min-w-[275px] overflow-auto p-2">
          {isLoading || typeof results === 'undefined' ? (
            <li>{commonText('loading')}</li>
          ) : results.length === 0 ? (
            <li>${commonText('noResults')}</li>
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
  ) : typeof viewName === 'undefined' ? null : (
    error(
      `Unable to find a search dialog for the ${templateResource.specifyModel.name} table`
    )
  );
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
  operation === 'between'
    ? resource.get(field) < values[0] && resource.get(field) > values[1]
    : operation === 'in'
    ? values.some(f.equal(resource.get(field)))
    : operation === 'notIn'
    ? values.every(f.notEqual(resource.get(field)))
    : operation === 'lessThan'
    ? values.every((value) => resource.get(field) > value)
    : error('Invalid Query Combo Box search filter', {
        filter: {
          operation,
          field,
          values,
        },
        resource,
      });
