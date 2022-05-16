/**
 * Set whether user is a super admin in Specify 6.
 * This does not affect Specify 7
 */

import React from 'react';

import { ajax, formData } from '../ajax';
import type { SpecifyUser } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import { adminText } from '../localization/admin';
import { hasPermission } from '../permissions';
import { userInformation } from '../userinfo';
import { Button } from './basic';
import { LoadingContext } from './contexts';
import { useResource } from './resource';

export function AdminStatusPlugin({
  user: resource,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [user, setUser] = useResource(resource);
  const isCurrentUser = userInformation.id === user.id;

  return (
    <Button.Small
      className="w-fit"
      disabled={
        !hasPermission('/admin/user/sp6/is_admin', 'update') ||
        resource.isNew() ||
        // Only managers can be admins
        user.userType != 'Manager' ||
        // Can't remove admin status from yourself
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
            body: formData({
              admin_status: !user.isAdmin,
            }),
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
    </Button.Small>
  );
}
