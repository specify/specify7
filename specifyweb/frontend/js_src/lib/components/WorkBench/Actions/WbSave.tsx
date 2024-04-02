import React from 'react';

import { useBooleanState } from '../../../hooks/useBooleanState';
import { Button } from '../../Atoms/Button';
import { className } from '../../Atoms/className';
import { Dialog } from '../../Molecules/Dialog';
import { commonText } from '../../../localization/common';
import { wbText } from '../../../localization/workbench';
import { loadingBar } from '../../Molecules';
import { Workbench } from '../WbView';
import { overwriteReadOnly } from '../../../utils/types';
import { ping } from '../../../utils/ajax/ping';
import { Http } from '../../../utils/ajax/definitions';

export function WbSave({
  workbench,
  hasUnSavedChanges,
  checkDeletedFail,
  spreadSheetUpToDate,
}: {
  readonly workbench: Workbench;
  readonly hasUnSavedChanges: boolean;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly spreadSheetUpToDate: () => void;
}): JSX.Element {
  const [showProgressBar, openProgressBar, closeProgressBar] =
    useBooleanState();

  const handleSave = () => {
    // Clear validation
    overwriteReadOnly(workbench.dataset, 'rowresults', null);
    workbench.validation.stopLiveValidation();
    // TODO: figure out what to do in updateValidationButton
    workbench.validation.updateValidationButton();

    // Show saving progress bar
    openProgressBar();

    // Send data
    ping(`/api/workbench/rows/${workbench.dataset.id}/`, {
      method: 'PUT',
      body: workbench.data,
      expectedErrors: [Http.NO_CONTENT, Http.NOT_FOUND],
    })
      .then((status) => checkDeletedFail(status))
      .then(() => {
        spreadSheetUpToDate();
        workbench.cells.cellMeta = [];
        // TODO: Figure out how to rework searchCells for SettingsChange as input
        // workbench.utils?.searchCells({ key: 'SettingsChange' });
        workbench.hot.render();
        closeProgressBar();
      });
  };

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        className="wb-save"
        variant={className.saveButton}
        onClick={handleSave}
        disabled={!hasUnSavedChanges}
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
