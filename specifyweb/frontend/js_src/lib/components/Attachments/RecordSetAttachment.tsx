import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { CollectionObjectAttachment } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { defaultScale } from '.';
import { AttachmentGallery } from './Gallery';

export function RecordSetAttachments<SCHEMA extends AnySchema>({
  records,
  onClose: handleClose,
  onFetch: handleFetch,
}: {
  readonly records: RA<SpecifyResource<SCHEMA> | undefined>;
  readonly onClose: () => void;
  readonly onFetch?:
    | ((index: number) => Promise<RA<number | undefined> | void>)
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

      return Promise.all(
        filterArray(relatedAttachementRecords.flat()).map(
          async (collectionObjectAttachment) => ({
            attachment: await collectionObjectAttachment
              .rgetPromise('attachment')
              .then((resource) => serializeResource(resource)),
            related: collectionObjectAttachment,
          })
        )
      );
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
      isComplete={recordFetched.current === records.length}
      scale={scale}
      onChange={(attachment, index): void =>
        void attachments?.[index].related.set(`attachment`, attachment)
      }
      onFetchMore={
        attachments === undefined || handleFetch === undefined || halt
          ? undefined
          : async () => handleFetch?.(recordFetched.current)
      }
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
