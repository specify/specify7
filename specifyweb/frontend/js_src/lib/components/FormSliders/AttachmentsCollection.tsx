import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { defaultAttachmentScale } from '../Attachments';
import { AttachmentGallery } from '../Attachments/Gallery';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { serializeResource } from '../DataModel/serializers';
import type { Collection } from '../DataModel/specifyTable';
import type {
  Attachment,
  CollectionObjectAttachment,
} from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { downloadAllAttachments } from '../Attachments/attachments';
import { LoadingContext } from '../Core/Contexts';

export function AttachmentsCollection({
  collection,
}: {
  readonly collection: Collection<AnySchema>;
}): JSX.Element | null {
  const [showAllAttachments, handleOpenAttachments, handleCloseAttachments] =
    useBooleanState();

  const [scale = defaultAttachmentScale] = useCachedState(
    'attachments',
    'scale'
  );

  const attachmentHasChanged =
    collection.models.length > 0 && collection.models.at(-1)?.needsSaved;

  const attachments: RA<SerializedResource<Attachment>> = React.useMemo(
    () =>
      filterArray(
        Array.from(collection.models, (model) => {
          if (model.specifyTable.name.includes('Attachment')) {
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
      ),
    [collection.models, attachmentHasChanged]
  );

  const isAttachmentsNotLoaded = attachments.some(
    (attachment) => attachment.attachmentLocation === null
  );
  const loading = React.useContext(LoadingContext);

  return attachments.length > 0 ? (
    <>
      <Button.Small
        disabled={isAttachmentsNotLoaded}
        title={attachmentsText.attachments()}
        onClick={handleOpenAttachments}
      >
        {icons.gallery}
      </Button.Small>
      {showAllAttachments && (
        <Dialog
          buttons={
            <>
              <Button.Info
                disabled={isAttachmentsNotLoaded}
                title={attachmentsText.downloadAllDescription()}
                onClick={(): void => loading(downloadAllAttachments(attachments))}
              >
                {attachmentsText.downloadAll()}
              </Button.Info>
              <Button.Info onClick={handleCloseAttachments}>
                {commonText.close()}
              </Button.Info>
            </>
          }
          header={attachmentsText.attachments()}
          icon={icons.gallery}
          modal
          onClose={handleCloseAttachments}
        >
          <AttachmentGallery
            attachments={attachments}
            isComplete={attachments.length === collection.models.length}
            scale={scale}
            onChange={() => undefined}
            onFetchMore={undefined}
          />
        </Dialog>
      )}
    </>
  ) : null;
}
