import React from 'react';

import { ajax } from '../ajax';
import type { SpecifyUser } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import type { FormMode } from '../parseform';
import { hasPermission } from '../permissions';
import { userInformation } from '../userinfo';
import { Button } from './basic';
import { LoadingContext } from './contexts';
import { useResource } from './resource';

export function AdminStatusPlugin({
  user: resource,
  mode,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly mode: FormMode;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [user, setUser] = useResource(resource);
  const isCurrentUser = userInformation.id === user.id;

  return (
    <Button.Simple
      className="w-fit"
      disabled={
        mode === 'view' ||
        !hasPermission('/admin/user/sp6/is_admin', 'update') ||
        resource.isNew() ||
        user.userType != 'Manager' ||
        (user.isAdmin && isCurrentUser)
      }
      title={
        resource.isNew()
          ? adminText('saveUserFirst')
          : user.isAdmin && isCurrentUser
          ? adminText('canNotRemoveYourself')
          : user.userType === 'Manager'
          ? undefined
          : adminText('mustBeManager')
      }
      onClick={(): void =>
        loading(
          ajax<'true' | 'false'>(`/api/set_admin_status/${user.id}/`, {
            method: 'POST',
            body: {
              admin_status: !user.isAdmin,
            },
            headers: {
              Accept: 'text/plain',
            },
          }).then(({ data }) =>
            setUser({
              ...user,
              isAdmin: data === 'true',
            })
          )
        )
      }
    >
      {user.isAdmin ? adminText('removeAdmin') : adminText('makeAdmin')}
    </Button.Simple>
  );
}
