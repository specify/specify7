import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { useAttachment } from '../Attachments/Plugin';
import { AttachmentViewer } from '../Attachments/Viewer';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Collection } from '../DataModel/specifyModel';
import { Dialog } from '../Molecules/Dialog';

export function AttachmentsCollection<SCHEMA extends AnySchema>({
  collection,
}: {
  readonly collection: Collection<AnySchema>;
}): JSX.Element {
  const getRecords = React.useCallback(
    (): RA<SpecifyResource<SCHEMA> | undefined> =>
      Array.from(collection.models),
    [collection]
  );
  const [records, _] =
    React.useState<RA<SpecifyResource<SCHEMA> | undefined>>(getRecords);

  const [showAllAttachments, handleOpen, handleClose] = useBooleanState();

  const attachmentRecords = records.map((record) => {
    const [attachment, _] = useAttachment(record);
    const related = useTriggerState(
      record?.specifyModel.name === 'Attachment' ? undefined : record
    );
    return {
      attachment,
      related,
    };
  });

  return (
    <>
      <Button.Icon
        className="p-4"
        icon="photos"
        title="attachments"
        onClick={handleOpen}
      />
      {showAllAttachments && (
        <Dialog
          buttons={
            <Button.Info onClick={handleClose}>
              {commonText.close()}
            </Button.Info>
          }
          header={attachmentsText.attachments()}
          modal
          onClose={undefined}
        >
          <div className="grid grid-cols-[auto_auto_auto] flex-wrap items-start gap-1">
            {attachmentRecords.map(
              (attachment) =>
                typeof attachment.attachment === 'object' && (
                  <div>
                    <AttachmentViewer
                      attachment={attachment.attachment}
                      className="!min-h-[unset]"
                      related={attachment.related}
                      showMeta={false}
                      onViewRecord={undefined}
                    />
                  </div>
                )
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
