/**
 * Force export feed update
 */

import React from 'react';

import { ping } from '../../ajax';
import { commonText } from '../../localization/common';
import { hasPermission } from '../../permissionutils';
import { Button } from '../basic';
import { LoadingContext } from '../contexts';
import { ErrorBoundary } from '../errorboundary';
import { useBooleanState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';

function ForceUpdateFeed({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('updateExportFeed'));
  const loading = React.useContext(LoadingContext);
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

export const userTool: UserTool = {
  task: 'force-update-feed',
  title: commonText('updateExportFeed'),
  enabled: () => hasPermission('/export/feed', 'force_update'),
  isOverlay: true,
  view: ({ onClose: handleClose }) => (
    <ErrorBoundary dismissable>
      <ForceUpdateFeed onClose={handleClose} />
    </ErrorBoundary>
  ),
  groupLabel: commonText('export'),
};
