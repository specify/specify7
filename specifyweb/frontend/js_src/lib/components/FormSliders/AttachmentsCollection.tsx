import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { defaultScale } from '../Attachments';
import { AttachmentGallery } from '../Attachments/Gallery';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { Collection } from '../DataModel/specifyModel';
import type {
  Attachment,
  CollectionObjectAttachment,
} from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';

export function AttachmentsCollection({
  collection,
}: {
  readonly collection: Collection<AnySchema>;
}): JSX.Element | null {
  const [showAllAttachments, handleOpenAttachments, handleCloseAttachments] =
    useBooleanState();

  const [scale = defaultScale] = useCachedState('attachments', 'scale');

  const attachments: RA<SerializedResource<Attachment>> = filterArray(
    Array.from(collection.models, (model) => {
      if (model.specifyModel.name.includes('Attachment')) {
        const record = serializeResource(
          model
        ) as SerializedResource<CollectionObjectAttachment>;
        // eslint-disable-next-line
        return serializeResource(
          record.attachment
        ) as SerializedResource<Attachment>;
      }
      return undefined;
    })
  );

  return attachments.length > 0 ? (
    <>
      <Button.Small
        title={attachmentsText.attachments()}
        onClick={handleOpenAttachments}
      >
        {icons.gallery}
      </Button.Small>
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
  ) : null;
}
