/**
 * Force export feed update
 */

import React from 'react';

import { ping } from '../../ajax';
import { commonText } from '../../localization/common';
import { hasPermission } from '../../permissions';
import { Button } from '../basic';
import { LoadingContext } from '../contexts';
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
      title={commonText('feedExportStartedDialogTitle')}
      header={commonText('feedExportStartedDialogHeader')}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      {commonText('feedExportStartedDialogText')}
    </Dialog>
  ) : (
    <Dialog
      title={commonText('updateExportFeedDialogTitle')}
      header={commonText('updateExportFeedDialogHeader')}
      onClose={handleClose}
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
  view: ({ onClose: handleClose }) => <ForceUpdateFeed onClose={handleClose} />,
  groupLabel: commonText('export'),
};
