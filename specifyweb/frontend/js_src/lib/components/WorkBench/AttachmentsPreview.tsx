/**
 * Workbench Attachment side bar for viewing attachments linked in an "Attachments" column
 *
 * @module
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { attachmentsText } from '../../localization/attachments';

export function WbAttachmentsPreview({
  datasetId,
  datasetName,
  onClose: handleClose,
}: {
  readonly datasetId: number;
  readonly datasetName: string;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <ErrorBoundary dismissible>
      <div className="flex h-full w-60 flex-col gap-4">
        <div>
          <H2>
            {attachmentsText.attachments()}
          </H2>
          <p>
            {wbText.wbAffectedDescription()}
          </p>
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