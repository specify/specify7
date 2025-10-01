import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Collection } from '../DataModel/specifyTable';
import { Dialog } from '../Molecules/Dialog';

export function AttachmentWarningDeletion({
  formType,
  onRemove: handleRemove,
  collection,
  resource,
  isCollapsed,
  onExpand: handleExpand,
  onDelete: handleDelete,
  index,
  closeWarning,
}: {
  readonly formType: 'form' | 'formTable';
  readonly onRemove: (source: 'deleteButton' | 'minusButton') => void;
  readonly collection: Collection<AnySchema>;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly isCollapsed: boolean;
  readonly onExpand: () => void;
  readonly onDelete:
    | ((index: number, source: 'deleteButton' | 'minusButton') => void)
    | undefined;
  readonly index: number;
  readonly closeWarning: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Save
            onClick={(): void => {
              if (formType === 'form') {
                handleRemove('minusButton');
              }
              if (formType === 'formTable') {
                collection.remove(resource!);
                if (isCollapsed) handleExpand();
                handleDelete?.(index, 'minusButton');
              }
              closeWarning();
            }}
          >
            {interactionsText.continue()}
          </Button.Save>
        </>
      }
      header={attachmentsText.attachmentDelition()}
      onClose={closeWarning}
    >
      {attachmentsText.deleteAttachmentWarning()}
      <span className="font-bold">
        {(
          resource?.dependentResources?.attachment as SpecifyResource<AnySchema>
        )?.get('title') ?? ''}
      </span>
    </Dialog>
  );
}
