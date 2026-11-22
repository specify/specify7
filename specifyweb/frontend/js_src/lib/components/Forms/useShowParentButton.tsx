import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useParentResource } from '../../hooks/useParentResource';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { GetOrSet } from '../../utils/types';
import type { SET } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { Dialog } from '../Molecules/Dialog';
import { ResourceView } from './ResourceView';

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
          parentResource === false ? (
            <Dialog
              buttons={
                <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              }
              header={formsText.noParentFound()}
              onClose={handleCloseParentResource}
            >
              {formsText.noParentFound()}
            </Dialog>
          ) : (
            <ResourceView
              dialog="modal"
              isDependent={false}
              isLoading={parentResource === undefined}
              isSubForm={false}
              resource={parentResource}
              onAdd={undefined}
              onClose={handleCloseParentResource}
              onDeleted={() => {
                handleLoading(true);
                handleParentDeleted?.();
                handleCheckChildExists().then((childExists) => {
                  if (!childExists) {
                    handleDelete();
                  }
                  handleLoading(false);
                  handleCloseParentResource();
                });
              }}
              onSaved={() => {
                handleLoading(true);
                if (parentResource !== undefined)
                  handleParentSaved?.(parentResource);
                handleCheckChildExists().then((childExists) => {
                  if (!childExists) {
                    handleDelete();
                  }
                  handleLoading(false);
                  handleCloseParentResource();
                });
              }}
            />
          )
        ) : null}
      </>
    ),
  };
}
