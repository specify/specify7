import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { CollectionObjectAttachment } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { defaultAttachmentScale } from '.';
import { AttachmentGallery } from './Gallery';

const haltIncrementSize = 300;

export function RecordSetAttachments<SCHEMA extends AnySchema>({
  records,
  onFetch: handleFetch,
  trackChanges,
}: {
  readonly records: RA<SpecifyResource<SCHEMA> | undefined>;
  readonly onFetch:
    | ((index: number) => Promise<RA<number | undefined> | void>)
    | undefined;
  readonly trackChanges: number;
}): JSX.Element {
  const fetchedCount = React.useRef<number>(0);

  const [showAttachments, handleShowAttachments, handleHideAttachments] =
    useBooleanState();

  const [attachments] = useAsyncState(
    React.useCallback(async () => {
      const relatedAttachmentRecords = await Promise.all(
        records.map(async (record) =>
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

      fetchedCount.current = fetchCount === -1 ? records.length : fetchCount;

      const attachments = await Promise.all(
        filterArray(relatedAttachmentRecords.flat()).map(
          async (collectionObjectAttachment) => ({
            attachment: await collectionObjectAttachment
              .rgetPromise('attachment')
              .then((resource) => serializeResource(resource)),
            related: collectionObjectAttachment,
          })
        )
      );

      return {
        attachments: attachments.map(({ attachment }) => attachment),
        related: attachments.map(({ related }) => related),
      };
    }, [records, trackChanges]),
    false
  );
  const attachmentsRef = React.useRef(attachments);

  if (typeof attachments === 'object') attachmentsRef.current = attachments;

  /*
   * Stop fetching records if the first 300 don't have attachments
   * to save computing resources. Ask the user to continue and fetch
   * the next haltIncrementSize (300) if desired.
   */
  const [haltValue, setHaltValue] = React.useState(39);
  const halt =
    attachments?.attachments.length === 0 && records.length >= haltValue;

  const [scale = defaultAttachmentScale] = useCachedState(
    'attachments',
    'scale'
  );

  return (
    <>
      <Button.Icon
        disabled={attachments === undefined}
        icon="photos"
        title="attachments"
        onClick={handleShowAttachments}
      />
      {showAttachments && (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          className={{
            container: dialogClassNames.wideContainer,
          }}
          header={
            attachmentsRef.current?.attachments === undefined
              ? attachmentsText.attachments()
              : commonText.countLine({
                  resource: attachmentsText.attachments(),
                  count: attachmentsRef.current.attachments.length,
                })
          }
          onClose={handleHideAttachments}
        >
          {halt ? (
            haltValue === records.length ? (
              <>{attachmentsText.noAttachments()}</>
            ) : (
              <div className="flex flex-col gap-4">
                {attachmentsText.attachmentHaltLimit({ halt: haltValue })}
                <Button.Warning
                  onClick={(): void =>
                    setHaltValue(
                      Math.min(haltValue + haltIncrementSize, records.length)
                    )
                  }
                >
                  {attachmentsText.fetchNextAttachments()}
                </Button.Warning>
              </div>
            )
          ) : (
            <AttachmentGallery
              attachments={attachmentsRef?.current?.attachments ?? []}
              isComplete={fetchedCount.current === records.length}
              scale={scale}
              onChange={(attachment, index): void =>
                void attachments?.related[index].set(`attachment`, attachment)
              }
              onFetchMore={
                attachments === undefined || handleFetch === undefined || halt
                  ? undefined
                  : async (): Promise<void> =>
                      handleFetch?.(fetchedCount.current).then(f.void)
              }
            />
          )}
        </Dialog>
      )}
    </>
  );
}
