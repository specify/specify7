import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { overwriteReadOnly } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import type { Workbench } from '../WorkBench/WbView';

export const handleWorkbenchSave = async (
  workbench: Workbench,
  searchRef: React.MutableRefObject<HTMLInputElement | null>,
  checkDeletedFail: (statusCode: number) => void,
  handleSpreadsheetUpToDate: () => void,
) => {
  // Clear validation
  overwriteReadOnly(workbench.dataset, 'rowresults', null);
  workbench.validation.stopLiveValidation();

  // Send data
  ping(`/api/workbench/rows/${workbench.dataset.id}/`, {
    method: 'PUT',
    body: workbench.data,
    expectedErrors: [Http.NO_CONTENT, Http.NOT_FOUND],
  })
    .then((status) => checkDeletedFail(status))
    .then(() => {
      handleSpreadsheetUpToDate();
      workbench.cells.cellMeta = [];
      workbench.utils?.searchCells(
        { key: 'SettingsChange' },
        searchRef.current
      );
      workbench.hot?.render();
    });
};

export function WbSave({
  workbench,
  hasUnsavedChanges,
  checkDeletedFail,
  searchRef,
  onSpreadsheetUpToDate: handleSpreadsheetUpToDate,
}: {
  readonly workbench: Workbench;
  readonly hasUnsavedChanges: boolean;
  readonly searchRef: React.MutableRefObject<HTMLInputElement | null>;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly onSpreadsheetUpToDate: () => void;
}): JSX.Element {
  const [showProgressBar, openProgressBar, closeProgressBar] =
    useBooleanState();

  const handleSave = async (): Promise<void> => {
    // Show saving progress bar
    openProgressBar();

    await handleWorkbenchSave(
      workbench,
      searchRef,
      checkDeletedFail,
      handleSpreadsheetUpToDate,
    );

    closeProgressBar();
  }

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        disabled={!hasUnsavedChanges}
        variant={className.saveButton}
        onClick={handleSave}
      >
        {commonText.save()}
      </Button.Small>
      {showProgressBar && (
        <Dialog
          buttons={undefined}
          header={wbText.saving()}
          onClose={closeProgressBar}
        >
          {loadingBar}
        </Dialog>
      )}
    </>
  );
}
