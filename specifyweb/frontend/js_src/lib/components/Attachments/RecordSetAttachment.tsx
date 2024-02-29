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
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import type { CollectionObjectAttachment } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { defaultAttachmentScale } from '.';
import { AttachmentGallery } from './Gallery';

const haltIncrementSize = 300;

export function RecordSetAttachments<SCHEMA extends AnySchema>({
  records,
  onFetch: handleFetch,
}: {
  readonly records: RA<SpecifyResource<SCHEMA> | undefined>;
  readonly onFetch:
    | ((index: number) => Promise<RA<number | undefined> | void>)
    | undefined;
}): JSX.Element {
  const fetchedCount = React.useRef<number>(0);

  const [showAttachments, handleShowAttachments, handleHideAttachments] =
    useBooleanState();

  const [attachments] = useAsyncState(
    React.useCallback(async () => {
      if (!showAttachments) {
        return { attachments: [], related: [] };
      }

      const relatedAttachmentRecords = await Promise.all(
        records.map(async (record) =>
          record
            ?.rgetCollection(`${record.specifyTable.name}Attachments`)
            .then(
              ({ models }) =>
                models as RA<SpecifyResource<CollectionObjectAttachment>>
            )
        )
      );

      const fetchCount = filterArray(records).findIndex(
        (record) => !record.populated
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
    }, [records, showAttachments]),
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

  const isComplete = fetchedCount.current === records.length;

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
          dimensionsKey={isComplete ? undefined : false}
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
              isComplete={isComplete}
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
