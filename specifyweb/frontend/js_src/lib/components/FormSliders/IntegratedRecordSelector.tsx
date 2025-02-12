import React from 'react';
import type { State } from 'typesafe-reducer';

import { useSearchParameter } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { ReadOnlyContext } from '../Core/Contexts';
import type { CollectionFetchFilters } from '../DataModel/collection';
import { DependentCollection } from '../DataModel/collectionApi';
import type {
  AnyInteractionPreparation,
  AnySchema,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { useAllSaveBlockers } from '../DataModel/saveBlockers';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import type { CollectionObjectGroup } from '../DataModel/types';
import { COJODialog } from '../FormCells/COJODialog';
import { FormTableCollection } from '../FormCells/FormTableCollection';
import type { FormType } from '../FormParse';
import type { SubViewSortField } from '../FormParse/cells';
import { augmentMode, ResourceView } from '../Forms/ResourceView';
import { useFirstFocus } from '../Forms/SpecifyForm';
import { SubViewContext } from '../Forms/SubView';
import type { InteractionWithPreps } from '../Interactions/helpers';
import { interactionPrepTables } from '../Interactions/helpers';
import { InteractionDialog } from '../Interactions/InteractionDialog';
import { hasTablePermission } from '../Permissions/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { AttachmentsCollection } from './AttachmentsCollection';
import { shouldBeToOne } from './helpers';
import { RecordSelectorFromCollection } from './RecordSelectorFromCollection';

/** A wrapper for RecordSelector to integrate with Backbone.Collection */

export function IntegratedRecordSelector({
  urlParameter,
  viewName,
  collection,
  dialog,
  formType,
  sortField,
  relationship,
  onClose: handleClose,
  onAdd: handleAdd,
  onDelete: handleDelete,
  onFetch: handleFetch,
  isCollapsed: defaultCollapsed,
  ...rest
}: Omit<
  Parameters<typeof RecordSelectorFromCollection>[0],
  'children' | 'onSlide' | 'table'
> & {
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly formType: FormType;
  readonly viewName?: string;
  readonly urlParameter?: string;
  readonly onClose: () => void;
  readonly onFetch?: (
    filters?: CollectionFetchFilters<AnySchema>
  ) => Promise<Collection<AnySchema> | undefined>;
  readonly sortField: SubViewSortField | undefined;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const focusFirstField = useFirstFocus(containerRef);

  const isDependent = collection instanceof DependentCollection;
  const isToOne = shouldBeToOne(relationship);
  const isReadOnly = augmentMode(
    React.useContext(ReadOnlyContext),
    false,
    relationship.relatedTable.name
  );

  const [isCollapsed, _handleCollapsed, handleExpand, handleToggle] =
    useBooleanState(defaultCollapsed);

  const [state, setState] = React.useState<
    | State<
        'AddResourceState',
        {
          readonly resource: SpecifyResource<AnySchema>;
          readonly handleAdd: (
            resources: RA<SpecifyResource<AnySchema>>
          ) => void;
        }
      >
    | State<'MainState'>
  >({ type: 'MainState' });

  const blockers = useAllSaveBlockers(collection.related, relationship);
  const hasBlockers = blockers.length > 0;
  React.useEffect(() => {
    if (hasBlockers && isCollapsed) handleExpand();
  }, [hasBlockers, isCollapsed, handleExpand]);

  const [interactionResource, setInteractionResource] =
    React.useState<SpecifyResource<AnySchema>>();

  const collapsibleButton = (
    <Button.Icon
      disabled={hasBlockers}
      icon={isCollapsed ? 'chevronRight' : 'chevronDown'}
      title={isCollapsed ? commonText.expand() : commonText.collapse()}
      onClick={handleToggle}
    />
  );

  const handleAdding = React.useCallback(
    (resources: RA<SpecifyResource<AnySchema>>) => {
      if (isCollapsed) handleExpand();
      handleAdd?.(resources);
    },
    [handleAdd, isCollapsed, handleExpand]
  );

  const [rawIndex, setIndex] = useSearchParameter(urlParameter);
  const index = f.parseInt(rawIndex) ?? 0;

  const isInteraction =
    typeof relationship === 'object' &&
    relationshipIsToMany(relationship) &&
    typeof collection.related === 'object' &&
    interactionPrepTables.includes(
      (relationship.relatedTable as SpecifyTable<AnyInteractionPreparation>)
        .name
    );

  const [isDialogOpen, handleOpenDialog, handleCloseDialog] = useBooleanState();

  const isAttachmentTable =
    collection.table.specifyTable.name.includes('Attachment');

  const subviewContext = React.useContext(SubViewContext);
  const parentContext = React.useMemo(
    () => subviewContext?.parentContext ?? [],
    [subviewContext?.parentContext]
  );

  const renderedResourceId = React.useMemo(
    () =>
      parentContext.length === 0 || relationship.isDependent()
        ? undefined
        : f.maybe(
            parentContext.find(
              ({ relationship: parentRelationship }) =>
                parentRelationship === relationship.getReverse()
            ),
            ({ parentResource: { id } }) => id
          ),
    [parentContext, relationship]
  );

  const isCOJO =
    relationship.relatedTable.name === 'CollectionObjectGroupJoin' &&
    relationship.name === 'children';

  const isTaxonTreeDefItemTable =
    collection.table.specifyTable.name === 'TaxonTreeDefItem';

  const isLoanPrep = relationship.relatedTable.name === 'LoanPreparation';
  const disableRemove =
    isLoanPrep &&
    (collection.related?.isNew() === true || collection.related?.needsSaved);

  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <RecordSelectorFromCollection
        collection={collection}
        defaultIndex={isToOne ? 0 : index}
        relationship={relationship}
        onAdd={(resources): void => {
          if (isInteraction) {
            setInteractionResource(resources[0]);
            handleOpenDialog();
          }
          if (!isInteraction && formType !== 'formTable')
            collection.add(resources);
          handleAdding(resources);
        }}
        onDelete={(...args): void => {
          if (isCollapsed) handleExpand();
          handleDelete?.(...args);
        }}
        onFetch={handleFetch}
        onSlide={(index): void => {
          handleExpand();
          if (typeof urlParameter === 'string') setIndex(index.toString());
        }}
        {...rest}
      >
        {({
          dialogs,
          slider,
          resource,
          onAdd: handleAdd,
          onRemove: handleRemove,
          showSearchDialog,
          isLoading,
        }): JSX.Element => (
          <>
            {isInteraction &&
            typeof collection.related === 'object' &&
            isDialogOpen ? (
              <InteractionDialog
                actionTable={
                  collection.related
                    .specifyTable as SpecifyTable<InteractionWithPreps>
                }
                interactionResource={interactionResource}
                itemCollection={
                  collection as Collection<AnyInteractionPreparation>
                }
                onClose={handleCloseDialog}
              />
            ) : undefined}
            {formType === 'form' ? (
              <ReadOnlyContext.Provider
                value={
                  isReadOnly ||
                  (renderedResourceId !== undefined &&
                    resource?.id === renderedResourceId)
                }
              >
                <ResourceView
                  containerRef={containerRef}
                  dialog={dialog}
                  headerButtons={(specifyNetworkBadge): JSX.Element => (
                    <>
                      <DataEntry.Visit
                        /*
                         * If dialog is not false, the visit button would be added
                         * by ResourceView
                         */
                        resource={
                          !isDependent && dialog === false
                            ? resource
                            : undefined
                        }
                      />
                      {!isDependent &&
                      hasTablePermission(
                        relationship.relatedTable.name,
                        'read'
                      ) &&
                      typeof handleAdd === 'function' ? (
                        <DataEntry.Search
                          disabled={
                            isReadOnly ||
                            (isToOne && collection.models.length > 0) ||
                            isTaxonTreeDefItemTable
                          }
                          onClick={showSearchDialog}
                        />
                      ) : undefined}
                      {hasTablePermission(
                        relationship.relatedTable.name,
                        'create'
                      ) && typeof handleAdd === 'function' ? (
                        isCOJO ? (
                          <COJODialog
                            collection={collection}
                            parentResource={
                              collection.related as SpecifyResource<CollectionObjectGroup>
                            }
                          />
                        ) : (
                          <DataEntry.Add
                            aria-pressed={state.type === 'AddResourceState'}
                            disabled={
                              isReadOnly ||
                              (isToOne && collection.models.length > 0) ||
                              isTaxonTreeDefItemTable
                            }
                            onClick={(): void => {
                              const resource =
                                new collection.table.specifyTable.Resource();

                              if (
                                isDependent ||
                                viewName === relationship.relatedTable.view
                              ) {
                                focusFirstField();
                                handleAdd([resource]);
                                return;
                              }

                              if (state.type === 'AddResourceState')
                                setState({ type: 'MainState' });
                              else
                                setState({
                                  type: 'AddResourceState',
                                  resource,
                                  handleAdd,
                                });
                            }}
                          />
                        )
                      ) : undefined}
                      {hasTablePermission(
                        relationship.relatedTable.name,
                        isDependent ? 'delete' : 'read'
                      ) && typeof handleRemove === 'function' ? (
                        <DataEntry.Remove
                          disabled={
                            isReadOnly ||
                            collection.models.length === 0 ||
                            resource === undefined ||
                            (renderedResourceId !== undefined &&
                              resource?.id === renderedResourceId) ||
                            disableRemove
                          }
                          onClick={(): void => {
                            handleRemove('minusButton');
                          }}
                        />
                      ) : undefined}
                      <span
                        className={`flex-1 ${
                          dialog === false ? '-ml-2' : '-ml-4'
                        }`}
                      />

                      {isAttachmentTable && (
                        <AttachmentsCollection collection={collection} />
                      )}
                      {specifyNetworkBadge}
                      {(!isToOne ||
                        (isToOne && collection.models.length > 1)) &&
                        slider}
                    </>
                  )}
                  isCollapsed={isCollapsed}
                  isDependent={isDependent}
                  isLoading={isLoading}
                  isSubForm={dialog === false}
                  key={resource?.cid}
                  preHeaderButtons={collapsibleButton}
                  resource={resource}
                  title={relationship.label}
                  onAdd={undefined}
                  onDeleted={
                    collection.models.length <= 1 ? handleClose : undefined
                  }
                  onSaved={handleClose}
                  viewName={viewName}
                  /*
                   * Don't save the resource on save button click if it is a dependent
                   * resource
                   */
                  onClose={handleClose}
                />
              </ReadOnlyContext.Provider>
            ) : null}
            {formType === 'formTable' ? (
              <FormTableCollection
                collection={collection}
                dialog={dialog}
                disableRemove={disableRemove}
                isCollapsed={isCollapsed}
                preHeaderButtons={collapsibleButton}
                sortField={sortField}
                viewName={viewName}
                onAdd={
                  isTaxonTreeDefItemTable
                    ? undefined
                    : (resources): void => {
                        if (!isInteraction) collection.add(resources);
                        handleAdd?.(resources);
                      }
                }
                onClose={handleClose}
                onDelete={(_resource, index): void => {
                  if (isCollapsed) handleExpand();
                  handleDelete?.(index, 'minusButton');
                }}
                onFetchMore={handleFetch}
              />
            ) : null}
            {dialogs}
            {state.type === 'AddResourceState' &&
            typeof handleAdd === 'function' ? (
              <ResourceView
                dialog="nonModal"
                isDependent={isDependent}
                isSubForm={false}
                resource={state.resource}
                onAdd={undefined}
                onClose={(): void => setState({ type: 'MainState' })}
                onDeleted={undefined}
                onSaved={(): void => {
                  state.handleAdd([state.resource]);
                  setState({ type: 'MainState' });
                }}
              />
            ) : null}
          </>
        )}
      </RecordSelectorFromCollection>
    </ReadOnlyContext.Provider>
  );
}
