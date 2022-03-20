import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import { keysToLowerCase, serializeResource } from '../datamodelutils';
import { format } from '../dataobjformatters';
import { load } from '../initialcontext';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import queryText from '../localization/query';
import type { FormMode, FormType } from '../parseform';
import { columnToFieldMapper } from '../parseselect';
import type {
  CollectionRelationships,
  QueryComboBoxTreeData,
  TypeSearch,
} from '../querycomboboxutils';
import {
  getQueryComboBoxConditions,
  getRelatedCollectionId,
  makeQueryComboBoxQuery,
} from '../querycomboboxutils';
import { fetchResource, idFromUrl } from '../resource';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { toTable, toTreeTable } from '../specifymodel';
import { getTreeDefinitionItems } from '../treedefinitions';
import type { IR, RA } from '../types';
import { defined, filterArray } from '../types';
import { getValidationAttributes } from '../uiparse';
import { userInformation } from '../userinfo';
import { f } from '../wbplanviewhelper';
import { Autocomplete } from './autocomplete';
import { Button, Input } from './basic';
import { useAsyncState, useResourceValue } from './hooks';
import { formatList } from './internationalization';
import { Dialog } from './modaldialog';
import type { QueryComboBoxFilter } from './querycbxsearch';
import { QueryComboBoxSearch } from './querycbxsearch';
import { ResourceView } from './resourceview';
import { SubViewContext } from './subview';
import { getAttribute } from '../parseformcells';

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

  React.useEffect(() => {
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
  }, [resource, field]);

  const [treeData] = useAsyncState<QueryComboBoxTreeData | false>(
    React.useCallback(() => {
      const treeResource = toTreeTable(resource);
      if (typeof treeResource === 'undefined') return false;
      if (field?.name == 'parent') {
        let lowestChildRank: Promise<number | undefined>;
        if (treeResource.isNew()) lowestChildRank = Promise.resolve(undefined);
        else {
          const children = new treeResource.specifyModel.LazyCollection({
            filters: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              parent_id: treeResource.id,
              orderby: 'rankId',
            },
          });
          lowestChildRank = children
            .fetchPromise({ limit: 1 })
            .then(({ models }) => models[0]?.get('rankId'));
        }
        const treeRanks = defined(
          getTreeDefinitionItems(treeResource.specifyModel.name, false)
        ).map((rank) => ({
          rankId: rank.rankId,
          isEnforced: rank.isEnforced ?? false,
        }));
        return lowestChildRank.then((rank) => ({
          lowestChildRank: rank,
          treeRanks,
        }));
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
    }, [resource, field])
  );

  const [collectionRelationships] = useAsyncState<
    CollectionRelationships | false
  >(
    React.useCallback(
      () =>
        f.maybe(toTable(resource, 'CollectionRelationship'), async () => {
          const left = new schema.models.CollectionRelType.LazyCollection({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            filters: {
              leftsidecollection_id: schema.domainLevelIds.collection,
            },
          });
          const right = new schema.models.CollectionRelType.LazyCollection({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            filters: {
              rightsidecollection_id: schema.domainLevelIds.collection,
            },
          });
          return Promise.all([
            left.fetchPromise().then(({ models }) =>
              models.map((relationship) => ({
                id: relationship.id,
                collection: idFromUrl(
                  relationship.get('rightSideCollection') ?? ''
                ),
              }))
            ),
            right.fetchPromise().then(({ models }) =>
              models.map((relationship) => ({
                id: relationship.id,
                collection: idFromUrl(
                  relationship.get('leftSideCollection') ?? ''
                ),
              }))
            ),
          ]).then(([left, right]) => ({ left, right }));
        }),
      [resource]
    )
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
                  : element.querySelector(`[name="${initialTypeSearch}]`);

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
                        typeof typeSearch?.textContent === 'string'
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
    )
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
  const [formatted] = useAsyncState<{
    readonly label: string;
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }>(
    React.useCallback(
      async () =>
        resource
          .rgetPromise<string, AnySchema>(field?.name ?? '', true)
          .then((resource) =>
            typeof resource === 'undefined' ?? resource === null
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
    )
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

  const handleOpenRelated = (): void =>
    state.type === 'ViewResourceState' || state.type === 'AccessDeniedState'
      ? setState({ type: 'MainState' })
      : typeof relatedCollectionId === 'number' &&
        !userInformation.available_collections
          .map(([id]) => id)
          .includes(relatedCollectionId)
      ? void fetchResource('Collection', relatedCollectionId).then(
          (collection) =>
            setState({
              type: 'AccessDeniedState',
              collectionName: collection?.collectionName ?? '',
            })
        )
      : setState({ type: 'ViewResourceState' });

  const subViewRelationship = React.useContext(SubViewContext);

  return (
    <div className="flex items-center">
      <Autocomplete<undefined>
        source={async (
          value
        ): Promise<IR<{ readonly label: string; readonly data: undefined }>> =>
          isLoaded && typeof typeSearch === 'object'
            ? Promise.all(
                typeSearch.searchFieldsNames
                  .map((fieldName) =>
                    makeQueryComboBoxQuery({
                      fieldName,
                      value,
                      treeData:
                        typeof treeData === 'object' ? treeData : undefined,
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
                        limit: 0,
                      }),
                    })
                  )
              ).then((responses) =>
                Object.fromEntries(
                  responses
                    .flatMap(({ data: { results } }) => results)
                    .map(([id, label]) => [
                      id,
                      {
                        label,
                        data: undefined,
                      },
                    ])
                )
              )
            : {}
        }
        onChange={(value, data): void =>
          typeof data === 'undefined' ? undefined : updateValue(value)
        }
      >
        {(props): JSX.Element => (
          <Input.Generic
            id={id}
            value={formatted?.label ?? value?.toString() ?? ''}
            forwardRef={validationRef}
            className="flex-1"
            required={isRequired}
            readOnly={
              mode === 'view' ||
              formType === 'formTable' ||
              typeof typeSearch === 'undefined'
            }
            {...getValidationAttributes(parser)}
            {...props}
          />
        )}
      </Autocomplete>
      <span className="print:hidden contents">
        {mode === 'view' ? (
          formType === 'formTable' ? undefined : (
            <Button.Icon
              aria-pressed={state.type === 'ViewResourceState'}
              disabled={
                typeof formatted?.resource === 'undefined' ||
                typeof collectionRelationships === 'undefined'
              }
              onClick={handleOpenRelated}
              title={commonText('view')}
              aria-label={commonText('view')}
              icon="eye"
            />
          )
        ) : (
          <>
            <Button.Icon
              aria-pressed={state.type === 'ViewResourceState'}
              title={commonText('edit')}
              disabled={
                typeof formatted?.resource === 'undefined' ||
                typeof collectionRelationships === 'undefined'
              }
              onClick={handleOpenRelated}
              aria-label={commonText('edit')}
              icon="pencil"
            />
            <Button.Icon
              aria-pressed={state.type === 'AddResourceState'}
              title={commonText('add')}
              aria-label={commonText('add')}
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
              icon="plus"
            />
            {hasCloneButton && (
              <Button.Icon
                title={formsText('clone')}
                disabled={typeof formatted?.resource === 'undefined'}
                aria-label={formsText('clone')}
                icon="clipboard"
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
            <Button.Icon
              title={commonText('search')}
              aria-label={commonText('search')}
              icon="search"
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
      {typeof formatted?.resource === 'object' ? (
        state.type === 'ViewResourceState' ? (
          <ResourceView
            isSubForm={false}
            resource={formatted.resource}
            canAddAnother={false}
            dialog="nonModal"
            onClose={(): void => setState({ type: 'MainState' })}
            onSaved={undefined}
            onDeleted={(): void => {
              resource.set(defined(field?.name), null as never);
              setState({ type: 'MainState' });
            }}
            mode={mode}
          />
        ) : state.type === 'AddResourceState' ? (
          <ResourceView
            isSubForm={false}
            resource={formatted.resource}
            canAddAnother={false}
            dialog="nonModal"
            onClose={(): void => setState({ type: 'MainState' })}
            onSaved={(): void => {
              resource.set(defined(field?.name), state.resource as never);
              setState({ type: 'MainState' });
            }}
            onDeleted={undefined}
            mode={mode}
          />
        ) : undefined
      ) : undefined}
      {state.type === 'SearchState' ? (
        <QueryComboBoxSearch
          forceCollection={forceCollection ?? relatedCollectionId}
          extraFilters={state.extraConditions}
          templateResource={state.templateResource}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={(resource): void =>
            // @ts-expect-error Need to refactor this to use generics
            void resource.set(defined(field?.name), resource)
          }
        />
      ) : undefined}
    </div>
  );
}
