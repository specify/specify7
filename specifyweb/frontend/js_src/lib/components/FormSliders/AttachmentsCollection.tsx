import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { filterArray, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { defaultScale } from '../Attachments';
import { AttachmentGallery } from '../Attachments/Gallery';
import { serializeResource } from '../DataModel/helpers';
import { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { Collection } from '../DataModel/specifyModel';
import { Attachment } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';

export function AttachmentsCollection({
  collection,
}: {
  readonly collection: Collection<AnySchema>;
}): JSX.Element {
  const [showAllAttachments, handleOpenAttachments, handleCloseAttachments] =
    useBooleanState();

  const [scale = defaultScale] = useCachedState('attachments', 'scale');

  const attachments: RA<SerializedResource<Attachment>> = React.useMemo(() => {
    return filterArray(
      collection.models.map((model) => {
        if (model.specifyModel.name === 'CollectionObjectAttachment') {
          return serializeResource(model) as SerializedResource<Attachment>;
        }
        return undefined;
      })
    );
  }, [collection]);

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
            onFetchMore={undefined}
            scale={scale}
            onChange={() => undefined}
            onClick={undefined}
            isComplete={attachments.length === collection.models.length}
          />
        </Dialog>
      )}
    </>
  );
}
