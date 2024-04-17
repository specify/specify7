import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { Button } from '../Atoms/Button';
import { Dialog } from '../Molecules/Dialog';

export function WbRevert({
  hasUnsavedChanges,
  onRefresh: handleRefresh,
  onSpreadsheetUpToDate: handleSpreadsheetUpToDate,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly onRefresh: () => void;
  readonly onSpreadsheetUpToDate: () => void;
}): JSX.Element {
  const [showRevert, openRevert, closeRevert] = useBooleanState();

  const handleRevert = () => {
    handleRefresh();
    closeRevert();
    handleSpreadsheetUpToDate();
  };

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        disabled={!hasUnsavedChanges}
        onClick={openRevert}
      >
        {wbText.revert()}
      </Button.Small>
      {showRevert && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Danger onClick={handleRevert}>
                {wbText.revert()}
              </Button.Danger>
            </>
          }
          header={wbText.revertChanges()}
          onClose={closeRevert}
        >
          {wbText.revertChangesDescription()}
        </Dialog>
      )}
    </>
  );
}
