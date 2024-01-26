/**
 * Set whether user is a super admin in Specify 6.
 * This does not affect Specify 7
 */

import React from 'react';

import { useResource } from '../../hooks/resource';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyUser } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { hasPermission } from '../Permissions/helpers';

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
        user.userType !== 'Manager' ||
        // Can't remove admin status from yourself
        (isAdmin && isCurrentUser)
      }
      title={
        resource.isNew()
          ? userText.saveUserFirst()
          : isAdmin && isCurrentUser
          ? userText.canNotRemoveYourself()
          : user.userType === 'Manager'
          ? undefined
          : userText.mustBeManager()
      }
      onClick={(): void =>
        loading(
          ajax<'false' | 'true'>(`/api/set_admin_status/${user.id}/`, {
            method: 'POST',
            body: formData({
              admin_status: !isAdmin,
            }),
            errorMode: 'dismissible',
            headers: {
              Accept: 'text/plain',
            },
          }).then(({ data }) => handleChange(data === 'true'))
        )
      }
    >
      {isAdmin ? userText.removeAdmin() : userText.makeAdmin()}
    </Button.Small>
  );
}
