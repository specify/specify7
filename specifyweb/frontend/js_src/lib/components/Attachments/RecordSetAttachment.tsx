import React from 'react';
import { RA, filterArray } from '../../utils/types';
import { SpecifyResource } from '../DataModel/legacyTypes';
import type { AnySchema } from '../DataModel/helperTypes';
import { Dialog } from '../Molecules/Dialog';
import { attachmentsText } from '../../localization/attachments';
import { useAsyncState } from '../../hooks/useAsyncState';
import { CollectionObjectAttachment } from '../DataModel/types';
import { serializeResource } from '../DataModel/helpers';
import { AttachmentGallery } from './Gallery';
import { useCachedState } from '../../hooks/useCachedState';
import { defaultScale } from '.';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';

export function RecordSetAttachments<SCHEMA extends AnySchema>({
  records,
  onClose: handleClose,
  onFetch: handleFetch,
}: {
  readonly records: RA<SpecifyResource<SCHEMA> | undefined>;
  readonly onClose: () => void;
  readonly onFetch?:
    | ((index: number) => Promise<void | RA<number | undefined>>)
    | undefined;
}): JSX.Element {
  const recordFetched = React.useRef<number>(0);

  const [attachments] = useAsyncState(
    React.useCallback(async () => {
      const relatedAttachementRecords = await Promise.all(
        records.map((record) =>
          record
            ?.rgetCollection(`${record.specifyModel.name}Attachments`)
            .then(
              ({ models }) =>
                models as RA<SpecifyResource<CollectionObjectAttachment>>
            )
        )
      );

      const fetchCount = records.findIndex(
        (record) => record?.populated !== true
      );

      recordFetched.current = fetchCount === -1 ? records.length : fetchCount;

      const attachments = await Promise.all(
        filterArray(relatedAttachementRecords.flat()).map(
          async (collectionObjectAttachment) => ({
            attachment: await collectionObjectAttachment
              .rgetPromise('attachment')
              .then((resource) => serializeResource(resource)),
            related: collectionObjectAttachment,
          })
        )
      );
      return attachments;
    }, [records]),
    true
  );

  const [haltValue, setHaltValue] = React.useState(300);
  const halt = attachments?.length === 0 && records.length >= haltValue;

  const [scale = defaultScale] = useCachedState('attachments', 'scale');

  const children = halt ? (
    haltValue === records.length ? (
      <>{attachmentsText.noAttachments()}</>
    ) : (
      <div className="flex flex-col gap-4">
        {attachmentsText.attachmentHaltLimit({ halt: haltValue })}
        <Button.Orange
          onClick={() => {
            if (haltValue + 300 > records.length) {
              setHaltValue(records.length);
            } else {
              setHaltValue(haltValue + 300);
            }
          }}
        >
          {attachmentsText.fetchNextAttachments()}
        </Button.Orange>
      </div>
    )
  ) : (
    <AttachmentGallery
      attachments={attachments?.map(({ attachment }) => attachment) ?? []}
      scale={scale}
      onChange={(attachment, index): void =>
        void attachments?.[index].related.set(`attachment`, attachment)
      }
      onFetchMore={
        attachments === undefined || handleFetch === undefined || halt
          ? undefined
          : async () => handleFetch?.(recordFetched.current)
      }
      isComplete={recordFetched.current === records.length}
    />
  );

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={attachmentsText.attachments()}
      onClose={handleClose}
    >
      {children}
    </Dialog>
  );
}
