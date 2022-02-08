import React from 'react';

import commonText from '../../localization/common';
import * as navigation from '../../navigation';
import { schema } from '../../schema';
import type { IR } from '../../types';
import { useAsyncState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog, dialogClassNames, LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { Button, Link, Ul } from '../basic';
import { userInformation } from '../../userinfo';

function Users({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('manageUsers'));
  const [users] = useAsyncState<IR<string>>(
    React.useCallback(async () => {
      const users = new schema.models.SpecifyUser.LazyCollection({
        filters: { orderby: 'name' },
      });
      return users
        .fetchPromise({ limit: 0 })
        .then(({ models }) =>
          Object.fromEntries(
            models.map((user) => [user.get('name'), user.viewUrl()])
          )
        );
    }, [])
  );

  return typeof users === 'object' ? (
    <Dialog
      header={commonText('manageUsersDialogTitle')}
      onClose={handleClose}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Blue
            onClick={(): void => {
              handleClose();
              navigation.go('view/specifyuser/new/');
            }}
          >
            {commonText('new')}
          </Button.Blue>
        </>
      }
    >
      <Ul>
        {Object.entries(users).map(([userName, viewUrl]) => (
          <li key={userName}>
            <Link.Default className="intercept-navigation" href={viewUrl}>
              {userName}
            </Link.Default>
          </li>
        ))}
      </Ul>
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}

const View = createBackboneView(Users);

const userTool: UserTool = {
  task: 'users',
  title: commonText('manageUsers'),
  view: ({ onClose }) => new View({ onClose }),
  enabled: () => userInformation.isadmin,
};

export default userTool;
