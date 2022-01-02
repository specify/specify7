import React from 'react';

import commonText from '../../localization/common';
import * as navigation from '../../navigation';
import schema from '../../schema';
import type { IR } from '../../types';
import userInfo from '../../userinfo';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

function Users({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('manageUsers'));
  const [users, setUsers] = React.useState<IR<string> | undefined>(undefined);

  React.useEffect(() => {
    const users = new schema.models.SpecifyUser.LazyCollection({
      filters: { orderby: 'name' },
    });
    users
      .fetch({ limit: 0 })
      .done(() =>
        destructorCalled
          ? undefined
          : setUsers(
              Object.fromEntries(
                users.models.map((user) => [
                  user.get('name') as string,
                  user.viewUrl(),
                ])
              )
            )
      );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);
  return typeof users === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      properties={{
        className: 'table-list-dialog',
        title: commonText('manageUsersDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('new'),
            click: (): void => {
              handleClose();
              navigation.go('view/specifyuser/new/');
            },
          },
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
        ],
      }}
    >
      <ul style={{ padding: 0 }}>
        {Object.entries(users).map(([userName, viewUrl]) => (
          <li key={userName}>
            <a
              className="fake-link intercept-navigation"
              href={viewUrl}
              style={{ fontSize: '0.8rem' }}
            >
              {userName}
            </a>
          </li>
        ))}
      </ul>
    </ModalDialog>
  );
}

const View = createBackboneView(Users);

const userTool: UserTool = {
  task: 'users',
  title: commonText('manageUsers'),
  view: ({ onClose }) => new View({ onClose }),
  enabled: () => userInfo.isadmin,
};

export default userTool;
