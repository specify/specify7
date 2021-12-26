import React from 'react';

import type { Schema } from '../../legacytypes';
import commonText from '../../localization/common';
import navigation from '../../navigation';
import schema from '../../schema';
import userInfo from '../../userinfo';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import type { IR } from '../wbplanview';

type Props = {
  readonly onClose: () => void;
};

function Users({ onClose: handleClose }: Props): JSX.Element {
  const [users, setUsers] = React.useState<IR<string> | undefined>(undefined);

  React.useEffect(() => {
    const users = new (
      schema as unknown as Schema
    ).models.SpecifyUser.LazyCollection({
      filters: { orderby: 'name' },
    });
    users
      .fetch({ limit: 0 })
      .done(() =>
        destructorCalled
          ? undefined
          : setUsers(
              Object.fromEntries(
                users.models.map((user) => [user.get('name'), user.viewUrl()])
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
            click: () => {
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

const View = createBackboneView<Props>({
  moduleName: 'UsersView',
  className: 'users-view',
  component: Users,
});

const userTool: UserTool = {
  task: 'users',
  title: commonText('manageUsers'),
  view: ({ onClose }) => new View({ onClose }),
  enabled: () => userInfo.isadmin,
};

export default userTool;
