import React from 'react';

import { ajax } from '../../utils/ajax';
import type { SpecifyUser } from '../DataModel/types';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { hasPermission } from '../Permissions/helpers';
import type { IR } from '../../utils/types';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import {SerializedResource} from '../DataModel/helperTypes';
import {CopyButton} from '../Molecules/Copy';

/**
 * Generate an invite link for a given user to connect their Specify account to
 * a third party identity provider
 */
export function UserInviteLink({
  user,
  identityProviders,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly identityProviders: IR<boolean> | undefined;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [link, setLink] = React.useState<string | undefined>(undefined);
  const hasProvidersConfigured =
    /*
     * If user can't read the list of configured identity providers, we can't check
     * if any are configured and have to just assume so
     */
    !hasPermission('/admin/user/oic_providers', 'read') &&
    Object.keys(identityProviders ?? {}).length > 0;

  return (
    <>
      <Button.Small
        disabled={identityProviders === undefined}
        onClick={(): void =>
          hasProvidersConfigured
            ? loading(
                ajax(`/accounts/invite_link/${user.id}/`, {
                  headers: { Accept: 'text/plain' },
                }).then(({ data }) => setLink(data))
              )
            : setLink('')
        }
      >
        {adminText('createInviteLink')}
      </Button.Small>
      {typeof link === 'string' && (
        <Dialog
          buttons={commonText('close')}
          header={adminText('userInviteLinkDialogHeader')}
          onClose={(): void => setLink(undefined)}
        >
          {hasProvidersConfigured ? (
            <>
              {adminText('userInviteLinkDialogText', user.name)}
              <div className="flex gap-2">
                <Input.Text
                  className="flex-1 !cursor-pointer"
                  isReadOnly
                  value={link}
                />
                <CopyButton text={link} />
              </div>
            </>
          ) : (
            adminText('userInviteLinkInvalidDialogText')
          )}
        </Dialog>
      )}
    </>
  );
}
