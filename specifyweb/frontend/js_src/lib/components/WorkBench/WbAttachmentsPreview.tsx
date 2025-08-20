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
import type { GetSet, RA } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { fetchOriginalUrl } from '../Attachments/attachments';
import { LeafletImageViewer } from '../Attachments/LeafletImageViewer';
import { AttachmentPreview } from '../Attachments/Preview';
import { AttachmentViewer } from '../Attachments/Viewer';
import { toResource } from '../DataModel/helpers';
import type {
  AnySchema,
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import type { Attachment, SpDataSetAttachment } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { PopupWindow } from '../Molecules/PopupWindow';
import { Skeleton } from '../SkeletonLoaders/Skeleton';
import type { Dataset } from '../WbPlanView/Wrapped';
import {
  getAttachmentsColumnIndex,
  getAttachmentsFromCell,
} from '../WorkBench/attachmentHelpers';
import { setCache, exportsForTests } from '../../utils/cache';

const { formatCacheKey } = exportsForTests;

type WbAttachmentPreviewCell = {
  readonly attachment: SerializedResource<Attachment> | undefined;
  readonly isLoading: boolean;
};

export function WbAttachmentsPreview({
  hot,
  dataset,
  showPanel,
  onClose: handleClose,
}: {
  readonly hot: Handsontable | undefined;
  readonly dataset: Dataset;
  readonly showPanel: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const [selectedRow, setSelectedRow] = React.useState<number | undefined>(
    undefined
  );
  const [attachments, setAttachments] = React.useState<
    RA<WbAttachmentPreviewCell>
  >([]);
  const [selectedAttachment, setSelectedAttachment] = React.useState<
    SerializedResource<Attachment> | undefined
  >(undefined);

  const [showAttachment, handleShowAttachment, handleHideAttachment] =
    useBooleanState();

  const [useWindow, setUseWindow] = React.useState<boolean>(false);

  const handleSelection = (row: number | undefined): void => {
    if (!hot) return;
    if (row === -1) {
      setSelectedRow(undefined);
      return;
    }
    setSelectedRow(row);
  };

  React.useEffect(() => {
    if (!hot) return;
    setAttachments([]);
    setSelectedAttachment(undefined);
    if (selectedRow === undefined) return;

    fetchRowAttachments(
      hot,
      dataset,
      selectedRow,
      setAttachments,
      setSelectedAttachment
    );
  }, [selectedRow]);

  React.useEffect(() => {
    if (!hot) return;
    const initialRow = hot.getSelectedLast()?.[0];
    handleSelection(initialRow);
    hot.addHook('afterSelectionEnd', handleSelection);
  }, [hot]);

  return (
    <>
      {showPanel && (
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
                    cell !== undefined && !cell.isLoading && cell.attachment ? (
                      <AttachmentPreview
                        attachment={cell.attachment}
                        key={index}
                        onOpen={(): void => {
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
      )}
      {showAttachment && (
        <AttachmentViewerDialog
          attachment={selectedAttachment}
          viewerId={dataset.id.toString()}
          window={[useWindow, setUseWindow]}
          onClose={handleHideAttachment}
        />
      )}
    </>
  );
}

function fetchRowAttachments(
  hot: Handsontable,
  dataset: Dataset,
  row: number,
  setAttachments: (
    attachments:
      | RA<WbAttachmentPreviewCell>
      | ((
          attachments: RA<WbAttachmentPreviewCell>
        ) => RA<WbAttachmentPreviewCell>)
  ) => void,
  setSelectedAttachment: (
    attachment: SerializedResource<Attachment> | undefined
  ) => void
): void {
  // Look for Attachments column
  const attachmentColumnIndex = getAttachmentsColumnIndex(dataset);
  if (attachmentColumnIndex === -1) return;

  // Each row should have comma-separated IDs for SpDataSetAttachments
  const selectedCell = (hot.getDataAtCell(row, attachmentColumnIndex) ??
    '') as string;
  const cellData = getAttachmentsFromCell(selectedCell);
  const dataSetAttachmentIds =
    cellData === undefined
      ? []
      : cellData.attachments.map((attachment) => attachment.id);

  if (dataSetAttachmentIds.length === 0) {
    setAttachments([]);
    return;
  }

  setAttachments(
    Array.from({ length: dataSetAttachmentIds.length }, () => ({
      attachment: undefined,
      isLoading: true,
    }))
  );

  const insertAttachmentPreviewCell = (
    index: number,
    attachmentPreviewCell: WbAttachmentPreviewCell
  ): void => {
    setAttachments((previousAttachments) => {
      const newAttachments = Array.from(previousAttachments);
      newAttachments[index] = attachmentPreviewCell;
      return newAttachments;
    });
  };

  dataSetAttachmentIds.forEach((id: number, index: number) => {
    ajax<SerializedRecord<SpDataSetAttachment>>(
      `/api/specify/spdatasetattachment/${id}/`,
      {
        headers: { Accept: 'application/json' },
        method: 'GET',
      }
    )
      .then(({ data }) => {
        const resource = toResource(
          serializeResource(data.attachment),
          'Attachment'
        );
        if (resource !== undefined && index === 0) {
          // TODO: update spDataSetAttachment's ordinal when uploading multiple attachments to a single row and use data.ordinal === 0
          setSelectedAttachment(resource);
        }
        insertAttachmentPreviewCell(index, {
          attachment: resource,
          isLoading: false,
        });
      })
      .catch(() => {
        insertAttachmentPreviewCell(index, {
          attachment: undefined,
          isLoading: false,
        });
      });
  });
}

function AttachmentViewerDialog({
  attachment,
  onClose,
  viewerId,
  window: [useWindow, setUseWindow],
}: {
  readonly attachment: SerializedResource<Attachment> | undefined;
  readonly onClose: () => void;
  readonly viewerId: string;
  readonly window: GetSet<boolean>;
}): JSX.Element | null {
  const [attachmentUrl, setAttachmentUrl] = React.useState<string | undefined>(
    undefined
  );

  const [isImage, setIsImage] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (attachment === undefined) return;
    setIsImage((attachment.mimeType ?? '').startsWith('image/'));

    fetchOriginalUrl(attachment).then((url) => {
      if (typeof url === 'string') {
        setAttachmentUrl(`/attachment_gw/proxy/${new URL(url).search}`);
      }
    });
  }, [attachment]);

  // Use cache/localStorage to communicate with WbAttachmentViewer page.
  React.useEffect(() => {
    if (attachment === undefined) return;
    if (useWindow) {
      setCache('workBenchAttachmentViewer', viewerId, [attachment.id]);
    }
  }, [attachment, useWindow]);


  const [related, setRelated] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);

  const body =
    attachment !== undefined &&
    (isImage ? (
      <LeafletImageViewer alt={attachment?.title ?? ''} src={attachmentUrl ?? ''} />
    ) : (
      <AttachmentViewer
        attachment={deserializeResource(attachment)}
        related={[related, setRelated]}
        showMeta={false}
        onViewRecord={undefined}
      />
    ));

  return useWindow ? (
    <PopupWindow
      title={attachmentsText.attachments()}
      url={`/specify/workbench-attachment/?id=${encodeURIComponent(viewerId)}`}
      onBlock={(): void => {
        setUseWindow(false);
      }}
      onUnload={(): void => {
        /**
         * Only close the viewer if the user isn't reattaching the window.
         * We know the window was reattached if the cache key was removed.
         * Not using getCache to avoid using the cached cache (localStorage) value.
         */
        const value = globalThis.localStorage.getItem(formatCacheKey('workBenchAttachmentViewer', viewerId));
        if (value) {
          onClose();
        } else {
          setUseWindow(false);
        }
      }}
    >
      {body}
    </PopupWindow>
  ) : (
    <Dialog
      headerButtons={
        <div className="flex items-center gap-2 md:gap-2 ml-auto">
          <Button.Secondary onClick={(): void => setUseWindow(true)}>
            {wbText.detachWindow()}
          </Button.Secondary>
          <Button.Secondary onClick={(): void => onClose()}>
            {commonText.close()}
          </Button.Secondary>
        </div>
      }
      buttons={undefined}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={attachmentsText.attachments()}
      modal={false}
      onClose={onClose}
    >
      {body}
    </Dialog>
  );
}
