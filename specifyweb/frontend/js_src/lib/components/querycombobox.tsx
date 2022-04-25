import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import type { AnySchema } from '../datamodelutils';
import { keysToLowerCase, serializeResource } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import { load } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import type { FormMode, FormType } from '../parseform';
import { getAttribute } from '../helpers';
import { columnToFieldMapper } from '../parseselect';
import { hasTablePermission, hasTreeAccess } from '../permissions';
import type {
  CollectionRelationships,
  QueryComboBoxTreeData,
  TypeSearch,
} from '../querycomboboxutils';
import {
  getQueryComboBoxConditions,
  getRelatedCollectionId,
  makeComboBoxQuery,
} from '../querycomboboxutils';
import { fetchResource, getResourceApiUrl, idFromUrl } from '../resource';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { toTable, toTreeTable } from '../specifymodel';
import {
  getTreeDefinitionItems,
  isTreeResource,
  treeRanksPromise,
} from '../treedefinitions';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { getValidationAttributes } from '../uiparse';
import { userInformation } from '../userinfo';
import { Autocomplete } from './autocomplete';
import { DataEntry, Input } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useResourceValue } from './hooks';
import { formatList } from './internationalization';
import { Dialog } from './modaldialog';
import { ResourceView } from './resourceview';
import type { QueryComboBoxFilter } from './searchdialog';
import { SearchDialog } from './searchdialog';
import { SubViewContext } from './subview';

const typeSearches = load<Element>(
  '/context/app.resource?name=TypeSearches',
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
  readonly typeSearch: string | Element | undefined;
  readonly forceCollection: number | undefined;
  readonly relatedModel: SpecifyModel | undefined;
}): JSX.Element {
  const field = resource.specifyModel.getField(initialFieldName ?? '');

  React.useEffect(
    () =>
      resource.settingDefaultValues(() => {
        if (!resource.isNew()) return;
        if (field?.name === 'cataloger')
          toTable(resource, 'CollectionObject')?.set(
            'cataloger',
            userInformation.agent.resource_uri
          );
        if (field?.name === 'receivedBy')
          toTable(resource, 'LoanReturnPreparation')?.set(
            'receivedBy',
            userInformation.agent.resource_uri
          );
      }),
    [resource, field]
  );

  const [treeData] = useAsyncState<QueryComboBoxTreeData | false>(
    React.useCallback(() => {
      const treeResource = toTreeTable(resource);
      if (
        typeof treeResource === 'undefined' ||
        !hasTreeAccess(treeResource.specifyModel.name, 'read')
      )
        return false;
      if (field?.name == 'parent') {
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
      } else if (field?.name == 'acceptedParent') {
        // Don't need to do anything. Form system prevents lookups/edits
      } else if (
        field?.name == 'hybridParent1' ||
        field?.name == 'hybridParent2'
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
    React.useCallback(
      () =>
        typeof initialTypeSearch === 'string' ||
        typeof initialTypeSearch === 'object'
          ? typeSearches.then((element) => {
              const typeSearch =
                typeof initialTypeSearch === 'object'
                  ? initialTypeSearch
                  : element.querySelector(`[name="${initialTypeSearch}"]`);

              const relatedModel =
                initialRelatedModel ??
                (field?.isRelationship === true
                  ? field.relatedModel
                  : undefined);

              if (typeof relatedModel === 'undefined') return false;

              const searchFieldsNames =
                typeSearch === null
                  ? []
                  : getAttribute(typeSearch, 'searchField')
                      ?.split(',')
                      .map(f.trim)
                      .map(
                        typeof typeSearch?.textContent === 'string' &&
                          typeSearch.textContent.trim().length > 0
                          ? columnToFieldMapper(typeSearch.textContent)
                          : f.id
                      ) ?? [];
              const searchFields = searchFieldsNames.map((searchField) =>
                defined(relatedModel.getField(searchField))
              );

              const fieldTitles = searchFields.map((field) =>
                filterArray([
                  field.model === relatedModel ? undefined : field.model.label,
                  field.label,
                ]).join(' / ')
              );

              return {
                title: queryText('queryBoxDescription')(
                  formatList(fieldTitles)
                ),
                searchFields,
                searchFieldsNames,
                relatedModel,
                dataObjectFormatter:
                  typeSearch?.getAttribute('dataObjFormatter') ?? undefined,
              };
            })
          : false,
      [initialTypeSearch, field, initialRelatedModel]
    ),
    false
  );

  const isLoaded =
    typeof treeData !== 'undefined' &&
    typeof collectionRelationships !== 'undefined' &&
    typeof typeSearch !== 'undefined';
  const { value, updateValue, validationRef, parser } = useResourceValue(
    resource,
    field?.name,
    undefined
  );
  // TODO: fetch this from the back-end
  const [formatted] = useAsyncState<{
    readonly label: string;
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }>(
    React.useCallback(
      async () =>
        resource
          .rgetPromise<string, AnySchema>(field?.name ?? '')
          .then((resource) =>
            typeof resource === 'undefined' || resource === null
              ? {
                  label: '',
                  resource: undefined,
                }
              : format(
                  resource,
                  typeof typeSearch === 'object'
                    ? typeSearch.dataObjectFormatter
                    : undefined
                ).then((formatted) => ({
                  label:
                    formatted ?? value?.toString() ?? resource.id.toString(),
                  resource,
                }))
          ),
      [value, resource, field, typeSearch]
    ),
    false
  );

  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'AccessDeniedState', { readonly collectionName: string }>
    | State<'ViewResourceState'>
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

  const subViewRelationship = React.useContext(SubViewContext);

  return (
    <div className="flex items-center">
      <Autocomplete<string>
        filterItems={false}
        source={React.useCallback(
          async (value) =>
            isLoaded && typeof typeSearch === 'object'
              ? Promise.all(
                  typeSearch.searchFieldsNames
                    .map((fieldName) =>
                      makeComboBoxQuery({
                        fieldName,
                        value,
                        isTreeTable: isTreeResource(resource),
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
                        readonly results: RA<
                          Readonly<[id: number, label: string]>
                        >;
                      }>('/stored_query/ephemeral/', {
                        method: 'POST',
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        headers: { Accept: 'application/json' },
                        body: keysToLowerCase({
                          ...query,
                          collectionId: forceCollection ?? relatedCollectionId,
                          // TODO: allow customizing these arbitrary limits
                          limit: 1000,
                        }),
                      })
                    )
                ).then((responses) =>
                  /*
                   * If there are multiple search fields and both returns the
                   * same record, it may be presented in results twice. Would
                   * be fixed by using OR queries
                   * TODO: refactor to use OR queries accross fields once
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
        )}
        onChange={({ data }): void => updateValue(data)}
        onCleared={(): void => updateValue('')}
        onNewValue={(value: string): void =>
          field?.isRelationship === true
            ? state.type === 'AddResourceState'
              ? setState({ type: 'MainState' })
              : setState({
                  type: 'AddResourceState',
                  resource: new field.relatedModel.Resource(
                    f.maybe(
                      typeof typeSearch === 'object'
                        ? typeSearch.searchFields.find(
                            (searchField) =>
                              !searchField.isRelationship &&
                              searchField.model === field.relatedModel
                          )?.name
                        : undefined,
                      (fieldName) => ({ [fieldName]: value })
                    ) ?? {}
                  ),
                })
            : undefined
        }
        value={formatted?.label ?? commonText('loading') ?? ''}
        forwardRef={validationRef}
        aria-label={undefined}
      >
        {(props): JSX.Element => (
          <Input.Generic
            className="flex-1"
            id={id}
            required={isRequired}
            isReadOnly={
              !isLoaded ||
              mode === 'view' ||
              formType === 'formTable' ||
              typeof typeSearch === 'undefined' ||
              typeof formatted === 'undefined'
            }
            {...getValidationAttributes(parser)}
            {...props}
          />
        )}
      </Autocomplete>
      <span className="print:hidden contents">
        {mode === 'view' ? (
          formType === 'formTable' ? undefined : (
            <DataEntry.View
              aria-pressed={state.type === 'ViewResourceState'}
              disabled={
                typeof formatted?.resource === 'undefined' ||
                typeof collectionRelationships === 'undefined'
              }
              onClick={handleOpenRelated}
            />
          )
        ) : (
          <>
            <DataEntry.Edit
              aria-pressed={state.type === 'ViewResourceState'}
              disabled={
                typeof formatted?.resource === 'undefined' ||
                typeof collectionRelationships === 'undefined'
              }
              onClick={handleOpenRelated}
            />
            <DataEntry.Add
              aria-pressed={state.type === 'AddResourceState'}
              disabled={field?.isRelationship !== true}
              onClick={(): void =>
                field?.isRelationship === true
                  ? state.type === 'AddResourceState'
                    ? setState({ type: 'MainState' })
                    : setState({
                        type: 'AddResourceState',
                        resource: new field.relatedModel.Resource(),
                      })
                  : undefined
              }
            />
            {hasCloneButton && (
              <DataEntry.Clone
                disabled={typeof formatted?.resource === 'undefined'}
                onClick={(): void =>
                  state.type === 'AddResourceState'
                    ? setState({ type: 'MainState' })
                    : setState({
                        type: 'AddResourceState',
                        resource: defined(formatted?.resource).clone(),
                      })
                }
              />
            )}
            <DataEntry.Search
              aria-pressed={state.type === 'SearchState'}
              disabled={!isLoaded || typeof typeSearch !== 'object'}
              onClick={(): void =>
                isLoaded && typeof typeSearch === 'object'
                  ? setState({
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
                            typeof treeData === 'object' ? treeData : undefined,
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
                                  operation: 'between',
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
          title={commonText('collectionAccessDeniedDialogTitle')}
          header={commonText('collectionAccessDeniedDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
          buttons={commonText('close')}
        >
          {commonText('collectionAccessDeniedDialogMessage')(
            state.collectionName
          )}
        </Dialog>
      )}
      {typeof formatted?.resource === 'object' &&
      state.type === 'ViewResourceState' ? (
        <ResourceView
          isSubForm={false}
          resource={formatted.resource}
          canAddAnother={false}
          dialog="nonModal"
          onSaving={
            field?.isDependent() === true
              ? f.never
              : (): void => setState({ type: 'MainState' })
          }
          onClose={(): void => setState({ type: 'MainState' })}
          onSaved={undefined}
          onDeleted={(): void => {
            resource.set(defined(field?.name), null as never);
            setState({ type: 'MainState' });
          }}
          mode={mode}
          isDependent={field?.isDependent() ?? false}
        />
      ) : state.type === 'AddResourceState' ? (
        <ResourceView
          isSubForm={false}
          resource={state.resource}
          canAddAnother={false}
          dialog="nonModal"
          onSaving={
            field?.isDependent()
              ? (): false => {
                  resource.set(defined(field?.name), state.resource as never);
                  setState({ type: 'MainState' });
                  return false;
                }
              : undefined
          }
          onClose={(): void => setState({ type: 'MainState' })}
          onSaved={(): void => {
            resource.set(defined(field?.name), state.resource as never);
            setState({ type: 'MainState' });
          }}
          isDependent={false}
          onDeleted={undefined}
          mode={mode}
        />
      ) : undefined}
      {state.type === 'SearchState' ? (
        <SearchDialog
          forceCollection={forceCollection ?? relatedCollectionId}
          extraFilters={state.extraConditions}
          templateResource={state.templateResource}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={(selectedResource): void =>
            // @ts-expect-error Need to refactor this to use generics
            void resource.set(defined(field?.name), selectedResource)
          }
        />
      ) : undefined}
    </div>
  );
}
