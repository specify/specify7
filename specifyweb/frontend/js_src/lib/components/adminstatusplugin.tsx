import React from 'react';

import { ajax } from '../ajax';
import type { SpecifyUser } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import type { FormMode } from '../parseform';
import { userInformation } from '../userinfo';
import { Button } from './basic';
import { useBooleanState } from './hooks';
import { LoadingScreen } from './modaldialog';
import { useResource } from './resource';

export function AdminStatusPlugin({
  user: resource,
  mode,
  id,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly mode: FormMode;
  readonly id: string | undefined;
}): JSX.Element {
  const [isLoading, handeLoading, handleLoaded] = useBooleanState();
  const [user, setUser] = useResource(resource);
  const isCurrentUser = userInformation.id === user.id;

  return (
    <>
      {isLoading && <LoadingScreen />}
      <Button.Simple
        id={id}
        disabled={
          mode === 'view' ||
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
        onClick={(): void => {
          handeLoading();
          ajax<'true' | 'false'>(`/api/set_admin_status/${user.id}/`, {
            method: 'POST',
            body: {
              admin_status: !user.isAdmin,
            },
            headers: {
              Accept: 'text/plain',
            },
          })
            .then(({ data }) =>
              setUser({
                ...user,
                isAdmin: data === 'true',
              })
            )
            .finally(handleLoaded);
        }}
      >
        {user.isAdmin ? adminText('removeAdmin') : adminText('makeAdmin')}
      </Button.Simple>
    </>
  );
}
