/**
 * Workbench Attachment side bar for viewing attachments linked in an "Attachments" column
 *
 * @module
 */

import type Handsontable from 'handsontable';
import React from 'react';

import { ajax } from '../../utils/ajax';
import { commonText } from '../../localization/common';
import { serializeResource } from '../DataModel/serializers';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { RA } from '../../utils/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { attachmentsText } from '../../localization/attachments';
import type { Attachment, SpDataSetAttachment } from '../DataModel/types';
import { AttachmentPreview } from '../Attachments/Preview';
import { SerializedResource, SerializedRecord } from '../DataModel/helperTypes';
import { f } from '../../utils/functools';
import { useBooleanState } from '../../hooks/useBooleanState';
import { fetchOriginalUrl } from '../Attachments/attachments';
import { ImageViewer } from '../Attachments/ImageViewer';
import { wbText } from '../../localization/workbench';

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
  const [attachment, setAttachment] = React.useState<
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
    setAttachment(undefined);
    if (selectedRow === undefined) return;

    // Look for Attachments column
    const attachmentColumnIndex = datasetColumns.findIndex(
      (column) => column === 'Attachment'
    );
    if (attachmentColumnIndex === -1) return;

    const selectedCell = hot.getDataAtCell(selectedRow, attachmentColumnIndex);
    // Check if its a selectedCell is a valid number (ID)
    if (f.parseInt(selectedCell) !== undefined) {
      const id = selectedCell;
      ajax<SerializedRecord<SpDataSetAttachment>>(
        `/api/specify/spdatasetattachment/${id}/`,
        {
          headers: { Accept: 'application/json' },
          method: 'GET',
        }
      ).then(({ data }) =>
        setAttachment(
          serializeResource(data.attachment) as SerializedResource<Attachment>
        )
      );
    }
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
        <div className="flex h-full w-60 flex-col gap-4">
          <div>
            <H2>{attachmentsText.attachments()}</H2>
            <p>
              {selectedRow !== undefined
                ? wbText.attachmentsForRow({ row: selectedRow+1 })
                : commonText.noResults()}
            </p>
            {selectedRow !== undefined && attachment !== undefined && (
              <AttachmentPreview
                attachment={attachment}
                onOpen={handleShowAttachment}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button.Small className="flex-1" onClick={handleClose}>
              {commonText.close()}
            </Button.Small>
          </div>
        </div>
      </ErrorBoundary>
      {showAttachment && (
        <AttachmentViewer
          attachment={attachment}
          onClose={handleHideAttachment}
        />
      )}
    </>
  );
}

function AttachmentViewer({
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
          src={attachmentUrl ?? ''}
          alt={attachment?.title ?? ''}
          header={attachmentsText.attachments()}
          onClose={onClose}
          modal={false}
        />
      )}
    </>
  );
}
