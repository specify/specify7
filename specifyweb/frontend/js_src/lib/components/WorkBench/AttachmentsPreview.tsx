/**
 * Workbench Attachment side bar for viewing attachments linked in an "Attachments" column
 *
 * @module
 */

import type Handsontable from 'handsontable';
import React from 'react';

import { ajax } from '../../utils/ajax';
import { commonText } from '../../localization/common';
import {
  serializeResource,
} from '../DataModel/serializers';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { attachmentsText } from '../../localization/attachments';
import { localized } from '../../utils/types';
import type { Attachment, SpDataSetAttachment } from '../DataModel/types';
import { AttachmentPreview } from '../Attachments/Preview';
import { SerializedResource, SerializedRecord } from '../DataModel/helperTypes';
import { f } from '../../utils/functools';

export function WbAttachmentsPreview({
  hot,
  onClose: handleClose,
}: {
  readonly datasetId: number;
  readonly datasetName: string;
  readonly hot: Handsontable | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [selectedRow, setSelectedRow] = React.useState<number | undefined>(
    undefined
  );
  const [attachment, setAttachment] = React.useState<
    SerializedResource<Attachment> | undefined
  >(undefined);

  const handleSelection = (row: number | undefined): void => {
    if (!hot) return;
    console.log(selectedRow, row);
    if (selectedRow === row) return;
    setSelectedRow(row);
    setAttachment(undefined);
    if (row === undefined) return;

    const selectedCell = hot.getDataAtCell(row, 0);
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
  };

  React.useEffect(() => {
    if (!hot) return;
    const initialRow = hot.getSelectedLast()?.[0];
    handleSelection(initialRow);
    hot.addHook('afterSelectionEnd', handleSelection);
  }, [hot]);

  return (
    <ErrorBoundary dismissible>
      <div className="flex h-full w-60 flex-col gap-4">
        <div>
          <H2>{attachmentsText.attachments()}</H2>
          <p>
            {selectedRow !== undefined
              ? localized(`Attachments for row ${selectedRow + 1}`)
              : commonText.noResults()}
          </p>
          {selectedRow !== undefined && attachment !== undefined && (
            <AttachmentPreview
              attachment={attachment}
              onOpen={(): void => {}}
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
  );
}
