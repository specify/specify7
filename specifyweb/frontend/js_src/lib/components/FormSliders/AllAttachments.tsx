import React from 'react';
import { AnySchema } from '../DataModel/helperTypes';
import { Collection } from '../DataModel/specifyModel';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { RA } from '../../utils/types';
import { useAttachment } from '../Attachments/Plugin';
import { AttachmentViewer } from '../Attachments/Viewer';
import { useTriggerState } from '../../hooks/useTriggerState';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { attachmentsText } from '../../localization/attachments';
import { useBooleanState } from '../../hooks/useBooleanState';

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
      attachment: attachment,
      related: related,
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
          modal={true}
          onClose={undefined}
        >
          <div className="grid grid-cols-[auto_auto_auto] flex-wrap items-start gap-1">
            {attachmentRecords.map(
              (attachment) =>
                typeof attachment.attachment === 'object' && (
                  <div>
                    <AttachmentViewer
                      attachment={attachment.attachment}
                      related={attachment.related}
                      onViewRecord={undefined}
                      showMeta={false}
                      classNameProp={'!min-h-[unset]'}
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
