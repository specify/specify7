import React from 'react';

import ajax from '../../ajax';
import commonText from '../../localization/common';
import userInfo from '../../userinfo';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

type Props = {
  readonly onClose: () => void;
};

function ForceUpdateFeed({ onClose: handleClose }: Props): JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isActivated, setIsActivated] = React.useState<boolean>(false);

  return isActivated ? (
    <ModalDialog
      properties={{
        title: commonText('feedExportStartedDialogTitle'),
        close: handleClose,
      }}
    >
      {commonText('feedExportStartedDialogHeader')}
      <p>{commonText('feedExportStartedDialogMessage')}</p>
    </ModalDialog>
  ) : isLoading ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      properties={{
        title: commonText('updateExportFeedDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('update'),
            click(): void {
              setIsLoading(true);
              ajax('/export/force_update/', {
                method: 'POST',
              })
                .then(() => setIsActivated(true))
                .catch(() => setIsActivated(false))
                .finally(() => setIsLoading(false));
            },
          },
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
        ],
      }}
    >
      {commonText('updateExportFeedDialogHeader')}
      <p>{commonText('updateExportFeedDialogMessage')}</p>
    </ModalDialog>
  );
}

const View = createBackboneView<Props>({
  moduleName: 'ForceUpdateFeed',
  className: 'force-update-feed',
  component: ForceUpdateFeed,
});

const userTool: UserTool = {
  task: 'force-update-feed',
  title: commonText('updateExportFeed'),
  enabled: () => userInfo.isadmin,
  view: ({ onClose }) => new View({ onClose }),
};

export default userTool;
