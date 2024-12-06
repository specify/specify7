import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA, RR } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { SearchDialogContext } from '../Core/Contexts';
import type { AnySchema, CommonFields } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpQueryField, Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { raise } from '../Errors/Crash';
import { format } from '../Formatters/formatters';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { useViewDefinition } from '../Forms/useViewDefinition';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { ProtectedAction } from '../Permissions/PermissionDenied';
import { userPreferences } from '../Preferences/userPreferences';
import { createQuery } from '../QueryBuilder';
import type { QueryFieldFilter } from '../QueryBuilder/FieldFilter';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import { queryCbxExtendedSearch } from './helpers';
import { SelectRecordSets } from './SelectRecordSet';

const resourceLimit = 100;

export type QueryComboBoxFilter<SCHEMA extends AnySchema> = {
  readonly field: string & (keyof CommonFields | keyof SCHEMA['fields']);
  readonly isNot: boolean;
  readonly operation: QueryFieldFilter & ('between' | 'in' | 'less');
  readonly value: string;
};

const viewNameExceptions: Partial<RR<keyof Tables, string>> = {
  GeologicTimePeriod: 'ChronosStratSearch',
};

type SearchDialogProps<SCHEMA extends AnySchema> = {
  readonly forceCollection: number | undefined;
  readonly extraFilters: RA<QueryComboBoxFilter<SCHEMA>> | undefined;
  readonly table: SpecifyTable<SCHEMA>;
  readonly multiple: boolean;
  readonly onClose: () => void;
  readonly searchView?: string;
  readonly onSelected: (resources: RA<SpecifyResource<SCHEMA>>) => void;
  readonly onlyUseQueryBuilder?: boolean;
  readonly onAdd?:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
};

/**
 * Display a resource search dialog
 */
export function SearchDialog<SCHEMA extends AnySchema>(
  props: SearchDialogProps<SCHEMA>
): JSX.Element | null {
  const [alwaysUseQueryBuilder] = userPreferences.use(
    'form',
    'queryComboBox',
    'alwaysUseQueryBuilder'
  );
  const [useQueryBuilder, handleUseQueryBuilder] = useBooleanState(
    props.onlyUseQueryBuilder ? true : alwaysUseQueryBuilder
  );
  return useQueryBuilder ? (
    <QueryBuilderSearch
      // BUG: pass on extraFilters
      {...props}
      onSelected={(records): void => {
        props.onSelected(records);
        props.onClose();
      }}
    />
  ) : (
    <SearchForm {...props} onUseQueryBuilder={handleUseQueryBuilder} />
  );
}

/**
 * Displays a SearchDialog whenever `showSearchDialog` is invoked
 */
export function useSearchDialog<SCHEMA extends AnySchema>({
  onSelected: handleSelected,
  onClose: handleClosed,
  ...rest
}: Omit<SearchDialogProps<SCHEMA>, 'onClose' | 'onSelected'> &
  Partial<Pick<SearchDialogProps<SCHEMA>, 'onClose' | 'onSelected'>>): {
  readonly searchDialog: JSX.Element | null;
  readonly showSearchDialog: () => void;
} {
  const [state, setState] = React.useState<State<'Main'> | State<'Search'>>({
    type: 'Main',
  });

  return {
    searchDialog:
      state.type === 'Search' && typeof handleSelected === 'function' ? (
        <SearchDialog
          {...rest}
          onClose={(): void => {
            handleClosed?.();
            setState({ type: 'Main' });
          }}
          onSelected={handleSelected}
        />
      ) : null,
    showSearchDialog: () =>
      typeof handleSelected === 'function'
        ? setState({ type: 'Search' })
        : undefined,
  };
}

const filterResults = <SCHEMA extends AnySchema>(
  results: RA<SpecifyResource<SCHEMA>>,
  extraFilters: RA<QueryComboBoxFilter<SCHEMA>>
): RA<SpecifyResource<SCHEMA>> =>
  results.filter((result) =>
    extraFilters.every((filter) => testFilter(result, filter))
  );

function testFilter<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>,
  { operation, field, value, isNot }: QueryComboBoxFilter<SCHEMA>
): boolean {
  const values = value.split(',').map(f.trim);
  const result =
    operation === 'between'
      ? (resource.get(field) ?? 0) >= values[0] &&
        (resource.get(field) ?? 0) <= values[1]
      : operation === 'in'
      ? // Cast numbers to strings
        // eslint-disable-next-line eqeqeq
        values.some((value) => value == resource.get(field))
      : operation === 'less'
      ? values.every((value) => (resource.get(field) ?? 0) < value)
      : error('Invalid Query Combo Box search filter', {
          filter: {
            operation,
            field,
            values,
          },
          resource,
        });
  return isNot ? !result : result;
}

function SearchForm<SCHEMA extends AnySchema>({
  forceCollection,
  extraFilters = emptyArray,
  table,
  searchView,
  onSelected: handleSelected,
  onClose: handleClose,
  onUseQueryBuilder: handleUseQueryBuilder,
  onAdd: handleAdd,
}: {
  readonly forceCollection: number | undefined;
  readonly extraFilters: RA<QueryComboBoxFilter<SCHEMA>> | undefined;
  readonly table: SpecifyTable<SCHEMA>;
  readonly searchView?: string;
  readonly onClose: () => void;
  readonly onSelected: (resources: RA<SpecifyResource<SCHEMA>>) => void;
  readonly onUseQueryBuilder: () => void;
  readonly onAdd?:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
}): JSX.Element | null {
  const templateResource = React.useMemo(
    () =>
      new table.Resource(
        {},
        {
          noBusinessRules: true,
        }
      ),
    [table]
  );
  const viewName = viewNameExceptions[table.name] ?? `${table.name}Search`;

  const resolvedName = searchView ?? viewName;
  const viewDefinition = useViewDefinition({
    table,
    viewName: resolvedName,
    fallbackViewName: resolvedName === viewName ? table.view : viewName,
    formType: 'form',
    mode: 'search',
  });

  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const [results, setResults] = React.useState<
    | RA<{
        readonly id: number;
        readonly formatted: LocalizedString;
        readonly resource: SpecifyResource<SCHEMA>;
      }>
    | undefined
  >(undefined);
  const id = useId('search-dialog');

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <ProtectedAction action="execute" resource="/querybuilder/query">
            <Button.Info onClick={handleUseQueryBuilder}>
              {queryText.queryBuilder()}
            </Button.Info>
          </ProtectedAction>
          <SelectRecordSets
            handleParentClose={handleClose}
            table={table}
            onAdd={handleAdd}
          />
          <Submit.Success form={id('form')}>
            {commonText.search()}
          </Submit.Success>
        </>
      }
      dimensionsKey={`SearchDialog-${table.name}`}
      header={commonText.search()}
      icon={icons.search}
      modal={false}
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
                    formatted: await format(resource, undefined, true),
                    resource,
                  })
                )
              ).then((results) =>
                setResults(
                  Array.from(results).sort(
                    sortFunction(({ formatted }) => formatted)
                  )
                )
              )
            )
            .finally(handleLoaded)
            .catch(raise);
        }}
      >
        <SearchDialogContext.Provider value>
          <SpecifyForm
            display="inline"
            resource={templateResource}
            viewDefinition={viewDefinition}
          />
        </SearchDialogContext.Provider>
        <Ul
          className={`
            h-40 min-w-96 overflow-auto rounded
            border bg-white p-2 ring-1 ring-gray-500 dark:bg-neutral-700 dark:ring-0
          `}
        >
          {isLoading ? (
            <li>{commonText.loading()}</li>
          ) : results === undefined ? undefined : results.length === 0 ? (
            <li>{commonText.noResults()}</li>
          ) : (
            <>
              {results.map(({ id, formatted, resource }) => (
                <li key={id}>
                  <Link.Default
                    href={getResourceViewUrl(table.name, id)}
                    onClick={(event): void => {
                      event.preventDefault();
                      handleSelected([resource]);
                      handleClose();
                    }}
                  >
                    {formatted}
                  </Link.Default>
                </li>
              ))}
              {results.length === resourceLimit && (
                <li>
                  <span className="sr-only">
                    {formsText.additionalResultsOmitted()}
                  </span>
                  ...
                </li>
              )}
            </>
          )}
        </Ul>
      </Form>
    </Dialog>
  );
}

const emptyArray = [] as const;

function QueryBuilderSearch<SCHEMA extends AnySchema>({
  forceCollection,
  extraFilters = emptyArray,
  table,
  onSelected: handleSelected,
  onClose: handleClose,
  multiple,
}: {
  readonly forceCollection: number | undefined;
  readonly extraFilters: RA<QueryComboBoxFilter<SCHEMA>> | undefined;
  readonly table: SpecifyTable<SCHEMA>;
  readonly onClose: () => void;
  readonly onSelected: (resources: RA<SpecifyResource<SCHEMA>>) => void;
  readonly multiple: boolean;
}): JSX.Element {
  const query = React.useMemo(
    () =>
      createQuery(commonText.search(), table).set(
        'fields',
        toQueryFields(table, extraFilters)
      ),
    [table, extraFilters]
  );
  const [selected, setSelected] = React.useState<RA<number>>([]);

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info
            disabled={
              selected.length === 0 || (selected.length > 1 && !multiple)
            }
            onClick={(): void =>
              handleSelected(selected.map((id) => new table.Resource({ id })))
            }
          >
            {commonText.select()}
          </Button.Info>
        </>
      }
      className={{
        container: dialogClassNames.wideContainer,
      }}
      dimensionsKey="QueryBuilder"
      header={queryText.queryBuilder()}
      icon={icons.search}
      onClose={handleClose}
    >
      <QueryBuilder
        forceCollection={forceCollection}
        isEmbedded
        query={query}
        recordSet={undefined}
        onSelected={setSelected}
      />
    </Dialog>
  );
}

const toQueryFields = <SCHEMA extends AnySchema>(
  table: SpecifyTable<SCHEMA>,
  filters: RA<QueryComboBoxFilter<SCHEMA>>
): RA<SpecifyResource<SpQueryField>> =>
  filters.map(({ field, operation, isNot, value }) =>
    QueryFieldSpec.fromPath(table.name, [field])
      .toSpQueryField()
      .set('operStart', queryFieldFilters[operation].id)
      .set('isNot', isNot)
      .set('startValue', value)
  );
