import React from 'react';

import type { Collection, SpecifyUser } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import { replaceItem, replaceKey, sortFunction } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import type { FormMode } from '../FormParse';
import { collectionAccessResource } from '../Permissions';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { resourceOn } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { anyResource } from './utils';
import type { IR, RA, RR } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { AdminStatusPlugin } from './AdminStatusPlugin';
import { Ul } from '../Atoms';
import { Combobox } from '../FormFields/ComboBox';
import { useLiveState } from '../../hooks/hooks';
import { Dialog } from '../Molecules/Dialog';
import { QueryComboBox } from '../FormFields/QueryComboBox';
import type { RoleBase } from './Collection';
import { useAdmins } from './Institution';
import type { Policy } from './Policy';
import type { Role } from './Role';
import type { UserAgents } from './UserHooks';
import { UserCollections } from './UserCollections';
import { Input, Label, Select } from '../Atoms/Form';
import { className } from '../Atoms/className';
import { Link } from '../Atoms/Link';
import { Button } from '../Atoms/Button';

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
    <Label.ForCheckbox>
      <Input.Checkbox
        checked={isSuperAdmin}
        isReadOnly={!userInformation.isadmin || isCurrentUser}
        onValueChange={(): void =>
          handleChange(
            isSuperAdmin
              ? filterArray(
                  institutionPolicies.filter(
                    (policy) => policy.resource !== anyResource
                  )
                )
              : f.var(
                  institutionPolicies.findIndex(
                    ({ resource }) => resource === anyResource
                  ),
                  (index) =>
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
                )
          )
        }
      />
      {adminText('institutionAdmin')}
    </Label.ForCheckbox>
  ) : (
    <>{commonText('loading')}</>
  );
}

export function UserRoles({
  collectionRoles,
  collectionId,
  userRoles,
  onChange: handleChange,
}: {
  readonly collectionRoles: RR<number, RA<Role> | undefined> | undefined;
  readonly collectionId: number;
  readonly userRoles: IR<RA<RoleBase> | undefined> | undefined;
  readonly onChange: (value: IR<RA<RoleBase> | undefined>) => void;
}): JSX.Element | null {
  return typeof userRoles !== 'object' ||
    typeof userRoles[collectionId] === 'object' ? (
    <fieldset className="flex flex-col gap-2">
      <legend>
        <span className="text-xl">{adminText('assignedUserRoles')}</span>
      </legend>
      <Ul className="flex flex-col gap-1 pl-2">
        {typeof collectionRoles === 'object' && typeof userRoles === 'object'
          ? collectionRoles[collectionId]?.map((role) => (
              <li className="flex items-center gap-2" key={role.id}>
                <Label.ForCheckbox>
                  <Input.Checkbox
                    checked={userRoles?.[collectionId]?.some(
                      ({ roleId }) => roleId === role.id
                    )}
                    disabled={!Array.isArray(userRoles?.[collectionId])}
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
                </Label.ForCheckbox>
                <Link.Icon
                  aria-label={commonText('edit')}
                  className={className.dataEntryEdit}
                  href={`/specify/security/collection/${collectionId}/role/${role.id}/`}
                  icon="pencil"
                  title={commonText('edit')}
                />
              </li>
            )) ??
            defined(userRoles[collectionId]).map(({ roleId, roleName }) => (
              <li key={roleId}>{roleName}</li>
            ))
          : commonText('loading')}
      </Ul>
    </fieldset>
  ) : null;
}

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
          <Button.Red onClick={handleIgnore}>{commonText('ignore')}</Button.Red>
          <Button.Green onClick={handleSet}>
            {adminText('setPassword')}
          </Button.Green>
        </>
      }
      header={adminText('setPassword')}
      onClose={handleClose}
    >
      {adminText('setPasswordDialogText')}
    </Dialog>
  );
}

export function SetCollection({
  collectionId,
  collections,
  onChange: handleChange,
}: {
  readonly collectionId: number;
  readonly collections: RA<SerializedResource<Collection>>;
  readonly onChange: (collectionId: number) => void;
}): JSX.Element {
  return (
    <Label.Generic className={className.limitedWidth}>
      <span className="text-xl">{schema.models.Collection.label}</span>
      <Select
        value={collectionId}
        onValueChange={(value): void => handleChange(Number.parseInt(value))}
      >
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.collectionName}
          </option>
        ))}
      </Select>
    </Label.Generic>
  );
}

export function CollectionAccess({
  userPolicies,
  onChange: handleChange,
  onChangedAgent: handleChangeAgent,
  collectionId,
  userAgents,
  mode,
  isSuperAdmin,
}: {
  readonly userPolicies: IR<RA<Policy> | undefined> | undefined;
  readonly onChange: (
    userPolicies: IR<RA<Policy> | undefined> | undefined
  ) => void;
  readonly onChangedAgent: () => void;
  readonly collectionId: number;
  readonly userAgents: UserAgents | undefined;
  readonly mode: FormMode;
  readonly isSuperAdmin: boolean;
}): JSX.Element {
  const hasCollectionAccess =
    userPolicies?.[collectionId]?.some(
      ({ resource, actions }) =>
        resource === collectionAccessResource && actions.includes('access')
    ) ?? false;
  const collectionAddress = userAgents?.find(({ collections }) =>
    collections.includes(collectionId)
  )?.address;

  React.useEffect(
    () =>
      typeof collectionAddress === 'object'
        ? resourceOn(collectionAddress, 'change:parent', handleChangeAgent)
        : undefined,
    [collectionAddress, handleChangeAgent]
  );

  return (
    <div className="flex flex-col gap-4">
      {hasPermission('/permissions/policies/user', 'read', collectionId) &&
      !isSuperAdmin ? (
        <Label.ForCheckbox className={className.limitedWidth}>
          <Input.Checkbox
            checked={hasCollectionAccess}
            isReadOnly={
              !hasPermission(
                '/permissions/policies/user',
                'update',
                collectionId
              ) || userPolicies === undefined
            }
            onValueChange={(): void =>
              handleChange(
                typeof userPolicies === 'object'
                  ? replaceKey(
                      userPolicies,
                      collectionId.toString(),
                      hasCollectionAccess
                        ? defined(userPolicies[collectionId]).filter(
                            ({ resource }) =>
                              resource !== collectionAccessResource
                          )
                        : [
                            ...defined(userPolicies[collectionId]),
                            {
                              resource: collectionAccessResource,
                              actions: ['access'],
                            },
                          ]
                    )
                  : undefined
              )
            }
          />
          {adminText('collectionAccess')}
        </Label.ForCheckbox>
      ) : undefined}
      <Label.Generic className={className.limitedWidth}>
        {schema.models.Agent.label}
        {typeof collectionAddress === 'object' ? (
          <QueryComboBox
            fieldName="agent"
            forceCollection={collectionId}
            formType="form"
            id={undefined}
            isRequired={hasCollectionAccess || isSuperAdmin}
            mode={
              mode === 'view' || !hasPermission('/admin/user/agents', 'update')
                ? 'view'
                : 'edit'
            }
            relatedModel={schema.models.Agent}
            resource={collectionAddress}
            typeSearch={undefined}
          />
        ) : (
          <Input.Text disabled value={commonText('loading')} />
        )}
      </Label.Generic>
    </div>
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
      <legend>{adminText('externalIdentityProviders')}</legend>
      <Ul className="flex flex-col gap-1 pl-2">
        {Object.entries(identityProviders).map(([title, isEnabled], index) => (
          <li key={index}>
            <Label.ForCheckbox>
              <Input.Checkbox checked={isEnabled} isReadOnly />
              {title}
            </Label.ForCheckbox>
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
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xl">{adminText('legacyPermissions')}</h4>
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
      {f.var(
        defined(schema.models.SpecifyUser.getLiteralField('userType')),
        (userType) => (
          <Label.Generic
            className={className.limitedWidth}
            title={userType.getLocalizedDesc()}
          >
            {userType.label}
            <Combobox
              defaultValue={undefined}
              field={userType}
              fieldName={userType.name}
              formType="form"
              id={undefined}
              isDisabled={false}
              isRequired
              mode={mode}
              model={userResource}
              pickListName={undefined}
              resource={userResource}
            />
          </Label.Generic>
        )
      )}
    </section>
  );
}
