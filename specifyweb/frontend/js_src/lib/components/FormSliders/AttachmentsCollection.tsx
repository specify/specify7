import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { defaultScale } from '../Attachments';
import { AttachmentGallery } from '../Attachments/Gallery';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { Collection } from '../DataModel/specifyModel';
import type { Attachment } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';

export function AttachmentsCollection({
  collection,
}: {
  readonly collection: Collection<AnySchema>;
}): JSX.Element {
  const [showAllAttachments, handleOpenAttachments, handleCloseAttachments] =
    useBooleanState();

  const [scale = defaultScale] = useCachedState('attachments', 'scale');

  const attachments = React.useMemo(
    () =>
      collection.models.map(
        (resource) =>
          serializeResource(resource) as SerializedResource<Attachment>
      ),
    [collection]
  );

  return (
    <>
      <Button.Icon
        icon="photos"
        title={attachmentsText.attachments()}
        onClick={handleOpenAttachments}
      />
      {showAllAttachments && (
        <Dialog
          buttons={
            <Button.Info onClick={handleCloseAttachments}>
              {commonText.close()}
            </Button.Info>
          }
          header={attachmentsText.attachments()}
          modal
          onClose={handleCloseAttachments}
        >
          <AttachmentGallery
            attachments={attachments}
            isComplete={attachments.length === collection.models.length}
            scale={scale}
            onChange={() => undefined}
            onClick={undefined}
            onFetchMore={undefined}
          />
        </Dialog>
      )}
    </>
  );
}
