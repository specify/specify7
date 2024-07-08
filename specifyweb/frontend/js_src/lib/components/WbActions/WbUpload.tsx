import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { Button } from '../Atoms/Button';
import { Dialog } from '../Molecules/Dialog';
import type { WbCellCounts } from '../WorkBench/CellMeta';
import type { WbMapping } from '../WorkBench/mapping';
import type { WbStatus } from '../WorkBench/WbView';

export function WbUpload({
  hasUnsavedChanges,
  mappings,
  openNoUploadPlan,
  startUpload,
  cellCounts,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly mappings: WbMapping | undefined;
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
      <Button.Small
        aria-haspopup="dialog"
        disabled={hasUnsavedChanges || cellCounts.invalidCells > 0}
        title={
          hasUnsavedChanges
            ? wbText.unavailableWhileEditing()
            : cellCounts.invalidCells > 0
              ? wbText.uploadUnavailableWhileHasErrors()
              : undefined
        }
        onClick={handleUpload}
      >
        {wbText.upload()}
      </Button.Small>
      {showUpload && (
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
      )}
    </>
  );
}
