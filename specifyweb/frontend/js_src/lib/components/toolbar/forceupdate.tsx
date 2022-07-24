/**
 * Force export feed update
 */

import React from 'react';

import { ping } from '../../ajax';
import { commonText } from '../../localization/common';
import { Button } from '../basic';
import { LoadingContext } from '../contexts';
import { useBooleanState } from '../hooks';
import { Dialog } from '../modaldialog';
import {OverlayContext} from '../router';

export function ForceUpdateFeedOverlay(): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const handleClose = React.useContext(OverlayContext);
  const [isActivated, handleActivated, handleDeactivated] = useBooleanState();

  return isActivated ? (
    <Dialog
      buttons={commonText('close')}
      header={commonText('feedExportStartedDialogHeader')}
      onClose={handleClose}
    >
      {commonText('feedExportStartedDialogText')}
    </Dialog>
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Blue
            onClick={(): void =>
              loading(
                ping('/export/force_update/', {
                  method: 'POST',
                })
                  .then(handleActivated)
                  .catch(handleDeactivated)
              )
            }
          >
            {commonText('update')}
          </Button.Blue>
        </>
      }
      header={commonText('updateExportFeedDialogHeader')}
      onClose={handleClose}
    >
      {commonText('updateExportFeedDialogText')}
    </Dialog>
  );
}
