import { wbText } from '../../localization/workbench';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { ping } from '../../utils/ajax/ping';
import React from 'react';
import { LoadingContext } from '../Core/Contexts';

export function RollbackConfirmation({
  dataSetId,
  onClose: handleClose,
  onRollback: handleRollback,
}: {
  readonly dataSetId: number;
  readonly onClose: () => void;
  readonly onRollback: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <Dialog
      header={wbText('rollbackDialogHeader')}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Red
            onClick={() =>
              loading(
                ping(`/api/workbench/unupload/${dataSetId}/`, {
                  method: 'POST',
                })
                  .then(handleRollback)
                  .finally(handleClose)
              )
            }
          >
            {wbText('rollback')}
          </Button.Red>
        </>
      }
    >
      {wbText('rollbackDialogText')}
    </Dialog>
  );
}
