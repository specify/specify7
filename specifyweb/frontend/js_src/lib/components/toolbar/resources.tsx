import React from 'react';

import commonText from '../../localization/common';
import userInfo from '../../userinfo';
import { Link } from '../basic';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import { closeDialog, JqueryDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

function AppResourceDialog({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('resources'));

  return (
    <JqueryDialog
      properties={{
        title: commonText('resourcesDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
        ],
      }}
    >
      {commonText('resourcesDialogHeader')}
      <nav>
        <Link href="/specify/appresources/" className="intercept-navigation">
          {commonText('appResources')}
        </Link>
        <br />
        <Link href="/specify/viewsets/" className="intercept-navigation">
          {commonText('viewSets')}
        </Link>
      </nav>
    </JqueryDialog>
  );
}

const View = createBackboneView(AppResourceDialog);

const userTool: UserTool = {
  task: 'resources',
  title: commonText('resources'),
  view: ({ onClose }) => new View({ onClose }),
  enabled: () => userInfo.isadmin,
};

export default userTool;
