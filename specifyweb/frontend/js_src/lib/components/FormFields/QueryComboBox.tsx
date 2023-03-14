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
import { LoadingContext } from '../Core/Contexts';
import { serializeResource, toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  fetchResource,
  getResourceApiUrl,
  resourceOn,
} from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { FormMode, FormType } from '../FormParse';
import {
  format,
  getMainTableFields,
  naiveFormatter,
} from '../Forms/dataObjFormatters';
import { ResourceView, RESTRICT_ADDING } from '../Forms/ResourceView';
import type { QueryComboBoxFilter } from '../Forms/SearchDialog';
import { SearchDialog } from '../Forms/SearchDialog';
import { SubViewContext } from '../Forms/SubView';
import { isTreeModel } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import type { AutoCompleteItem } from '../Molecules/AutoComplete';
import { AutoComplete } from '../Molecules/AutoComplete';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import {
  getQueryComboBoxConditions,
  getRelatedCollectionId,
  makeComboBoxQuery,
} from './queryComboBoxUtils';
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
  mode,
  formType,
  isRequired,
  hasCloneButton = false,
  typeSearch: initialTypeSearch,
  forceCollection,
  relatedModel: initialRelatedModel,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: Relationship;
  readonly mode: FormMode;
  readonly formType: FormType;
  readonly isRequired: boolean;
  readonly hasCloneButton?: boolean;
  readonly typeSearch: Element | string | undefined;
  readonly forceCollection: number | undefined;
  readonly relatedModel?: SpecifyModel | undefined;
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
    initialRelatedModel
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
        (hasTablePermission(field.relatedModel.name, 'read') ||
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
                      label: '' as LocalizedString,
                      resource: undefined,
                    }
                  : (value === formattedRef.current?.value &&
                    typeof formattedRef.current === 'object'
                      ? Promise.resolve(formattedRef.current.formatted)
                      : format(
                          resource,
                          typeof typeSearch === 'object'
                            ? typeSearch.dataObjectFormatter
                            : undefined
                        )
                    ).then((formatted) => ({
                      label:
                        formatted ??
                        naiveFormatter(field.relatedModel.label, resource.id),
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
              searchField.model === relationship.relatedModel &&
              !searchField.isReadOnly
          )?.[0].name
        : undefined) ??
      getMainTableFields(relationship.relatedModel.name)[0]?.name;
    return new relationship.relatedModel.Resource(
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

  const relatedTable =
    (typeof typeSearch === 'object' ? typeSearch?.relatedModel : undefined) ??
    field.relatedModel;

  // FEATURE: use main table field if type search is not defined
  const fetchSource = React.useCallback(
    async (value: string): Promise<RA<AutoCompleteItem<string>>> =>
      isLoaded && typeof typeSearch === 'object' && typeof resource === 'object'
        ? Promise.all(
            typeSearch.searchFields
              .map((fields) =>
                makeComboBoxQuery({
                  fieldName: fields.map(({ name }) => name).join('.'),
                  value,
                  isTreeTable: isTreeModel(field.relatedModel.name),
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
                    relatedTable,
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
                data: getResourceApiUrl(field.relatedModel.name, id),
                label,
              }))
          )
        : [],
    [
      field,
      isLoaded,
      typeSearch,
      relatedTable,
      subViewRelationship,
      collectionRelationships,
      forceCollection,
      relatedCollectionId,
      resource,
      treeData,
    ]
  );

  const canAdd =
    !RESTRICT_ADDING.has(field.relatedModel.name) &&
    hasTablePermission(field.relatedModel.name, 'create');

  return (
    <div className="flex w-full min-w-[theme(spacing.40)] items-center">
      <AutoComplete<string>
        aria-label={undefined}
        disabled={
          !isLoaded ||
          mode === 'view' ||
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
        {formType === 'formTable' ? undefined : mode === 'view' ? (
          formatted?.resource === undefined ||
          hasTablePermission(formatted.resource.specifyModel.name, 'read') ? (
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
                isLoaded && typeof resource === 'object'
                  ? (): void =>
                      setState({
                        type: 'SearchState',
                        templateResource: new relatedTable.Resource(
                          {},
                          {
                            noBusinessRules: true,
                            noValidation: true,
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
                            relatedTable,
                            subViewRelationship,
                          })
                            .map(serializeResource)
                            .map(({ fieldName, startValue }) =>
                              fieldName === 'rankId'
                                ? {
                                    field: 'rankId',
                                    operation: 'lessThan',
                                    values: [startValue],
                                  }
                                : fieldName === 'nodeNumber'
                                ? {
                                    field: 'nodeNumber',
                                    operation: 'notBetween',
                                    values: startValue.split(','),
                                  }
                                : fieldName === 'collectionRelTypeId'
                                ? {
                                    field: 'id',
                                    operation: 'in',
                                    values: startValue.split(','),
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
          mode={mode}
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
          mode={mode}
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
