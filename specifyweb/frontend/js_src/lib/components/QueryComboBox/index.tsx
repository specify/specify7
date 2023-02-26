import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useResourceValue } from '../../hooks/useResourceValue';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  fetchResource,
  getResourceApiUrl,
  resourceOn,
} from '../DataModel/resource';
import { serializeResource } from '../DataModel/serializers';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import {
  format,
  getMainTableFields,
  naiveFormatter,
} from '../Formatters/formatters';
import type { FormType } from '../FormParse';
import { ResourceView, RESTRICT_ADDING } from '../Forms/ResourceView';
import type { QueryComboBoxFilter } from '../SearchDialog';
import { SearchDialog } from '../SearchDialog';
import { SubViewContext } from '../Forms/SubView';
import { isTreeTable } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import type { AutoCompleteItem } from '../Molecules/AutoComplete';
import { AutoComplete } from '../Molecules/AutoComplete';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import {
  getQueryComboBoxConditions,
  getRelatedCollectionId,
  makeComboBoxQuery,
} from './helpers';
import type { TypeSearch } from './spec';
import { useCollectionRelationships } from './useCollectionRelationships';
import { useTreeData } from './useTreeData';
import { useTypeSearch } from './useTypeSearch';

/*
 * REFACTOR: split this component
 * TEST: add tests for this
 */
export function QueryComboBox({
  id,
  resource,
  field,
  formType,
  isRequired,
  hasCloneButton = false,
  typeSearch: initialTypeSearch,
  forceCollection,
  relatedTable: initialRelatedTable,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: Relationship;
  readonly formType: FormType;
  readonly isRequired: boolean;
  readonly hasCloneButton?: boolean;
  readonly typeSearch: TypeSearch | string | undefined;
  readonly forceCollection: number | undefined;
  readonly relatedTable?: SpecifyTable | undefined;
}): JSX.Element {
  React.useEffect(() => {
    if (resource === undefined || !resource.isNew()) return;
    if (field.name === 'cataloger') {
      const record = toTable(resource, 'CollectionObject');
      record?.set(
        'cataloger',
        record?.get('cataloger') ?? userInformation.agent.resource_uri,
        {
          silent: true,
        }
      );
    }
    if (field.name === 'receivedBy') {
      const record = toTable(resource, 'LoanReturnPreparation');
      record?.set(
        'receivedBy',
        record?.get('receivedBy') ?? userInformation.agent.resource_uri,
        {
          silent: true,
        }
      );
    }
  }, [resource, field]);

  const treeData = useTreeData(resource, field);
  const collectionRelationships = useCollectionRelationships(resource);
  const typeSearch = useTypeSearch(
    initialTypeSearch,
    field,
    initialRelatedTable
  );

  const isLoaded =
    treeData !== undefined &&
    collectionRelationships !== undefined &&
    typeSearch !== undefined;
  const { value, updateValue, validationRef, inputRef, parser } =
    useResourceValue(resource, field, undefined);

  /**
   * When resource is saved, a new instance of dependent resources is created.
   * useResourceValue is listening for that change event, but it only works
   * with resource URL, not resource object itself. Since the URL of a related
   * resource does not change on save, QueryComboBox is left displaying a stale
   * resource.
   * REFACTOR: get rid of the need for this
   */
  const [version, setVersion] = React.useState(0);
  React.useEffect(
    () =>
      resource === undefined
        ? undefined
        : resourceOn(
            resource,
            'saved',
            () => setVersion((version) => version + 1),
            false
          ),
    [resource]
  );

  /*
   * Stores the formatted resource returned by the query from the back-end
   * If back-end query hasn't been executed yet (i.e, because the form has
   * just been opened), the resource would be fetched and formatted separately
   */
  const formattedRef = React.useRef<
    { readonly value: string; readonly formatted: LocalizedString } | undefined
  >(undefined);
  const [formatted] = useAsyncState<{
    readonly label: LocalizedString;
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }>(
    React.useCallback(
      async () =>
        typeof resource === 'object' &&
        (hasTablePermission(field.relatedTable.name, 'read') ||
          /*
           * If related resource is already provided, can display it
           * Even if don't have read permission (i.e, Agent for current
           * User)
           */
          typeof resource.getDependentResource(field.name) === 'object')
          ? resource
              .rgetPromise<string, AnySchema>(field.name)
              .then((resource) =>
                resource === undefined || resource === null
                  ? {
                      label: '',
                      resource: undefined,
                    }
                  : (value === formattedRef.current?.value &&
                    typeof formattedRef.current === 'object'
                      ? Promise.resolve(formattedRef.current.formatted)
                      : format(
                          resource,
                          typeof typeSearch === 'object'
                            ? typeSearch.formatter
                            : undefined
                        )
                    ).then((formatted) => ({
                      label:
                        formatted ??
                        naiveFormatter(field.relatedTable.label, resource.id),
                      resource,
                    }))
              )
          : { label: userText.noPermission(), resource: undefined },
      [version, value, resource, field, typeSearch]
    ),
    false
  );

  const [state, setState] = React.useState<
    | State<
        'AddResourceState',
        { readonly resource: SpecifyResource<AnySchema> }
      >
    | State<
        'SearchState',
        {
          readonly extraConditions: RA<QueryComboBoxFilter<AnySchema>>;
          readonly templateResource: SpecifyResource<AnySchema>;
        }
      >
    | State<'AccessDeniedState', { readonly collectionName: string }>
    | State<'MainState'>
    | State<'ViewResourceState'>
  >({ type: 'MainState' });

  const relatedCollectionId =
    typeof collectionRelationships === 'object' && typeof resource === 'object'
      ? getRelatedCollectionId(collectionRelationships, resource, field.name)
      : undefined;

  const loading = React.useContext(LoadingContext);
  const handleOpenRelated = (): void =>
    state.type === 'ViewResourceState' || state.type === 'AccessDeniedState'
      ? setState({ type: 'MainState' })
      : typeof relatedCollectionId === 'number' &&
        !userInformation.availableCollections.some(
          ({ id }) => id === relatedCollectionId
        )
      ? loading(
          fetchResource('Collection', relatedCollectionId).then((collection) =>
            setState({
              type: 'AccessDeniedState',
              collectionName: collection?.collectionName ?? '',
            })
          )
        )
      : setState({ type: 'ViewResourceState' });

  const subViewRelationship = React.useContext(SubViewContext)?.relationship;
  const pendingValueRef = React.useRef('');

  function pendingValueToResource(
    relationship: Relationship
  ): SpecifyResource<AnySchema> {
    const fieldName =
      (typeof typeSearch === 'object'
        ? typeSearch?.searchFields.find(
            ([searchField]) =>
              !searchField.isRelationship &&
              searchField.table === relationship.relatedTable &&
              !searchField.isReadOnly
          )?.[0].name
        : undefined) ??
      getMainTableFields(relationship.relatedTable.name)[0]?.name;
    return new relationship.relatedTable.Resource(
      /*
       * If some value is currently in the input field, try to figure out which
       * field it is intended for and populate that field in the new resource.
       * Most of the time, that field is determined based on the search field
       */
      typeof fieldName === 'string'
        ? { [fieldName]: pendingValueRef.current }
        : {}
    );
  }

  const fetchSource = React.useCallback(
    async (value: string): Promise<RA<AutoCompleteItem<string>>> =>
      isLoaded && typeof typeSearch === 'object' && typeof resource === 'object'
        ? Promise.all(
            typeSearch.searchFields
              .map((fields) =>
                makeComboBoxQuery({
                  fieldName: fields.map(({ name }) => name).join('.'),
                  value,
                  isTreeTable: isTreeTable(field.relatedTable.name),
                  typeSearch,
                  specialConditions: getQueryComboBoxConditions({
                    resource,
                    fieldName: fields.map(({ name }) => name).join('.'),
                    collectionRelationships:
                      typeof collectionRelationships === 'object'
                        ? collectionRelationships
                        : undefined,
                    treeData:
                      typeof treeData === 'object' ? treeData : undefined,
                    typeSearch,
                    subViewRelationship,
                  }),
                })
              )
              .map(serializeResource)
              .map((query) => ({
                ...query,
                fields: query.fields.map((field, index) => ({
                  ...field,
                  position: index,
                })),
              }))
              .map(async (query) =>
                ajax<{
                  readonly results: RA<
                    readonly [id: number, label: LocalizedString]
                  >;
                }>('/stored_query/ephemeral/', {
                  method: 'POST',
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  headers: { Accept: 'application/json' },
                  body: keysToLowerCase({
                    ...query,
                    collectionId: forceCollection ?? relatedCollectionId,
                    // REFACTOR: allow customizing these arbitrary limits
                    limit: 1000,
                  }),
                })
              )
          ).then((responses) =>
            /*
             * If there are multiple search fields and both returns the
             * same record, it may be presented in results twice. Would
             * be fixed by using OR queries
             * REFACTOR: refactor to use OR queries across fields once
             *   supported
             */
            responses
              .flatMap(({ data: { results } }) => results)
              .map(([id, label]) => ({
                data: getResourceApiUrl(field.relatedTable.name, id),
                label,
              }))
          )
        : [],
    [
      field,
      isLoaded,
      typeSearch,
      subViewRelationship,
      collectionRelationships,
      forceCollection,
      relatedCollectionId,
      resource,
      treeData,
    ]
  );

  const canAdd =
    !RESTRICT_ADDING.has(field.relatedTable.name) &&
    hasTablePermission(field.relatedTable.name, 'create');

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <div className="flex w-full items-center">
      <AutoComplete<string>
        aria-label={undefined}
        disabled={
          !isLoaded ||
          isReadOnly ||
          formType === 'formTable' ||
          typeSearch === undefined ||
          /**
           * Don't disable the input if it is currently focused
           * Fixes https://github.com/specify/specify7/issues/2142
           */
          (formatted === undefined &&
            document.activeElement !== inputRef.current)
        }
        filterItems={false}
        forwardRef={validationRef}
        inputProps={{
          id,
          required: isRequired,
          title: typeof typeSearch === 'object' ? typeSearch.title : undefined,
          ...getValidationAttributes(parser),
          type: 'text',
        }}
        pendingValueRef={pendingValueRef}
        source={fetchSource}
        value={
          formatted?.label ??
          formattedRef.current?.formatted ??
          commonText.loading()
        }
        onChange={({ data, label }): void => {
          formattedRef.current = {
            value: data,
            formatted: label.toString() as LocalizedString,
          };
          updateValue(data);
        }}
        onCleared={(): void => updateValue('', false)}
        onNewValue={
          formType !== 'formTable' && canAdd
            ? (): void =>
                state.type === 'AddResourceState'
                  ? setState({ type: 'MainState' })
                  : setState({
                      type: 'AddResourceState',
                      resource: pendingValueToResource(field),
                    })
            : undefined
        }
      />
      <span className="contents print:hidden">
        {formType === 'formTable' ? undefined : isReadOnly ? (
          formatted?.resource === undefined ||
          hasTablePermission(formatted.resource.specifyTable.name, 'read') ? (
            <DataEntry.View
              aria-pressed={state.type === 'ViewResourceState'}
              className="ml-1"
              disabled={
                formatted?.resource === undefined ||
                collectionRelationships === undefined
              }
              onClick={handleOpenRelated}
            />
          ) : undefined
        ) : (
          <>
            <DataEntry.Edit
              aria-pressed={state.type === 'ViewResourceState'}
              disabled={
                formatted?.resource === undefined ||
                collectionRelationships === undefined
              }
              onClick={handleOpenRelated}
            />
            {canAdd ? (
              <DataEntry.Add
                aria-pressed={state.type === 'AddResourceState'}
                onClick={(): void =>
                  state.type === 'AddResourceState'
                    ? setState({ type: 'MainState' })
                    : setState({
                        type: 'AddResourceState',
                        resource: pendingValueToResource(field),
                      })
                }
              />
            ) : undefined}
            {hasCloneButton && (
              <DataEntry.Clone
                disabled={formatted?.resource === undefined}
                onClick={(): void =>
                  state.type === 'AddResourceState'
                    ? setState({ type: 'MainState' })
                    : loading(
                        formatted!.resource!.clone(true).then((resource) =>
                          setState({
                            type: 'AddResourceState',
                            resource,
                          })
                        )
                      )
                }
              />
            )}
            <DataEntry.Search
              aria-pressed={state.type === 'SearchState'}
              onClick={
                isLoaded &&
                typeof typeSearch === 'object' &&
                typeof resource === 'object'
                  ? (): void =>
                      setState({
                        type: 'SearchState',
                        templateResource: new typeSearch.table.Resource(
                          {},
                          {
                            noBusinessRules: true,
                          }
                        ),
                        extraConditions: filterArray(
                          getQueryComboBoxConditions({
                            resource,
                            fieldName: field.name,
                            collectionRelationships:
                              typeof collectionRelationships === 'object'
                                ? collectionRelationships
                                : undefined,
                            treeData:
                              typeof treeData === 'object'
                                ? treeData
                                : undefined,
                            typeSearch,
                            subViewRelationship,
                          })
                            .map(serializeResource)
                            .map(({ fieldName, startValue }) =>
                              fieldName === 'rankId'
                                ? {
                                    field: 'rankId',
                                    isNot: false,
                                    operation: 'less',
                                    value: startValue,
                                  }
                                : fieldName === 'nodeNumber'
                                ? {
                                    field: 'nodeNumber',
                                    operation: 'between',
                                    isNot: true,
                                    value: startValue,
                                  }
                                : fieldName === 'collectionRelTypeId'
                                ? {
                                    field: 'id',
                                    operation: 'in',
                                    isNot: false,
                                    value: startValue,
                                  }
                                : f.error(`extended filter not created`, {
                                    fieldName,
                                    startValue,
                                  })
                            )
                        ),
                      })
                  : undefined
              }
            />
          </>
        )}
      </span>
      {state.type === 'AccessDeniedState' && (
        <Dialog
          buttons={commonText.close()}
          header={userText.collectionAccessDenied()}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {userText.collectionAccessDeniedDescription({
            collectionName: state.collectionName,
          })}
        </Dialog>
      )}
      {typeof formatted?.resource === 'object' &&
      state.type === 'ViewResourceState' ? (
        <ResourceView
          dialog="nonModal"
          isDependent={field.isDependent()}
          isSubForm={false}
          resource={formatted.resource}
          onAdd={undefined}
          onClose={(): void => setState({ type: 'MainState' })}
          onDeleted={(): void => {
            resource?.set(field.name, null as never);
            setState({ type: 'MainState' });
          }}
          onSaved={undefined}
          onSaving={
            field.isDependent()
              ? f.never
              : (): void => setState({ type: 'MainState' })
          }
        />
      ) : state.type === 'AddResourceState' ? (
        <ResourceView
          dialog="nonModal"
          isDependent={false}
          isSubForm={false}
          resource={state.resource}
          onAdd={undefined}
          onClose={(): void => setState({ type: 'MainState' })}
          onDeleted={undefined}
          onSaved={(): void => {
            resource?.set(field.name, state.resource as never);
            setState({ type: 'MainState' });
          }}
          onSaving={
            field.isDependent()
              ? (): false => {
                  resource?.set(field.name, state.resource as never);
                  setState({ type: 'MainState' });
                  return false;
                }
              : undefined
          }
        />
      ) : undefined}
      {state.type === 'SearchState' ? (
        <SearchDialog
          extraFilters={state.extraConditions}
          forceCollection={forceCollection ?? relatedCollectionId}
          multiple={false}
          templateResource={state.templateResource}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={([selectedResource]): void =>
            // @ts-expect-error Need to refactor this to use generics
            void resource.set(field.name, selectedResource)
          }
        />
      ) : undefined}
    </div>
  );
}
