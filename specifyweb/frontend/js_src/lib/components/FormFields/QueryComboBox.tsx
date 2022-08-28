import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../../utils/ajax';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helpers';
import { serializeResource } from '../DataModel/helpers';
import { format, getMainTableFields } from '../Forms/dataObjFormatters';
import { f } from '../../utils/functools';
import { getParsedAttribute, keysToLowerCase } from '../../utils/utils';
import { load } from '../InitialContext';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { FormMode, FormType } from '../FormParse';
import { columnToFieldMapper } from './parseselect';
import { hasTablePermission, hasTreeAccess } from '../Permissions/helpers';
import type {
  CollectionRelationships,
  QueryComboBoxTreeData,
  TypeSearch,
} from './queryComboBoxUtils';
import {
  getQueryComboBoxConditions,
  getRelatedCollectionId,
  makeComboBoxQuery,
} from './queryComboBoxUtils';
import { formatUrl } from '../Router/queryString';
import {
  fetchResource,
  getResourceApiUrl,
  idFromUrl,
  resourceOn,
} from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { toTable, toTreeTable } from '../DataModel/specifyModel';
import {
  getTreeDefinitionItems,
  isTreeModel,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { getValidationAttributes } from '../../utils/uiParse';
import { userInformation } from '../InitialContext/userInformation';
import type { AutoCompleteItem } from '../Molecules/AutoComplete';
import { AutoComplete } from '../Molecules/AutoComplete';
import { LoadingContext } from '../Core/Contexts';
import { formatList } from '../Atoms/Internationalization';
import { Dialog } from '../Molecules/Dialog';
import { ResourceView, RESTRICT_ADDING } from '../Forms/ResourceView';
import type { QueryComboBoxFilter } from '../Forms/SearchDialog';
import { SearchDialog } from '../Forms/SearchDialog';
import { SubViewContext } from '../Forms/SubView';
import { useResourceValue } from '../../hooks/useResourceValue';
import { DataEntry } from '../Atoms/DataEntry';
import {useAsyncState} from '../../hooks/useAsyncState';

const typeSearches = load<Element>(
  formatUrl('/context/app.resource', { name: 'TypeSearches' }),
  'application/xml'
);

export function QueryComboBox({
  id,
  resource,
  fieldName: initialFieldName,
  mode,
  formType,
  isRequired,
  hasCloneButton = false,
  typeSearch: initialTypeSearch,
  forceCollection,
  relatedModel: initialRelatedModel,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string | undefined;
  readonly mode: FormMode;
  readonly formType: FormType;
  readonly isRequired: boolean;
  readonly hasCloneButton?: boolean;
  readonly typeSearch: Element | string | undefined;
  readonly forceCollection: number | undefined;
  readonly relatedModel: SpecifyModel | undefined;
}): JSX.Element {
  const field = resource.specifyModel.getField(initialFieldName ?? '');

  React.useEffect(() => {
    if (!resource.isNew()) return;
    if (field?.name === 'cataloger')
      toTable(resource, 'CollectionObject')?.set(
        'cataloger',
        userInformation.agent.resource_uri,
        { silent: true }
      );
    if (field?.name === 'receivedBy')
      toTable(resource, 'LoanReturnPreparation')?.set(
        'receivedBy',
        userInformation.agent.resource_uri,
        { silent: true }
      );
  }, [resource, field]);

  const [treeData] = useAsyncState<QueryComboBoxTreeData | false>(
    React.useCallback(() => {
      const treeResource = toTreeTable(resource);
      if (
        treeResource === undefined ||
        !hasTreeAccess(treeResource.specifyModel.name, 'read')
      )
        return false;
      if (field?.name === 'parent') {
        return f.all({
          lowestChildRank: treeResource.isNew()
            ? Promise.resolve(undefined)
            : fetchCollection(
                treeResource.specifyModel.name,
                {
                  limit: 1,
                  orderBy: 'rankId',
                },
                {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  parent_id: treeResource.id,
                }
              ).then(({ records }) => records[0]?.rankId),
          treeRanks: treeRanksPromise.then(() =>
            defined(
              getTreeDefinitionItems(treeResource.specifyModel.name, false)
            ).map((rank) => ({
              rankId: rank.rankId,
              isEnforced: rank.isEnforced ?? false,
            }))
          ),
        });
      } else if (field?.name === 'acceptedParent') {
        // Don't need to do anything. Form system prevents lookups/edits
      } else if (
        field?.name === 'hybridParent1' ||
        field?.name === 'hybridParent2'
      ) {
        /*
         * No idea what restrictions there should be, the only obviously
         * required one — that a taxon is not a hybrid of itself, seems to
         * already be enforced
         */
      }
      return false;
    }, [resource, field]),
    false
  );

  const [collectionRelationships] = useAsyncState<
    CollectionRelationships | false
  >(
    React.useCallback(
      () =>
        hasTablePermission('CollectionRelType', 'read')
          ? f.maybe(toTable(resource, 'CollectionRelationship'), async () =>
              f.all({
                left: fetchCollection(
                  'CollectionRelType',
                  { limit: DEFAULT_FETCH_LIMIT },
                  {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    leftsidecollection_id: schema.domainLevelIds.collection,
                  }
                ).then(({ records }) =>
                  records.map((relationship) => ({
                    id: relationship.id,
                    collection: idFromUrl(
                      relationship.rightSideCollection ?? ''
                    ),
                  }))
                ),
                right: fetchCollection(
                  'CollectionRelType',
                  { limit: DEFAULT_FETCH_LIMIT },
                  {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    rightsidecollection_id: schema.domainLevelIds.collection,
                  }
                ).then(({ records }) =>
                  records.map((relationship) => ({
                    id: relationship.id,
                    collection: idFromUrl(
                      relationship.leftSideCollection ?? ''
                    ),
                  }))
                ),
              })
            ) ?? false
          : false,
      [resource]
    ),
    false
  );

  const [typeSearch] = useAsyncState<TypeSearch | false>(
    React.useCallback(async () => {
      const relatedModel =
        initialRelatedModel ??
        (field?.isRelationship === true ? field.relatedModel : undefined);
      if (relatedModel === undefined) return false;

      const typeSearch =
        typeof initialTypeSearch === 'object'
          ? initialTypeSearch
          : (await typeSearches).querySelector(
              typeof initialTypeSearch === 'string'
                ? `[name="${initialTypeSearch}"]`
                : `[tableid="${relatedModel.tableId}"]`
            );
      if (typeSearch === undefined) return false;

      const rawSearchFieldsNames =
        typeSearch === null
          ? []
          : getParsedAttribute(typeSearch, 'searchField')
              ?.split(',')
              .map(f.trim)
              .map(
                typeof typeSearch?.textContent === 'string' &&
                  typeSearch.textContent.trim().length > 0
                  ? columnToFieldMapper(typeSearch.textContent)
                  : f.id
              ) ?? [];
      const searchFields = rawSearchFieldsNames.map((searchField) =>
        defined(relatedModel.getField(searchField))
      );

      const fieldTitles = searchFields.map((field) =>
        filterArray([
          field.model === relatedModel ? undefined : field.model.label,
          field.label,
        ]).join(' / ')
      );

      return {
        title: queryText('queryBoxDescription', formatList(fieldTitles)),
        searchFields,
        relatedModel,
        dataObjectFormatter:
          typeSearch?.getAttribute('dataObjFormatter') ?? undefined,
      };
    }, [initialTypeSearch, field, initialRelatedModel]),
    false
  );

  const isLoaded =
    treeData !== undefined &&
    collectionRelationships !== undefined &&
    typeSearch !== undefined;
  const { value, updateValue, validationRef, parser } = useResourceValue(
    resource,
    field?.name,
    undefined
  );

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
      resourceOn(resource, 'saved', () => setVersion((version) => version + 1)),
    [resource]
  );

  /*
   * Stores the formatted resource returned by the query from the back-end
   * If back-end query hasn't been executed yet (i.e, because the form has
   * just been opened), the resource would be fetched and formatted separately
   */
  const formattedRef = React.useRef<
    { readonly value: string; readonly formatted: string } | undefined
  >(undefined);
  const [formatted] = useAsyncState<{
    readonly label: string;
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }>(
    React.useCallback(
      async () =>
        field?.isRelationship !== true ||
        hasTablePermission(field.relatedModel.name, 'read') ||
        /*
         * If related resource is already provided, can display it
         * Even if don't have read permission (i.e, Agent for current
         * User)
         */
        typeof resource.getDependentResource(field.name) === 'object'
          ? resource
              .rgetPromise<string, AnySchema>(field?.name ?? '')
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
                            ? typeSearch.dataObjectFormatter
                            : undefined
                        )
                    ).then((formatted) => ({
                      label:
                        formatted ??
                        `${
                          field?.isRelationship === true
                            ? field.relatedModel.label
                            : resource.specifyModel.label
                        }${
                          typeof resource.id === 'number'
                            ? ` #${resource.id}`
                            : ''
                        }`,
                      resource,
                    }))
              )
          : { label: commonText('noPermission'), resource: undefined },
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
    typeof collectionRelationships === 'object'
      ? getRelatedCollectionId(
          collectionRelationships,
          resource,
          field?.name ?? ''
        )
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
  const pendingValueToResource = (
    relationship: Relationship
  ): SpecifyResource<AnySchema> =>
    new relationship.relatedModel.Resource(
      /*
       * If some value is currently in the input field, try to figure out which
       * field it is intended for and populate that field in the new resource.
       * Most of the time, that field is determined based on the search field
       */
      f.maybe(
        (typeof typeSearch === 'object'
          ? typeSearch.searchFields.find(
              (searchField) =>
                !searchField.isRelationship &&
                searchField.model === relationship.relatedModel &&
                !searchField.isReadOnly
            )?.name
          : undefined) ??
          getMainTableFields(relationship.relatedModel.name)[0]?.name,
        (fieldName) => ({ [fieldName]: pendingValueRef.current })
      ) ?? {}
    );

  const fetchSource = React.useCallback(
    async (value: string): Promise<RA<AutoCompleteItem<string>>> =>
      isLoaded && typeof typeSearch === 'object'
        ? Promise.all(
            typeSearch.searchFields
              .map(({ name: fieldName }) =>
                makeComboBoxQuery({
                  fieldName,
                  value,
                  isTreeTable:
                    field?.isRelationship === true &&
                    isTreeModel(field.relatedModel.name),
                  typeSearch,
                  specialConditions: getQueryComboBoxConditions({
                    resource,
                    fieldName,
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
                  readonly results: RA<readonly [id: number, label: string]>;
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
                data: getResourceApiUrl(
                  field?.isRelationship === true
                    ? field.relatedModel.name
                    : resource.specifyModel.name,
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
      subViewRelationship,
      collectionRelationships,
      forceCollection,
      relatedCollectionId,
      resource,
      treeData,
    ]
  );

  return (
    <div className="flex w-full items-center">
      <AutoComplete<string>
        aria-label={undefined}
        filterItems={false}
        forwardRef={validationRef}
        pendingValueRef={pendingValueRef}
        source={fetchSource}
        value={formatted?.label ?? commonText('loading') ?? ''}
        onChange={({ data, label }): void => {
          formattedRef.current = { value: data, formatted: label.toString() };
          updateValue(data);
        }}
        onCleared={(): void => updateValue('', false)}
        onNewValue={(): void =>
          field?.isRelationship === true
            ? state.type === 'AddResourceState'
              ? setState({ type: 'MainState' })
              : setState({
                  type: 'AddResourceState',
                  resource: pendingValueToResource(field),
                })
            : undefined
        }
        disabled={
          !isLoaded ||
          mode === 'view' ||
          formType === 'formTable' ||
          typeof typeSearch === 'undefined' ||
          typeof formatted === 'undefined'
        }
        inputProps={{
          id,
          required: isRequired,
          title: typeof typeSearch === 'object' ? typeSearch.title : undefined,
          ...getValidationAttributes(parser),
          type: 'text',
        }}
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
            {field === undefined ||
            !field.isRelationship ||
            (!RESTRICT_ADDING.has(field.relatedModel.name) &&
              hasTablePermission(field.relatedModel.name, 'create')) ? (
              <DataEntry.Add
                aria-pressed={state.type === 'AddResourceState'}
                onClick={
                  field?.isRelationship === true
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
            ) : undefined}
            {hasCloneButton && (
              <DataEntry.Clone
                disabled={formatted?.resource === undefined}
                onClick={(): void =>
                  state.type === 'AddResourceState'
                    ? setState({ type: 'MainState' })
                    : loading(
                        defined(formatted?.resource)
                          .clone()
                          .then((resource) =>
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
                isLoaded && typeof typeSearch === 'object'
                  ? (): void =>
                      setState({
                        type: 'SearchState',
                        templateResource: new typeSearch.relatedModel.Resource(
                          {},
                          {
                            noBusinessRules: true,
                            noValidation: true,
                          }
                        ),
                        extraConditions: filterArray(
                          getQueryComboBoxConditions({
                            resource,
                            fieldName: defined(field?.name),
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
                            /*
                             * Send special conditions to dialog
                             * extremely skimpy. will work only for current known cases
                             */
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
          buttons={commonText('close')}
          header={commonText('collectionAccessDeniedDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {commonText('collectionAccessDeniedDialogText', state.collectionName)}
        </Dialog>
      )}
      {typeof formatted?.resource === 'object' &&
      state.type === 'ViewResourceState' ? (
        <ResourceView
          canAddAnother={false}
          dialog="nonModal"
          isDependent={field?.isDependent() ?? false}
          isSubForm={false}
          mode={mode}
          resource={formatted.resource}
          onClose={(): void => setState({ type: 'MainState' })}
          onDeleted={(): void => {
            resource.set(defined(field?.name), null as never);
            setState({ type: 'MainState' });
          }}
          onSaved={undefined}
          onSaving={
            field?.isDependent() === true
              ? f.never
              : (): void => setState({ type: 'MainState' })
          }
        />
      ) : state.type === 'AddResourceState' ? (
        <ResourceView
          canAddAnother={false}
          dialog="nonModal"
          isDependent={false}
          isSubForm={false}
          mode={mode}
          resource={state.resource}
          onClose={(): void => setState({ type: 'MainState' })}
          onDeleted={undefined}
          onSaved={(): void => {
            resource.set(defined(field?.name), state.resource as never);
            setState({ type: 'MainState' });
          }}
          onSaving={
            field?.isDependent()
              ? (): false => {
                  resource.set(defined(field?.name), state.resource as never);
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
            void resource.set(defined(field?.name), selectedResource)
          }
        />
      ) : undefined}
    </div>
  );
}
