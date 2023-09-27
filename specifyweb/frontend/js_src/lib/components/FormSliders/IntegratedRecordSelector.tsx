import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { ReadOnlyContext } from '../Core/Contexts';
import { DependentCollection } from '../DataModel/collectionApi';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { useAllSaveBlockers } from '../DataModel/saveBlockers';
import type { Collection } from '../DataModel/specifyTable';
import {
  DisposalPreparation,
  GiftPreparation,
  LoanPreparation,
} from '../DataModel/types';
import { FormTableCollection } from '../FormCells/FormTableCollection';
import type { FormType } from '../FormParse';
import type { SubViewSortField } from '../FormParse/cells';
import { augmentMode, ResourceView } from '../Forms/ResourceView';
import { InteractionDialog } from '../Interactions/InteractionDialog';
import { hasTablePermission } from '../Permissions/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
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
  readonly sortField: SubViewSortField | undefined;
}): JSX.Element {
  const isDependent = collection instanceof DependentCollection;
  const isToOne =
    !relationshipIsToMany(relationship) || relationship.type === 'zero-to-one';
  const isReadOnly = augmentMode(
    React.useContext(ReadOnlyContext),
    false,
    relationship.relatedTable.name
  );

  const [isCollapsed, _handleCollapsed, handleExpand, handleToggle] =
    useBooleanState(defaultCollapsed);

  const blockers = useAllSaveBlockers(collection.related, relationship);
  const hasBlockers = blockers.length > 0;
  React.useEffect(() => {
    if (hasBlockers && isCollapsed) handleExpand();
  }, [hasBlockers, isCollapsed, handleExpand]);

  const collapsibleButton = (
    <Button.Icon
      disabled={hasBlockers}
      icon={isCollapsed ? 'chevronRight' : 'chevronDown'}
      onClick={handleToggle}
      title={isCollapsed ? commonText.expand() : commonText.collapse()}
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
    ['LoanPreparation', 'GiftPreparation', 'DisposalPreparation'].includes(
      relationship.relatedTable.name
    );

  const [isDialogOpen, handleOpenDialog, handleCloseDialog] = useBooleanState();

  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <RecordSelectorFromCollection
        collection={collection}
        defaultIndex={isToOne ? 0 : index}
        relationship={relationship}
        isInteraction={isInteraction}
        isCollapsed={defaultCollapsed}
        onAdd={(resource) => {
          if (isInteraction) handleOpenDialog();
          handleAdding(resource);
        }}
        onDelete={(...args): void => {
          if (isCollapsed) handleExpand();
          handleDelete?.(...args);
        }}
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
          isLoading,
        }): JSX.Element => (
          <>
            {isInteraction &&
            typeof collection.related === 'object' &&
            isDialogOpen ? (
              <InteractionDialog
                actionTable={collection.related.specifyTable}
                itemCollection={
                  collection as Collection<
                    DisposalPreparation | GiftPreparation | LoanPreparation
                  >
                }
                onClose={handleCloseDialog}
              />
            ) : undefined}
            {formType === 'form' ? (
              <ResourceView
                dialog={dialog}
                headerButtons={(specifyNetworkBadge): JSX.Element => (
                  <>
                    <DataEntry.Visit
                      /*
                       * If dialog is not false, the visit button would be added
                       * by ResourceView
                       */
                      resource={
                        !isDependent && dialog === false ? resource : undefined
                      }
                    />
                    {hasTablePermission(
                      relationship.relatedTable.name,
                      isDependent ? 'create' : 'read'
                    ) && typeof handleAdd === 'function' ? (
                      <DataEntry.Add
                        disabled={
                          isReadOnly ||
                          (isToOne && collection.models.length > 0)
                        }
                        onClick={handleAdd}
                      />
                    ) : undefined}
                    {hasTablePermission(
                      relationship.relatedTable.name,
                      isDependent ? 'delete' : 'read'
                    ) && typeof handleRemove === 'function' ? (
                      <DataEntry.Remove
                        disabled={
                          isReadOnly ||
                          collection.models.length === 0 ||
                          resource === undefined
                        }
                        onClick={(): void => handleRemove('minusButton')}
                      />
                    ) : undefined}
                    <span
                      className={`flex-1 ${
                        dialog === false ? '-ml-2' : '-ml-4'
                      }`}
                    />
                    {specifyNetworkBadge}
                    {!isToOne && slider}
                  </>
                )}
                isDependent={isDependent}
                isLoading={isLoading}
                isSubForm={dialog === false}
                isCollapsed={isCollapsed}
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
                preHeaderButtons={collapsibleButton}
              />
            ) : null}
            {formType === 'formTable' ? (
              <FormTableCollection
                collection={collection}
                dialog={dialog}
                sortField={sortField}
                viewName={viewName}
                onAdd={(resources): void => {
                  collection.add(resources);
                  handleAdding(resources);
                }}
                onClose={handleClose}
                onDelete={(_resource, index): void => {
                  if (isCollapsed) handleExpand();
                  handleDelete?.(index, 'minusButton');
                }}
                preHeaderButtons={collapsibleButton}
                isCollapsed={isCollapsed}
              />
            ) : null}
            {dialogs}
          </>
        )}
      </RecordSelectorFromCollection>
    </ReadOnlyContext.Provider>
  );
}
