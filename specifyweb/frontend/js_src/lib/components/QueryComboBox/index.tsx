import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useResourceValue } from '../../hooks/useResourceValue';
import { ajax } from '../../utils/ajax';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { backboneFieldSeparator, toTable } from '../DataModel/helpers';
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
import type { CollectionObject } from '../DataModel/types';
import type { CollectionObjectType } from '../DataModel/types';
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
  scopeNewResourceToCollection,
  useQueryComboBoxDefaults,
} from './helpers';
import type { TypeSearch } from './spec';
import { useCollectionRelationships } from './useCollectionRelationships';
import { useTreeData } from './useTreeData';
import { TreeDefinitionContext } from './useTreeData';
import { useTypeSearch } from './useTypeSearch';

/**
 * Maximum number of results to fetch for the typeahead dropdown.
 * Kept low to avoid expensive queries on large tables (200K+ rows).
 */
export const QUERY_COMBO_BOX_SEARCH_LIMIT = 50;

/**
 * Session-scoped preference for how to handle editing shared records (#597).
 * When set, the warning dialog is skipped and the remembered action is used.
 */
const SHARED_EDIT_SESSION_KEY = 'specify-shared-edit-preference';
type SharedEditPreference = 'cloneAndEdit' | 'editShared';

function getSessionSharedEditPref(): SharedEditPreference | undefined {
  const value = sessionStorage.getItem(SHARED_EDIT_SESSION_KEY);
  return value === 'cloneAndEdit' || value === 'editShared' ? value : undefined;
}

function setSessionSharedEditPref(pref: SharedEditPreference): void {
  sessionStorage.setItem(SHARED_EDIT_SESSION_KEY, pref);
}

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
  React.useEffect(() => {
    useQueryComboBoxDefaults({ resource, field, defaultRecord });
  }, [resource, field, defaultRecord]);

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
  const { value, updateValue, validationRef, inputRef, parser, setValidation } =
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
              .rgetPromise<string, AnySchema>(field.name, true, false)
              .then(async (resource) => {
                setValidation([]);
                if (resource === undefined || resource === null) {
                  return {
                    label: localized(''),
                    resource: undefined,
                  };
                } else {
                  const formatted =
                    value === formattedRef.current?.value &&
                    typeof formattedRef.current === 'object'
                      ? await Promise.resolve(formattedRef.current.formatted)
                      : await format(
                          resource,
                          typeof typeSearch === 'object'
                            ? typeSearch.formatter
                            : undefined,
                          true
                        );

                  return {
                    label:
                      formatted ??
                      naiveFormatter(field.relatedTable.label, resource.id),
                    resource,
                  };
                }
              })
              .catch((_) => {
                setValidation([formsText.invalidValue()]);
                return {
                  label: localized(''),
                  resource: undefined,
                };
              })
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
    | State<
        'SharedRecordWarningState',
        {
          readonly sharingCount: number;
          readonly sharingRecords: RA<{
            readonly parentId: number | undefined;
            readonly parentLabel: string | undefined;
            readonly parentTableName: string | undefined;
            readonly sharedId: number | undefined;
            readonly sharedTableName: string;
          }>;
        }
      >
    | State<'ViewResourceState', { readonly isReadOnly: boolean }>
  >({ type: 'MainState' });

  const relatedCollectionId =
    typeof collectionRelationships === 'object' && typeof resource === 'object'
      ? getRelatedCollectionId(collectionRelationships, resource, field.name)
      : undefined;
  const targetCollectionId = forceCollection ?? relatedCollectionId;

  const loading = React.useContext(LoadingContext);
  const subViewRelationship = React.useContext(SubViewContext)?.relationship;

  const handleOpenRelated = (isReadOnly: boolean): void => {
    if (
      state.type === 'ViewResourceState' ||
      state.type === 'AccessDeniedState' ||
      state.type === 'SharedRecordWarningState'
    ) {
      setState({ type: 'MainState' });
      return;
    }

    if (
      typeof relatedCollectionId === 'number' &&
      !userInformation.availableCollections.some(
        ({ id }) => id === relatedCollectionId
      )
    ) {
      loading(
        fetchResource('Collection', relatedCollectionId).then((collection) =>
          setState({
            type: 'AccessDeniedState',
            collectionName: collection?.collectionName ?? '',
          })
        )
      );
      return;
    }

    /*
     * For non-dependent, non-read-only edits, check if the related
     * record is shared before allowing direct edits (#597).
     * Carry Forward copies foreign keys, so editing a shared Locality
     * (for example) silently mutates every CO that references it.
     */
    if (!isReadOnly && !field.isDependent() && formatted?.resource?.id) {
      const parentTableName = resource!.specifyTable.name.toLowerCase();
      const fieldName = field.name.toLowerCase();
      const relatedId = formatted.resource.id;

      /*
       * Try to resolve back to CollectionObject for the display.
       * If the QCB is inside a subform (e.g., CE inside CO form),
       * query COs via the joined path (e.g., collectingevent__locality=X).
       * Otherwise fall back to querying the direct parent table.
       */
      const subView = subViewRelationship;
      const canResolveToCollectionObject =
        subView !== undefined && subView.table.name === 'CollectionObject';

      const queryTable = canResolveToCollectionObject
        ? 'collectionobject'
        : parentTableName;
      const queryFilter = canResolveToCollectionObject
        ? `${subView!.name.toLowerCase()}__${fieldName}`
        : fieldName;

      loading(
        (canResolveToCollectionObject
          ? /*
             * Query COs joined through the parent table
             * (e.g., collectionobject?collectingevent__locality=X)
             * and also fetch the parent ID for linking.
             */
            ajax<{
              readonly meta: { readonly total_count: number };
              readonly objects: RA<{
                readonly id: number;
                readonly catalogNumber?: string;
                readonly catalognumber?: string;
                readonly collectingEvent?: string;
                readonly collectingevent?: string;
              }>;
            }>(
              `/api/specify/${queryTable}/?${queryFilter}=${relatedId}&limit=11`,
              { headers: { Accept: 'application/json' } }
            ).then(({ data }) => {
              const parentTable = subView!.table.name;
              const sharedTable = field.relatedTable.name;
              return {
                totalCount: data.meta.total_count,
                records: data.objects.slice(0, 10).map((obj) => {
                  const barcode = obj.catalogNumber ?? obj.catalognumber ?? '';
                  const objRecord = obj as Record<string, unknown>;
                  const relRaw: unknown =
                    objRecord[subView!.name.toLowerCase()] ??
                    objRecord[subView!.name];
                  let relId: number | undefined;
                  if (
                    typeof relRaw === 'object' &&
                    relRaw !== null &&
                    'id' in relRaw
                  ) {
                    relId = (relRaw as { id: number }).id;
                  } else if (
                    typeof relRaw === 'string' &&
                    relRaw.includes('/')
                  ) {
                    relId = Number.parseInt(
                      relRaw.split('/').filter(Boolean).pop()!,
                      10
                    );
                  } else if (typeof relRaw === 'number') {
                    relId = relRaw;
                  }
                  return {
                    parentId: obj.id,
                    parentLabel: barcode || `${parentTable} #${obj.id}`,
                    parentTableName: parentTable,
                    sharedId: Number.isNaN(relId) ? undefined : relId,
                    sharedTableName: sharedTable,
                  };
                }),
              };
            })
          : /* Fall back to querying the direct parent table */
            ajax<{
              readonly meta: { readonly total_count: number };
              readonly objects: RA<{ readonly id: number }>;
            }>(
              `/api/specify/${queryTable}/?${queryFilter}=${relatedId}&limit=11`,
              { headers: { Accept: 'application/json' } }
            ).then(({ data }) => ({
              totalCount: data.meta.total_count,
              records: data.objects.slice(0, 10).map((obj) => ({
                parentId: undefined as number | undefined,
                parentLabel: undefined as string | undefined,
                parentTableName: undefined as string | undefined,
                sharedId: obj.id,
                sharedTableName: resource!.specifyTable.name,
              })),
            }))
        ).then(({ totalCount, records }) => {
          if (totalCount <= 1) {
            setState({ type: 'ViewResourceState', isReadOnly: false });
            return;
          }

          // Check session preference — skip dialog if user already chose
          const sessionPref = getSessionSharedEditPref();
          if (sessionPref === 'editShared') {
            setState({ type: 'ViewResourceState', isReadOnly: false });
          } else if (sessionPref === 'cloneAndEdit') {
            doCloneAndEdit();
          } else {
            setState({
              type: 'SharedRecordWarningState',
              sharingCount: totalCount,
              sharingRecords: records,
            });
          }
        })
      );
      return;
    }

    setState({ type: 'ViewResourceState', isReadOnly });
  };

  const doCloneAndEdit = (): void => {
    const relatedResource = formatted?.resource;
    if (relatedResource === undefined) return;
    loading(
      relatedResource.clone(true).then((clonedResource) => {
        resource?.set(field.name, clonedResource as never);
        setState({
          type: 'AddResourceState',
          resource: clonedResource,
        });
      })
    );
  };

  const [rememberChoice, setRememberChoice] = React.useState(false);

  const pendingValueRef = React.useRef('');

  const relatedTable =
    (typeof typeSearch === 'object' ? typeSearch?.table : undefined) ??
    field.relatedTable;

  const createPendingResource = React.useCallback(
    async () =>
      scopeNewResourceToCollection(
        pendingValueToResource(field, typeSearch, pendingValueRef.current),
        targetCollectionId
      ),
    [field, typeSearch, targetCollectionId]
  );

  // Used to fetch again tree def if the component type changes
  const componentType =
    resource?.specifyTable === tables.Component ? resource?.get('type') : null;

  const [fetchedTreeDefinition] = useAsyncState(
    React.useCallback(async () => {
      if (resource?.specifyTable === tables.Determination) {
        return resource.collection?.related?.specifyTable ===
          tables.CollectionObject
          ? (resource.collection?.related as SpecifyResource<CollectionObject>)
              .rgetPromise('collectionObjectType')
              .then(
                (
                  collectionObjectType:
                    | SpecifyResource<CollectionObjectType>
                    | undefined
                ) => collectionObjectType?.get('taxonTreeDef')
              )
          : undefined;
      } else if (resource?.specifyTable === tables.Component) {
        const typeResource = await toTable(resource, 'Component')?.rgetPromise(
          'type'
        );
        if (typeResource === undefined || typeResource === null) {
          console.warn('Could not scope Component -> name without type', {
            component: resource,
          });
          return undefined;
        }
        return typeResource.get('taxonTreeDef');
      } else if (resource?.specifyTable === tables.Taxon) {
        const definition = resource.get('definition');
        const parentDefinition = (
          resource?.independentResources?.parent as SpecifyResource<AnySchema>
        )?.get?.('definition');
        return definition || parentDefinition;
      }
      return undefined;
    }, [
      resource,
      resource?.collection?.related?.get('collectionObjectType'),
      componentType,
    ]),
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
                  limit: QUERY_COMBO_BOX_SEARCH_LIMIT,
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
    hasTablePermission(field.relatedTable.name, 'create', targetCollectionId);

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
            'aria-label': field.label,
            id,
            required: isRequired,
            title:
              (typeof typeSearch === 'object' ? typeSearch.title : undefined) ??
              field.label,
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
                    : loading(
                        createPendingResource().then((pendingResource) =>
                          setState({
                            type: 'AddResourceState',
                            resource: pendingResource,
                          })
                        )
                      )
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
                      : loading(
                          createPendingResource().then((pendingResource) =>
                            setState({
                              type: 'AddResourceState',
                              resource: pendingResource,
                            })
                          )
                        )
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
                                        : fieldName === 'taxonTreeDefId' ||
                                            fieldName === 'definitionId'
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
        {state.type === 'SharedRecordWarningState' && (
          <Dialog
            buttons={
              <>
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
                <Button.Info
                  onClick={(): void => {
                    if (rememberChoice) setSessionSharedEditPref('editShared');
                    setState({ type: 'ViewResourceState', isReadOnly: false });
                  }}
                >
                  {formsText.editShared()}
                </Button.Info>
                <Button.Fancy
                  onClick={(): void => {
                    if (rememberChoice)
                      setSessionSharedEditPref('cloneAndEdit');
                    doCloneAndEdit();
                  }}
                >
                  {formsText.cloneAndEdit()}
                </Button.Fancy>
              </>
            }
            header={formsText.sharedRecordWarning()}
            onClose={(): void => setState({ type: 'MainState' })}
          >
            <p>
              {formsText.sharedRecordWarningDescription({
                tableName: field.relatedTable.label,
                count: state.sharingCount.toString(),
                parentTableName: resource!.specifyTable.label,
              })}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {formsText.linksForInspectionOnly()}
            </p>
            {state.sharingRecords.length > 0 && (
              <table className="mt-2 text-sm w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    {state.sharingRecords.some(
                      (r) => r.parentId !== undefined
                    ) && (
                      <th className="pr-4 font-normal">
                        {state.sharingRecords.find((r) => r.parentTableName)
                          ?.parentTableName ?? resource!.specifyTable.label}
                      </th>
                    )}
                    <th className="font-normal">{field.relatedTable.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {state.sharingRecords.map((record, index) => (
                    <tr key={record.parentId ?? record.sharedId ?? index}>
                      {state.sharingRecords.some(
                        (r) => r.parentId !== undefined
                      ) && (
                        <td className="pr-4 py-0.5">
                          {record.parentId !== undefined &&
                          record.parentTableName !== undefined ? (
                            <a
                              className="text-blue-600 underline hover:text-blue-800"
                              href={`/specify/view/${record.parentTableName.toLowerCase()}/${record.parentId}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {record.parentLabel}
                            </a>
                          ) : (
                            '\u2014'
                          )}
                        </td>
                      )}
                      <td className="py-0.5">
                        {record.sharedId !== undefined ? (
                          <a
                            className="text-blue-600 underline hover:text-blue-800"
                            href={`/specify/view/${record.sharedTableName.toLowerCase()}/${record.sharedId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {`${record.sharedTableName} #${record.sharedId}`}
                          </a>
                        ) : (
                          '\u2014'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {state.sharingCount > 10 && (
              <p className="mt-1 text-xs text-gray-500">
                {formsText.andNMore({
                  count: (state.sharingCount - 10).toString(),
                })}
              </p>
            )}
            <label className="mt-3 flex items-center gap-2 text-sm cursor-pointer">
              <input
                checked={rememberChoice}
                type="checkbox"
                onChange={(event): void =>
                  setRememberChoice(event.target.checked)
                }
              />
              {formsText.rememberChoiceForSession()}
            </label>
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
            forceCollection={targetCollectionId}
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
