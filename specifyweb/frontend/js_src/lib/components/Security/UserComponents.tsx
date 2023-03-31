import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { replaceItem, replaceKey, sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { getField } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpecifyUser } from '../DataModel/types';
import { Combobox } from '../FormFields/ComboBox';
import type { FormMode } from '../FormParse';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { AdminStatusPlugin } from './AdminStatusPlugin';
import type { RoleBase } from './Collection';
import { useAdmins } from './Institution';
import type { Policy } from './Policy';
import type { Role } from './Role';
import { UserCollections } from './UserCollections';
import { anyResource } from './utils';

export function SetSuperAdmin({
  institutionPolicies,
  isSuperAdmin,
  isCurrentUser,
  allActions,
  onChange: handleChange,
}: {
  readonly institutionPolicies: RA<Policy> | undefined;
  readonly isSuperAdmin: boolean;
  readonly isCurrentUser: boolean;
  readonly allActions: RA<string>;
  readonly onChange: (value: RA<Policy>) => void;
}): JSX.Element {
  return typeof institutionPolicies === 'object' ? (
    <Label.Inline>
      <Input.Checkbox
        checked={isSuperAdmin}
        isReadOnly={!userInformation.isadmin || isCurrentUser}
        onValueChange={(): void => {
          if (isSuperAdmin)
            handleChange(
              filterArray(
                institutionPolicies.filter(
                  (policy) => policy.resource !== anyResource
                )
              )
            );
          else {
            const index = institutionPolicies.findIndex(
              ({ resource }) => resource === anyResource
            );
            handleChange(
              index === -1
                ? [
                    ...institutionPolicies,
                    {
                      resource: anyResource,
                      actions: allActions,
                    },
                  ]
                : replaceItem(
                    institutionPolicies,
                    index,
                    replaceKey(
                      institutionPolicies[index],
                      'actions',
                      allActions
                    )
                  )
            );
          }
        }}
      />
      {userText.institutionAdmin()}
    </Label.Inline>
  ) : (
    <>{commonText.loading()}</>
  );
}

export function UserRoles({
  collectionRoles,
  collectionId,
  userRoles,
  onChange: handleChange,
  isReadOnly,
}: {
  readonly collectionRoles: RR<number, RA<Role> | undefined> | undefined;
  readonly collectionId: number;
  readonly userRoles: IR<RA<RoleBase> | undefined> | undefined;
  readonly onChange: (value: IR<RA<RoleBase> | undefined>) => void;
  readonly isReadOnly?: boolean;
}): JSX.Element | null {
  return typeof userRoles !== 'object' ||
    typeof userRoles[collectionId] === 'object' ? (
    <fieldset className="flex flex-col gap-2">
      <legend>
        <span className="text-xl">{userText.assignedUserRoles()}</span>
      </legend>
      <Ul className="flex flex-col gap-1 pl-2">
        {typeof collectionRoles === 'object' && typeof userRoles === 'object'
          ? collectionRoles[collectionId]?.map((role) => (
              <li className="flex items-center gap-2" key={role.id}>
                <Label.Inline>
                  <Input.Checkbox
                    checked={userRoles?.[collectionId]?.some(
                      ({ roleId }) => roleId === role.id
                    )}
                    disabled={
                      !Array.isArray(userRoles?.[collectionId]) || isReadOnly
                    }
                    onValueChange={(): void =>
                      handleChange(
                        replaceKey(
                          userRoles,
                          collectionId.toString(),
                          f
                            .maybe(userRoles[collectionId], (roles) =>
                              roles.some(({ roleId }) => roleId === role.id)
                                ? roles.filter(
                                    ({ roleId }) => roleId !== role.id
                                  )
                                : [
                                    ...roles,
                                    {
                                      roleId: role.id,
                                      roleName: role.name,
                                    },
                                  ]
                            )
                            /*
                             * Sort all roles by ID, so that can easier detect if user roles changed
                             * Since last save
                             */
                            ?.sort(sortFunction(({ roleId }) => roleId))
                        )
                      )
                    }
                  />
                  {role.name}
                </Label.Inline>
                <Link.Icon
                  aria-label={commonText.edit()}
                  className={className.dataEntryEdit}
                  href={`/specify/security/collection/${collectionId}/role/${role.id}/`}
                  icon="pencil"
                  title={commonText.edit()}
                />
              </li>
            )) ??
            userRoles[collectionId]!.map(({ roleId, roleName }) => (
              <li key={roleId}>{roleName}</li>
            ))
          : commonText.loading()}
      </Ul>
    </fieldset>
  ) : null;
}

/**
 * A dialog that sets as a reminder to set a password
 */
export function SetPasswordPrompt({
  onClose: handleClose,
  onSet: handleSet,
  onIgnore: handleIgnore,
}: {
  readonly onClose: () => void;
  readonly onSet: () => void;
  readonly onIgnore: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.Red onClick={handleIgnore}>{commonText.ignore()}</Button.Red>
          <Button.Green onClick={handleSet}>
            {userText.setPassword()}
          </Button.Green>
        </>
      }
      header={userText.setPassword()}
      onClose={handleClose}
    >
      {userText.setPasswordBeforeSavePrompt()}
    </Dialog>
  );
}

export function UserIdentityProviders({
  identityProviders,
}: {
  readonly identityProviders: IR<boolean> | undefined;
}): JSX.Element | null {
  return identityProviders === undefined ||
    Object.entries(identityProviders).length === 0 ? null : (
    <fieldset className="flex flex-col gap-2">
      <legend>{userText.externalIdentityProviders()}</legend>
      <Ul className="flex flex-col gap-1 pl-2">
        {Object.entries(identityProviders).map(([title, isEnabled], index) => (
          <li key={index}>
            <Label.Inline>
              <Input.Checkbox checked={isEnabled} isReadOnly />
              {title}
            </Label.Inline>
          </li>
        ))}
      </Ul>
    </fieldset>
  );
}

export function LegacyPermissions({
  userResource,
  mode,
}: {
  readonly userResource: SpecifyResource<SpecifyUser>;
  readonly mode: FormMode;
}): JSX.Element {
  const admins = useAdmins();
  const [isAdmin, setIsAdmin] = useLiveState(
    React.useCallback(
      () => admins?.legacyAdmins.has(userResource.id) === true,
      [admins, userResource.id]
    )
  );
  const userType = getField(schema.models.SpecifyUser, 'userType');
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xl">{userText.legacyPermissions()}</h4>
      {hasPermission('/permissions/list_admins', 'read') && (
        <div className="flex gap-2">
          <AdminStatusPlugin
            isAdmin={isAdmin}
            user={userResource}
            onChange={setIsAdmin}
          />
          {hasPermission('/admin/user/sp6/collection_access', 'read') &&
          hasTablePermission('Collection', 'read') ? (
            <UserCollections isAdmin={isAdmin} user={userResource} />
          ) : undefined}
        </div>
      )}
      <Label.Block
        className={className.limitedWidth}
        title={userType.getLocalizedDesc()}
      >
        {userType.label}
        <Combobox
          defaultValue={undefined}
          field={userType}
          id={undefined}
          isDisabled={false}
          isRequired
          mode={mode}
          model={userResource}
          pickListName={defined(
            userType.getPickList(),
            'UserType pick list not found'
          )}
          resource={userResource}
        />
      </Label.Block>
    </section>
  );
}
