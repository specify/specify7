import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useParentResource } from '../../hooks/useParentResource';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Button } from '../Atoms/Button';
import { formsText } from '../../localization/forms';
import { ResourceView } from './ResourceView';
import { Dialog } from '../Molecules/Dialog';
import { commonText } from '../../localization/common';
import { GetOrSet } from '../../utils/types';
import { SET } from '../../utils/utils';

export function useShowParentButton({
  resource,
  onLoading: handleLoading,
  onDelete: handleDelete,
  onParentDeleted: handleParentDeleted,
  onParentSaved: handleParentSaved,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly onLoading: GetOrSet<boolean | undefined>[typeof SET];
  readonly onDelete: () => void;
  readonly onParentDeleted?: () => void;
  readonly onParentSaved?: (parentResource: SpecifyResource<AnySchema>) => void;
}) {
  const {
    parentRelationship,
    parentResource,
    onCheckChildExists: handleCheckChildExists,
  } = useParentResource(resource);

  const [
    isParentResourceOpen,
    handleOpenParentResource,
    handleCloseParentResource,
  ] = useBooleanState();

  return {
    showParentResourceButton: (
      <>
        {parentRelationship === undefined ? null : (
          <Button.Small onClick={handleOpenParentResource}>
            {formsText.viewParentResource()}
          </Button.Small>
        )}
      </>
    ),
    parentResourceForm: (
      <>
        {isParentResourceOpen ? (
          parentResource !== false ? (
            <ResourceView
              dialog={'modal'}
              isDependent={false}
              resource={parentResource}
              isLoading={parentResource === undefined}
              onAdd={undefined}
              onClose={handleCloseParentResource}
              onDeleted={() => {
                handleLoading(true);
                handleParentDeleted?.();
                handleCheckChildExists?.().then((childExists) => {
                  if (!childExists) {
                    debugger;
                    handleDelete();
                  }
                  handleLoading(false);
                  handleCloseParentResource();
                });
              }}
              isSubForm={false}
              onSaved={() => {
                handleLoading(true);
                if (parentResource !== undefined)
                  handleParentSaved?.(parentResource);
                handleCheckChildExists?.().then((childExists) => {
                  if (!childExists) {
                    handleDelete();
                  }
                  handleLoading(false);
                  handleCloseParentResource();
                });
              }}
            />
          ) : (
            <Dialog
              buttons={
                <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              }
              header={formsText.noParentFound()}
              onClose={handleCloseParentResource}
            >
              {formsText.noParentFound()}
            </Dialog>
          )
        ) : null}
      </>
    ),
  };
}
