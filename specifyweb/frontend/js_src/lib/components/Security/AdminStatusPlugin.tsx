/**
 * Set whether user is a super admin in Specify 6.
 * This does not affect Specify 7
 */

import React from 'react';

import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers.js';
import type { SpecifyUser } from '../DataModel/types.js';
import type { SpecifyResource } from '../DataModel/legacyTypes.js';
import { adminText } from '../../localization/admin.js';
import { hasPermission } from '../Permissions/helpers.js';
import { userInformation } from '../InitialContext/userInformation.js';
import { Button } from '../Atoms/Basic.js';
import { LoadingContext } from '../Core/Contexts.js';
import { useResource } from '../../hooks/resource.js';

export function AdminStatusPlugin({
  user: resource,
  isAdmin,
  onChange: handleChange,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly isAdmin: boolean;
  readonly onChange: (isAdmin: boolean) => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [user] = useResource(resource);
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
        (isAdmin && isCurrentUser)
      }
      title={
        resource.isNew()
          ? adminText('saveUserFirst')
          : isAdmin && isCurrentUser
          ? adminText('canNotRemoveYourself')
          : user.userType === 'Manager'
          ? undefined
          : adminText('mustBeManager')
      }
      onClick={(): void =>
        loading(
          ajax<'false' | 'true'>(`/api/set_admin_status/${user.id}/`, {
            method: 'POST',
            body: formData({
              admin_status: !isAdmin,
            }),
            headers: {
              Accept: 'text/plain',
            },
          }).then(({ data }) => handleChange(data === 'true'))
        )
      }
    >
      {isAdmin ? adminText('removeAdmin') : adminText('makeAdmin')}
    </Button.Small>
  );
}
