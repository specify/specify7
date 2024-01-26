import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';

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
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Danger
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
