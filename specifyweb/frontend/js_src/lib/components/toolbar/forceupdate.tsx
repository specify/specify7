import React from 'react';

import ajax from '../../ajax';
import commonText from '../../localization/common';
import userInfo from '../../userinfo';
import { Button } from '../basic';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog, LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

function ForceUpdateFeed({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('updateExportFeed'));
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isActivated, setIsActivated] = React.useState<boolean>(false);

  return isActivated ? (
    <Dialog
      title={commonText('feedExportStartedDialogTitle')}
      header={commonText('feedExportStartedDialogHeader')}
      onClose={handleClose}
    >
      {commonText('feedExportStartedDialogMessage')}
    </Dialog>
  ) : isLoading ? (
    <LoadingScreen />
  ) : (
    <Dialog
      title={commonText('updateExportFeedDialogTitle')}
      header={commonText('updateExportFeedDialogHeader')}
      onClose={handleClose}
      buttons={[
        'cancel',
        <Button.Blue
          key="button"
          onClick={(): void => {
            setIsLoading(true);
            ajax('/export/force_update/', {
              method: 'POST',
            })
              .then(() => setIsActivated(true))
              .catch(() => setIsActivated(false))
              .finally(() => setIsLoading(false));
          }}
        >
          {commonText('update')}
        </Button.Blue>,
      ]}
    >
      {commonText('updateExportFeedDialogMessage')}
    </Dialog>
  );
}

const View = createBackboneView(ForceUpdateFeed);

const userTool: UserTool = {
  task: 'force-update-feed',
  title: commonText('updateExportFeed'),
  enabled: () => userInfo.isadmin,
  view: ({ onClose }) => new View({ onClose }),
};

export default userTool;
