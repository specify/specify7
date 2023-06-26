import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { f } from '../../utils/functools';
import { DataEntry } from '../Atoms/DataEntry';
import { ReadOnlyContext } from '../Core/Contexts';
import { DependentCollection } from '../DataModel/collectionApi';
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
        onAdd={(resource) => {
          handleOpenDialog();
          if (handleAdd !== undefined && isInteraction) {
            handleAdd(resource);
          }
        }}
        onDelete={handleDelete}
        onSlide={(index): void =>
          typeof urlParameter === 'string'
            ? setIndex(index.toString())
            : undefined
        }
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
            ) : null}
            {formType === 'formTable' ? (
              <FormTableCollection
                collection={collection}
                dialog={dialog}
                sortField={sortField}
                viewName={viewName}
                onAdd={(): void => {
                  if (typeof handleAdd === 'function') handleAdd();
                }}
                onClose={handleClose}
                onDelete={
                  handleDelete === undefined
                    ? undefined
                    : (_resource, index): void =>
                        handleDelete(index, 'minusButton')
                }
              />
            ) : null}
            {dialogs}
          </>
        )}
      </RecordSelectorFromCollection>
    </ReadOnlyContext.Provider>
  );
}
