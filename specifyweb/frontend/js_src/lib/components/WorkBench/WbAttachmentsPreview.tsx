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
import type {
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import { serializeResource } from '../DataModel/serializers';
import type { Attachment, SpDataSetAttachment } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

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
    const attachmentColumnIndex = datasetColumns.indexOf('Attachment');
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
      ).then(({ data }) => setAttachment(serializeResource(data.attachment)));
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
              {selectedRow === undefined
                ? commonText.noResults()
                : wbText.attachmentsForRow({ row: selectedRow + 1 })}
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
