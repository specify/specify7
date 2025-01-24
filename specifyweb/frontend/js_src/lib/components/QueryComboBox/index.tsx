import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useResourceValue } from '../../hooks/useResourceValue';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { backboneFieldSeparator } from '../DataModel/helpers';
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
import { tables } from '../DataModel/tables';
import type {
  CollectionObject,
  CollectionObjectType,
} from '../DataModel/types';
import { format, naiveFormatter } from '../Formatters/formatters';
import type { FormType } from '../FormParse';
import { ResourceView, RESTRICT_ADDING } from '../Forms/ResourceView';
import { SubViewContext } from '../Forms/SubView';
import { isTreeTable } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import type { AutoCompleteItem } from '../Molecules/AutoComplete';
import { AutoComplete } from '../Molecules/AutoComplete';
import { Dialog } from '../Molecules/Dialog';
import { titlePosition } from '../Molecules/Tooltips';
import { hasTablePermission } from '../Permissions/helpers';
import { runQuery } from '../QueryBuilder/ResultsWrapper';
import type { QueryComboBoxFilter } from '../SearchDialog';
import { SearchDialog } from '../SearchDialog';
import {
  getQueryComboBoxConditions,
  getRelatedCollectionId,
  makeComboBoxQuery,
  pendingValueToResource,
  useQueryComboBoxDefaults,
} from './helpers';
import type { TypeSearch } from './spec';
import { useCollectionRelationships } from './useCollectionRelationships';
import { useTreeData } from './useTreeData';
import { TreeDefinitionContext } from './useTreeData';
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
  hasNewButton = true,
  hasSearchButton = true,
  hasEditButton = true,
  hasViewButton = false,
  typeSearch: initialTypeSearch,
  forceCollection,
  searchView,
  defaultRecord,
  relatedTable: initialRelatedTable,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: Relationship;
  readonly formType: FormType;
  readonly isRequired: boolean;
  readonly hasCloneButton?: boolean;
  readonly hasNewButton?: boolean;
  readonly hasSearchButton?: boolean;
  readonly hasEditButton?: boolean;
  readonly hasViewButton?: boolean;
  readonly typeSearch: TypeSearch | string | undefined;
  readonly forceCollection: number | undefined;
  readonly searchView?: string;
  readonly defaultRecord?: string | undefined;
  readonly relatedTable?: SpecifyTable | undefined;
}): JSX.Element {
  useQueryComboBoxDefaults({ resource, field, defaultRecord });

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
  /*
   * REFACTOR: split this into two states to improve performance
   *   (so that places that just need resource don't have to wait on formatting)
   */
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
          field.isDependent())
          ? resource
              .rgetPromise<string, AnySchema>(field.name)
              .then(async (resource) =>
                resource === undefined || resource === null
                  ? {
                      label: localized(''),
                      resource: undefined,
                    }
                  : (value === formattedRef.current?.value &&
                    typeof formattedRef.current === 'object'
                      ? Promise.resolve(formattedRef.current.formatted)
                      : format(
                          resource,
                          typeof typeSearch === 'object'
                            ? typeSearch.formatter
                            : undefined,
                          true
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
        }
      >
    | State<'AccessDeniedState', { readonly collectionName: string }>
    | State<'MainState'>
    | State<'ViewResourceState', { readonly isReadOnly: boolean }>
  >({ type: 'MainState' });

  const relatedCollectionId =
    typeof collectionRelationships === 'object' && typeof resource === 'object'
      ? getRelatedCollectionId(collectionRelationships, resource, field.name)
      : undefined;

  const loading = React.useContext(LoadingContext);
  const handleOpenRelated = (isReadOnly: boolean): void =>
    state.type === 'ViewResourceState' || state.type === 'AccessDeniedState'
      ? setState({ type: 'MainState' })
      : typeof relatedCollectionId === 'number' &&
          !userInformation.availableCollections.some(
            ({ id }) => id === relatedCollectionId
          )
        ? loading(
            fetchResource('Collection', relatedCollectionId).then(
              (collection) =>
                setState({
                  type: 'AccessDeniedState',
                  collectionName: collection?.collectionName ?? '',
                })
            )
          )
        : setState({ type: 'ViewResourceState', isReadOnly });

  const subViewRelationship = React.useContext(SubViewContext)?.relationship;
  const pendingValueRef = React.useRef('');

  const relatedTable =
    (typeof typeSearch === 'object' ? typeSearch?.table : undefined) ??
    field.relatedTable;

  const [fetchedTreeDefinition] = useAsyncState(
    React.useCallback(
      async () =>
        resource?.specifyTable === tables.Determination &&
        resource.collection?.related?.specifyTable === tables.CollectionObject
          ? (resource.collection?.related as SpecifyResource<CollectionObject>)
              .rgetPromise('collectionObjectType')
              .then(
                (
                  collectionObjectType:
                    | SpecifyResource<CollectionObjectType>
                    | undefined
                ) => collectionObjectType?.get('taxonTreeDef')
              )
          : undefined,
      [resource, resource?.collection?.related?.get('collectionObjectType')]
    ),
    false
  );

  // Tree Definition passed by a parent QCBX in the component tree
  const parentTreeDefinition = React.useContext(TreeDefinitionContext);
  const treeDefinition = fetchedTreeDefinition ?? parentTreeDefinition;

  // FEATURE: use main table field if type search is not defined
  const fetchSource = React.useCallback(
    async (value: string): Promise<RA<AutoCompleteItem<string>>> =>
      isLoaded && typeof typeSearch === 'object' && typeof resource === 'object'
        ? Promise.all(
            typeSearch.searchFields
              .map((fields) =>
                makeComboBoxQuery({
                  fieldName: fields
                    .map(({ name }) => name)
                    .join(backboneFieldSeparator),
                  value,
                  isTreeTable: isTreeTable(field.relatedTable.name),
                  typeSearch,
                  specialConditions: getQueryComboBoxConditions({
                    resource,
                    fieldName: fields
                      .map(({ name }) => name)
                      .join(backboneFieldSeparator),
                    collectionRelationships:
                      typeof collectionRelationships === 'object'
                        ? collectionRelationships
                        : undefined,
                    treeData:
                      typeof treeData === 'object' ? treeData : undefined,
                    relatedTable,
                    subViewRelationship,
                    treeDefinition,
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
                runQuery<readonly [id: number, label: LocalizedString]>(query, {
                  collectionId: forceCollection ?? relatedCollectionId,
                  // REFACTOR: allow customizing these arbitrary limits
                  limit: 1000,
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
            responses.flat().map(([id, label]) => ({
              data: getResourceApiUrl(
                field.isRelationship
                  ? field.relatedTable.name
                  : resource.specifyTable.name,
                id
              ),
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
      fetchedTreeDefinition,
      parentTreeDefinition,
    ]
  );

  const canAdd =
    !RESTRICT_ADDING.has(field.relatedTable.name) &&
    hasTablePermission(field.relatedTable.name, 'create');

  const isReadOnly = React.useContext(ReadOnlyContext);

  const viewButton = (
    <DataEntry.View
      aria-pressed={state.type === 'ViewResourceState'}
      className="ml-1"
      disabled={
        formatted?.resource === undefined ||
        collectionRelationships === undefined
      }
      onClick={(): void => handleOpenRelated(true)}
    />
  );
  return (
    <div className="flex w-full min-w-[theme(spacing.40)] items-center sm:min-w-[unset]">
      <TreeDefinitionContext.Provider value={treeDefinition}>
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
            title:
              typeof typeSearch === 'object' ? typeSearch.title : undefined,
            ...getValidationAttributes(parser),
            type: 'text',
            [titlePosition]: 'top',
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
              formatted: localized(label.toString()),
            };
            updateValue(data);
          }}
          onCleared={(): void => updateValue('')}
          onNewValue={
            formType !== 'formTable' && canAdd
              ? (): void =>
                  state.type === 'AddResourceState'
                    ? setState({ type: 'MainState' })
                    : setState({
                        type: 'AddResourceState',
                        resource: pendingValueToResource(
                          field,
                          typeSearch,
                          pendingValueRef.current
                        ),
                      })
              : undefined
          }
        />
        <span className="contents print:hidden">
          {formType === 'formTable' ? undefined : isReadOnly ? (
            formatted?.resource === undefined ||
            hasTablePermission(formatted.resource.specifyTable.name, 'read') ? (
              viewButton
            ) : undefined
          ) : (
            <>
              {hasEditButton && (
                <DataEntry.Edit
                  aria-pressed={state.type === 'ViewResourceState'}
                  disabled={
                    formatted?.resource === undefined ||
                    collectionRelationships === undefined
                  }
                  onClick={(): void => handleOpenRelated(false)}
                />
              )}
              {canAdd && hasNewButton ? (
                <DataEntry.Add
                  aria-pressed={state.type === 'AddResourceState'}
                  onClick={(): void =>
                    state.type === 'AddResourceState'
                      ? setState({ type: 'MainState' })
                      : setState({
                          type: 'AddResourceState',
                          resource: pendingValueToResource(
                            field,
                            typeSearch,
                            pendingValueRef.current
                          ),
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
              {hasSearchButton && !field.isDependent() && (
                <DataEntry.Search
                  aria-pressed={state.type === 'SearchState'}
                  onClick={
                    isLoaded && typeof resource === 'object'
                      ? (): void =>
                          setState({
                            type: 'SearchState',
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
                                treeDefinition,
                              })
                                .map(serializeResource)
                                .map(({ fieldName, startValue }) =>
                                  fieldName === 'rankId'
                                    ? {
                                        field: 'rankId',
                                        isRelationship: false,
                                        isNot: false,
                                        operation: 'less',
                                        value: startValue,
                                      }
                                    : fieldName === 'nodeNumber'
                                      ? {
                                          field: 'nodeNumber',
                                          isRelationship: false,
                                          operation: 'between',
                                          isNot: true,
                                          value: startValue,
                                        }
                                      : fieldName === 'collectionRelTypeId'
                                        ? {
                                            field: 'id',
                                            isRelationship: false,
                                            operation: 'in',
                                            isNot: false,
                                            value: startValue,
                                          }
                                        : fieldName === 'taxonTreeDefId'
                                          ? {
                                              field: 'definition',
                                              queryBuilderFieldPath: [
                                                'definition',
                                                'id',
                                              ],
                                              isRelationship: true,
                                              operation: 'in',
                                              isNot: false,
                                              value: startValue,
                                            }
                                          : f.error(
                                              `extended filter not created`,
                                              {
                                                fieldName,
                                                startValue,
                                              }
                                            )
                                )
                            ),
                          })
                      : undefined
                  }
                />
              )}
              {hasViewButton && hasTablePermission(relatedTable.name, 'read')
                ? viewButton
                : undefined}
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
          <ReadOnlyContext.Provider value={state.isReadOnly}>
            <ResourceView
              dialog="nonModal"
              isDependent={field.isDependent()}
              isSubForm={false}
              resource={formatted.resource}
              onAdd={undefined}
              onClose={(): void => {
                setState({ type: 'MainState' });
              }}
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
          </ReadOnlyContext.Provider>
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
            searchView={searchView}
            table={relatedTable}
            onClose={(): void => setState({ type: 'MainState' })}
            onSelected={([selectedResource]): void =>
              // @ts-expect-error Need to refactor this to use generics
              void resource.set(field.name, selectedResource)
            }
          />
        ) : undefined}
      </TreeDefinitionContext.Provider>
    </div>
  );
}
