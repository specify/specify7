/**
 * Force export feed update
 */

import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';

export function ForceUpdateFeedOverlay(): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const handleClose = React.useContext(OverlayContext);
  const [isActivated, handleActivated, handleDeactivated] = useBooleanState();

  return isActivated ? (
    <Dialog
      buttons={commonText.close()}
      header={headerText.feedExportStarted()}
      onClose={handleClose}
    >
      {headerText.feedExportStartedDescription()}
    </Dialog>
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Info
            onClick={(): void =>
              loading(
                ping('/export/force_update/', {
                  method: 'POST',
                  errorMode: 'dismissible',
                })
                  .then(handleActivated)
                  .catch(handleDeactivated)
              )
            }
          >
            {commonText.update()}
          </Button.Info>
        </>
      }
      header={headerText.updateExportFeedConfirmation()}
      onClose={handleClose}
    >
      {headerText.updateExportFeedConfirmationDescription()}
    </Dialog>
  );
}
