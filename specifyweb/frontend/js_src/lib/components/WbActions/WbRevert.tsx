import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { wbText } from '../../localization/workbench';
import { commonText } from '../../localization/common';
import { Dialog } from '../Molecules/Dialog';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

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
        onClick={openRevert}
        disabled={!hasUnsavedChanges}
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
