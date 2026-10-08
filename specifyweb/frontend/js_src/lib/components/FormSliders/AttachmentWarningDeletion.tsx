import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Collection } from '../DataModel/specifyTable';
import { fetchCollection } from '../DataModel/collection';
import { idFromUrl } from '../DataModel/resource';
import type { Tables } from '../DataModel/types';
import { attachmentRelatedTables } from '../Attachments/utils';
import { loadingBar } from '../Molecules';
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
  const [isShared] = useAsyncState(
    React.useCallback(async () => {
      if (resource === undefined) return false;
      const attachmentUrl = resource.get('attachment');
      const attachmentId =
        typeof attachmentUrl === 'string'
          ? idFromUrl(attachmentUrl)
          : undefined;
      if (attachmentId === undefined) return false;
      try {
        const usages = await Promise.all(
          attachmentRelatedTables().map(async (tableName) =>
            fetchCollection(
              tableName as keyof Tables,
              { limit: 1 },
              {
                attachment: attachmentId,
              }
            ).then(({ totalCount }) => totalCount)
          )
        );
        const ownUsage = resource.isNew() ? 0 : 1;
        return usages.reduce((total, count) => total + count, 0) > ownUsage;
      } catch {
        // If usage cannot be checked, preserve the attachment and only unlink.
        return true;
      }
    }, [resource]),
    false
  );

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Save
            disabled={isShared === undefined}
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
            {isShared === true
              ? attachmentsText.unlinkAttachment()
              : interactionsText.continue()}
          </Button.Save>
        </>
      }
      header={attachmentsText.attachmentDelition()}
      onClose={closeWarning}
    >
      {isShared === undefined
        ? loadingBar
        : isShared
          ? attachmentsText.unlinkAttachmentWarning()
          : attachmentsText.deleteAttachmentWarning()}
      <span className="font-bold">
        {(
          resource?.dependentResources?.attachment as SpecifyResource<AnySchema>
        )?.get('title') ?? ''}
      </span>
    </Dialog>
  );
}
