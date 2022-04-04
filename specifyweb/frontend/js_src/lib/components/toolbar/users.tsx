import React from 'react';

import { fetchCollection } from '../../collection';
import commonText from '../../localization/common';
import * as navigation from '../../navigation';
import { getResourceViewUrl } from '../../resource';
import type { IR } from '../../types';
import { Button, Link, Ul } from '../basic';
import { useAsyncState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog, dialogClassNames } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { hasTablePermission } from '../../permissions';

function Users({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element | null {
  useTitle(commonText('manageUsers'));
  const [users] = useAsyncState<IR<string>>(
    React.useCallback(
      async () =>
        fetchCollection('SpecifyUser', { orderBy: 'name', limit: 0 }).then(
          ({ records }) =>
            Object.fromEntries(
              records.map((user) => [
                user.name,
                getResourceViewUrl('SpecifyUser', user.id),
              ])
            )
        ),
      []
    ),
    true
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
            <Link.Default href={viewUrl}>{userName}</Link.Default>
          </li>
        ))}
      </Ul>
    </Dialog>
  ) : null;
}

const View = createBackboneView(Users);

const userTool: UserTool = {
  task: 'users',
  title: commonText('manageUsers'),
  isOverlay: true,
  view: ({ onClose }) => new View({ onClose }),
  enabled: () =>
    hasTablePermission('SpecifyUser', 'update') ||
    hasTablePermission('SpecifyUser', 'create'),
  groupLabel: commonText('administration'),
};

export default userTool;
