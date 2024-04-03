import React from 'react';

import type { WbMapping } from '../mapping';
import type { WbStatus } from '../WbView';
import { useBooleanState } from '../../../hooks/useBooleanState';
import { Button } from '../../Atoms/Button';
import { Dialog } from '../../Molecules/Dialog';
import { wbText } from '../../../localization/workbench';
import { commonText } from '../../../localization/common';

export function WbUpload({
  hasUnsavedChanges,
  mappings,
  openNoUploadPlan,
  startUpload,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly mappings: WbMapping;
  readonly openNoUploadPlan: () => void;
  readonly startUpload: (mode: WbStatus) => void;
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
        onClick={handleUpload}
        disabled={hasUnsavedChanges}
        title={hasUnsavedChanges ? wbText.unavailableWhileEditing() : ''}
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
    </>
  );
}
