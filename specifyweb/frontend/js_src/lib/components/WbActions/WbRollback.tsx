import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { WbStatus } from '../WorkBench/WbView';

export function WbRollback({
  datasetId,
  triggerStatusComponent,
}: {
  readonly datasetId: number;
  readonly triggerStatusComponent: (mode: WbStatus) => void;
}): JSX.Element {
  const [confirmRollback, handleOpen, handleClose] = useBooleanState();

  const handleRollback = () => triggerStatusComponent('unupload');

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={confirmRollback}
        onClick={handleOpen}
      >
        {wbText.rollback()}
      </Button.Small>
      {confirmRollback && (
        <RollbackConfirmation
          datasetId={datasetId}
          onClose={handleClose}
          onRollback={handleRollback}
        />
      )}
    </>
  );
}

function RollbackConfirmation({
  datasetId,
  onClose: handleClose,
  onRollback: handleRollback,
}: {
  readonly datasetId: number;
  readonly onClose: () => void;
  readonly onRollback: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Danger
            onClick={() =>
              loading(
                ping(`/api/workbench/unupload/${datasetId}/`, {
                  method: 'POST',
                })
                  .then(handleRollback)
                  .finally(handleClose)
              )
            }
          >
            {wbText.rollback()}
          </Button.Danger>
        </>
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={wbText.beginRollback()}
      onClose={handleClose}
    >
      {wbText.beginRollbackDescription()}
    </Dialog>
  );
}
