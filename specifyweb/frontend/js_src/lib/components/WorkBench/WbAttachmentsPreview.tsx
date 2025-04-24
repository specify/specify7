/**
 * Workbench Attachment side bar for viewing attachments linked in an "Attachments" column
 *
 * @module
 */

import type Handsontable from 'handsontable';
import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { fetchOriginalUrl } from '../Attachments/attachments';
import { ImageViewer } from '../Attachments/ImageViewer';
import { AttachmentPreview } from '../Attachments/Preview';
import { toResource } from '../DataModel/helpers';
import type {
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import { serializeResource } from '../DataModel/serializers';
import type { Attachment, SpDataSetAttachment } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Skeleton } from '../SkeletonLoaders/Skeleton';
import { ATTACHMENTS_COLUMN } from '../WbImportAttachments';

type WbAttachmentPreviewCell = {
  readonly attachment: SerializedResource<Attachment> | undefined;
  readonly isLoading: boolean;
};

export function WbAttachmentsPreview({
  hot,
  datasetColumns,
  onClose: handleClose,
}: {
  readonly hot: Handsontable | undefined;
  readonly datasetColumns: RA<string>;
  readonly onClose: () => void;
}): JSX.Element {
  const [selectedRow, setSelectedRow] = React.useState<number | undefined>(
    undefined
  );
  const [attachments, setAttachments] = React.useState<
    readonly WbAttachmentPreviewCell[]
  >([]);
  const [selectedAttachment, setSelectedAttachment] = React.useState<
    SerializedResource<Attachment> | undefined
  >(undefined);

  const [showAttachment, handleShowAttachment, handleHideAttachment] =
    useBooleanState();

  const handleSelection = (row: number | undefined): void => {
    if (!hot) return;
    setSelectedRow(row);
  };

  React.useEffect(() => {
    if (!hot) return;
    setAttachments([]);
    setSelectedAttachment(undefined);
    if (selectedRow === undefined) return;

    // Look for Attachments column
    const attachmentColumnIndex = datasetColumns.indexOf(ATTACHMENTS_COLUMN);
    if (attachmentColumnIndex === -1) return;

    // Each row should have comma-separated IDs for SpDataSetAttachments
    const selectedCell = hot.getDataAtCell(selectedRow, attachmentColumnIndex);
    const dataSetAttachmentIds = selectedCell?.split(',');

    setAttachments(
      Array.from({ length: dataSetAttachmentIds.length }, () => ({
        attachment: undefined,
        isLoading: true,
      }))
    );
    dataSetAttachmentIds.forEach((cell: string, index: number) => {
      const dataSetAttachmentId = f.parseInt(cell);
      if (dataSetAttachmentId !== undefined) {
        ajax<SerializedRecord<SpDataSetAttachment>>(
          `/api/specify/spdatasetattachment/${dataSetAttachmentId}/`,
          {
            headers: { Accept: 'application/json' },
            method: 'GET',
          }
        ).then(({ data }) => {
          const resource = toResource(
            serializeResource(data.attachment),
            'Attachment'
          );
          if (resource !== undefined) {
            if (index === 0) {
              // TODO: update ordinal correctly and use data.ordinal === 0
              setSelectedAttachment(resource);
            }
            setAttachments((previousAttachments) => {
              const newAttachments = Array.from(previousAttachments);
              newAttachments[index] = {
                attachment: resource,
                isLoading: false,
              };
              return newAttachments;
            });
          }
        });
      }
    });
  }, [selectedRow]);

  React.useEffect(() => {
    if (!hot) return;
    const initialRow = hot.getSelectedLast()?.[0];
    handleSelection(initialRow);
    hot.addHook('afterSelectionEnd', handleSelection);
  }, [hot]);

  return (
    <>
      <ErrorBoundary dismissible>
        <div className="flex h-full w-60 flex-col gap-4 overflow-y-auto">
          <div>
            <H2>{attachmentsText.attachments()}</H2>
            <p>
              {selectedRow === undefined
                ? commonText.noResults()
                : wbText.attachmentsForRow({ row: selectedRow + 1 })}
            </p>
            {selectedRow !== undefined && attachments.length >= 0 && (
              <div className="flex flex-col gap-2">
                {attachments.map((cell, index) =>
                  !cell.isLoading && cell.attachment ? (
                    <AttachmentPreview
                      attachment={cell.attachment}
                      key={index}
                      onOpen={() => {
                        handleShowAttachment();
                        setSelectedAttachment(cell.attachment);
                      }}
                    />
                  ) : (
                    <Skeleton.Square key={index} />
                  )
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button.Small className="flex-1" onClick={handleClose}>
              {commonText.close()}
            </Button.Small>
          </div>
        </div>
      </ErrorBoundary>
      {showAttachment && selectedAttachment !== undefined && (
        <AttachmentViewerDialog
          attachment={selectedAttachment}
          onClose={handleHideAttachment}
        />
      )}
    </>
  );
}

function AttachmentViewerDialog({
  attachment,
  onClose,
}: {
  readonly attachment: SerializedResource<Attachment> | undefined;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [attachmentUrl, setAttachmentUrl] = React.useState<string | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (attachment === undefined) return;
    fetchOriginalUrl(attachment).then((url) => {
      if (typeof url === 'string') {
        setAttachmentUrl(`/attachment_gw/proxy/${new URL(url).search}`);
      }
    });
  }, [attachment]);

  return (
    <>
      {attachment !== undefined && (
        <ImageViewer
          alt={attachment?.title ?? ''}
          header={attachmentsText.attachments()}
          modal={false}
          src={attachmentUrl ?? ''}
          onClose={onClose}
        />
      )}
    </>
  );
}
