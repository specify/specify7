import React from 'react';

import type { WbMapping } from '../WorkBench/mapping';
import type { WbStatus } from '../WorkBench/WbView';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { Dialog } from '../Molecules/Dialog';
import { wbText } from '../../localization/workbench';
import { commonText } from '../../localization/common';
import { WbCellCounts } from '../WorkBench/CellMeta';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

export function WbUpload({
  hasUnsavedChanges,
  mappings,
  openNoUploadPlan,
  startUpload,
  cellCounts,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly mappings: WbMapping;
  readonly openNoUploadPlan: () => void;
  readonly startUpload: (mode: WbStatus) => void;
  readonly cellCounts: WbCellCounts;
}): JSX.Element {
  const [showUpload, openUpload, closeUpload] = useBooleanState();

  const handleUpload = (): void => {
    if ((mappings?.lines ?? []).length > 0) {
      openUpload();
    } else {
      openNoUploadPlan();
    }
  };

  const handleConfirmUpload = (): void => {
    startUpload('upload');
    closeUpload();
  };

  return (
    <>
      <ErrorBoundary dismissible>
        <Button.Small
          aria-haspopup="dialog"
          onClick={handleUpload}
          disabled={hasUnsavedChanges || cellCounts.invalidCells > 0}
          title={
            hasUnsavedChanges
              ? wbText.unavailableWhileEditing()
              : cellCounts.invalidCells > 0
              ? wbText.uploadUnavailableWhileHasErrors()
              : ''
          }
        >
          {wbText.upload()}
        </Button.Small>
        {showUpload ? (
          <Dialog
            buttons={
              <>
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
                <Button.Info onClick={handleConfirmUpload}>
                  {wbText.upload()}
                </Button.Info>
              </>
            }
            header={wbText.startUpload()}
            onClose={closeUpload}
          >
            {wbText.startUploadDescription()}
          </Dialog>
        ) : undefined}
      </ErrorBoundary>
    </>
  );
}
