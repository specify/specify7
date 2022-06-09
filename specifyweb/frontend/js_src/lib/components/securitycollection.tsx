import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import type { Collection } from '../datamodel';
import type { KeysToLowerCase, SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import {
  index,
  removeKey,
  replaceItem,
  replaceKey,
  sortFunction,
} from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { fetchResource, getResourceViewUrl } from '../resource';
import type { BackEndRole } from '../securityutils';
import {
  decompressPolicies,
  fetchRoles,
  processPolicies,
} from '../securityutils';
import type { IR, RA, RR } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, Link, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useLiveState, useTitle } from './hooks';
import { formatList } from './internationalization';
import { LoadingScreen } from './modaldialog';
import { SecurityImportExport } from './securityimportexport';
import type { NewRole, Role } from './securityrole';
import { RoleView } from './securityrole';
import { CreateRole } from './securityroletemplate';
import { schema } from '../schema';

export type RoleBase = {
  readonly roleId: number;
  readonly roleName: string;
};

export type UserRoles = RA<{
  readonly userId: number;
  readonly userName: string;
  readonly roles: RA<RoleBase>;
}>;

export function SecurityCollection({
  collection,
  collections,
  initialRoleId,
  onOpenUser: handleOpenUser,
  libraryRoles,
}: {
  readonly collection: SerializedResource<Collection>;
  readonly collections: RA<SerializedResource<Collection>>;
  readonly initialRoleId: number | undefined;
  readonly onOpenUser: (userId: number | undefined) => void;
  readonly libraryRoles: IR<Role> | undefined;
}): JSX.Element {
  const [roles, setRoles] = useAsyncState<IR<Role>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/roles', 'read', collection.id)
          ? fetchRoles(collection.id).then((roles) => index(defined(roles)))
          : undefined,
      [collection.id]
    ),
    false
  );

  const [usersWithPolicies] = useAsyncState<
    RA<{ readonly userId: number; readonly userName: string }>
  >(
    React.useCallback(
      () =>
        hasPermission('/permissions/policies/user', 'read', collection.id) &&
        hasTablePermission('SpecifyUser', 'read')
          ? ajax<RR<number, IR<RA<string>>>>(
              `/permissions/user_policies/${collection.id}/`,
              {
                headers: { Accept: 'application/json' },
              }
            ).then(({ data }) =>
              Promise.all(
                Object.keys(data)
                  .map((userId) => Number.parseInt(userId))
                  .map(async (userId) => ({
                    userId,
                    userName: await fetchResource('SpecifyUser', userId).then(
                      (resource) => defined(resource).name
                    ),
                  }))
              )
            )
          : [{ userId: userInformation.id, userName: userInformation.name }],
      [collection.id]
    ),
    false
  );

  const [userRoles, setUserRoles] = useAsyncState<UserRoles>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/user/roles', 'read', collection.id)
          ? ajax<RA<KeysToLowerCase<UserRoles[number]>>>(
              `/permissions/user_roles/${collection.id}/`,
              {
                method: 'GET',
                headers: { Accept: 'application/json' },
              }
            ).then(({ data }) =>
              data.map(({ userid, username, roles }) => ({
                userId: userid,
                userName: username,
                roles: roles.map(({ roleid, rolename }) => ({
                  roleId: roleid,
                  roleName: rolename,
                })),
              }))
            )
          : undefined,
      [collection.id]
    ),
    // Display loading screen while loading a role
    typeof initialRoleId === 'number'
  );

  // Combine users that have only policies or only roles together into one list
  const mergedUsers =
    typeof userRoles === 'object'
      ? [
          ...userRoles.filter(({ roles }) => roles.length > 0),
          ...(usersWithPolicies ?? [])
            .filter(({ userId }) =>
              userRoles.every(
                (user) => user.userId !== userId || user.roles.length === 0
              )
            )
            .map(({ userId, userName }) => ({
              userId,
              userName,
              roles: [],
            })),
        ].sort(sortFunction(({ userName }) => userName))
      : undefined;

  const [state, setState] = useLiveState<
    | State<'MainState'>
    | State<'CreatingRoleState'>
    | State<'LoadingRole'>
    | State<'RoleState', { readonly role: Role | NewRole }>
  >(
    React.useCallback(
      () =>
        typeof initialRoleId === 'number'
          ? ({
              type: 'LoadingRole',
              roleId: initialRoleId,
            } as const)
          : ({ type: 'MainState' } as const),
      // Close open role when collection changes
      [initialRoleId, collection.id]
    )
  );
  React.useEffect(() => {
    if (
      state.type === 'LoadingRole' &&
      typeof initialRoleId === 'number' &&
      typeof roles === 'object'
    )
      setState({
        type: 'RoleState',
        role: roles[initialRoleId],
      });
  }, [roles, state, initialRoleId, setState, userRoles]);
  const roleUsers = React.useMemo(
    () =>
      state.type === 'RoleState'
        ? userRoles?.filter(({ roles }) =>
            roles.some(({ roleId }) => roleId === state.role.id)
          )
        : undefined,
    [userRoles, state]
  );

  const updateRole = async (role: Role): Promise<void> =>
    ping(
      `/permissions/role/${role.id}/`,
      {
        method: 'PUT',
        body: {
          ...role,
          policies: decompressPolicies(role.policies),
        },
      },
      { expectedResponseCodes: [Http.NO_CONTENT] }
    ).then((): void =>
      setRoles(replaceKey(defined(roles), role.id.toString(), role))
    );

  const createRole = async (role: Role | NewRole): Promise<void> =>
    typeof role.id === 'number'
      ? setRoles((roles) => ({
          ...roles,
          [defined(role.id)]: {
            ...role,
          },
        }))
      : ajax<BackEndRole>(
          `/permissions/roles/${collection.id}/`,
          {
            method: 'POST',
            body: {
              ...removeKey(role, 'id'),
              policies: decompressPolicies(role.policies),
            },
            headers: { Accept: 'application/json' },
          },
          { expectedResponseCodes: [Http.CREATED] }
        ).then(({ data: role }) =>
          setRoles((roles) => ({
            ...roles,
            [role.id]: {
              ...role,
              policies: processPolicies(role.policies),
            },
          }))
        );

  useTitle(
    state.type === 'MainState'
      ? collection.collectionName ?? undefined
      : undefined
  );

  const loading = React.useContext(LoadingContext);
  return (
    <Container.Base className="flex-1 gap-6">
      {state.type === 'MainState' && (
        <>
          <div className="flex gap-2">
            <h3 className="text-xl">
              {`${schema.models.Collection.label}: ${
                collection.collectionName ?? ''
              }`}
            </h3>
            {hasTablePermission('Collection', 'read') && (
              <Link.Icon
                href={getResourceViewUrl('Collection', collection.id)}
                className={className.dataEntryEdit}
                icon="pencil"
                title={commonText('edit')}
                aria-label={commonText('edit')}
              />
            )}
          </div>
          <div className="flex flex-col flex-1 gap-6 overflow-y-scroll">
            {hasPermission('/permissions/roles', 'read', collection.id) && (
              <section className="flex flex-col gap-1">
                <div>
                  <h4 className={className.headerGray}>
                    {adminText('userRoles')}
                  </h4>
                  {typeof roles === 'object' ? (
                    <Ul>
                      {Object.values(roles).map((role) => (
                        <li key={role.id}>
                          <Button.LikeLink
                            onClick={(): void =>
                              setState({
                                type: 'RoleState',
                                role,
                              })
                            }
                          >
                            {role.name}
                          </Button.LikeLink>
                        </li>
                      ))}
                    </Ul>
                  ) : (
                    commonText('loading')
                  )}
                </div>
                <div className="flex gap-2">
                  {hasPermission(
                    '/permissions/roles',
                    'create',
                    collection.id
                  ) ||
                  (hasPermission(
                    '/permissions/roles',
                    'copy_from_library',
                    collection.id
                  ) &&
                    hasPermission('/permissions/library/roles', 'read')) ? (
                    <Button.Green
                      onClick={(): void =>
                        setState({
                          type: 'CreatingRoleState',
                        })
                      }
                      disabled={
                        !Array.isArray(userRoles) &&
                        hasPermission(
                          '/permissions/user/roles',
                          'read',
                          collection.id
                        )
                      }
                    >
                      {commonText('create')}
                    </Button.Green>
                  ) : undefined}
                  <SecurityImportExport
                    roles={roles}
                    permissionName="/permissions/roles"
                    baseName={collection.collectionName ?? ''}
                    collectionId={collection.id}
                    onUpdateRole={updateRole}
                    onCreateRole={createRole}
                  />
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h4 className={className.headerGray}>{adminText('users')}</h4>
              {typeof mergedUsers === 'object' ? (
                mergedUsers.length === 0 ? (
                  commonText('none')
                ) : (
                  <>
                    <Ul>
                      {mergedUsers.map(({ userId, userName, roles }) => (
                        <li key={userId}>
                          <Button.LikeLink
                            onClick={(): void => handleOpenUser(userId)}
                            disabled={
                              userId !== userInformation.id &&
                              !hasTablePermission('SpecifyUser', 'read')
                            }
                          >
                            {userName}
                            {roles.length > 0 && (
                              <span className="text-gray-500">
                                {`(${formatList(
                                  roles.map(({ roleName }) => roleName)
                                )})`}
                              </span>
                            )}
                          </Button.LikeLink>
                        </li>
                      ))}
                    </Ul>
                    <div>
                      <Button.Green
                        onClick={(): void => handleOpenUser(undefined)}
                      >
                        {commonText('create')}
                      </Button.Green>
                    </div>
                  </>
                )
              ) : hasPermission(
                  '/permissions/user/roles',
                  'read',
                  collection.id
                ) ? (
                commonText('loading')
              ) : (
                <Button.LikeLink
                  onClick={(): void => handleOpenUser(userInformation.id)}
                >
                  {userInformation.name}
                </Button.LikeLink>
              )}
            </section>
          </div>
        </>
      )}
      {state.type === 'CreatingRoleState' && (
        <CreateRole
          libraryRoles={libraryRoles}
          collections={collections}
          onCreated={(role): void =>
            loading(
              (typeof role.id === 'number'
                ? createRole(role)
                : Promise.resolve(undefined)
              ).then(() =>
                setState({
                  type: 'RoleState',
                  role,
                })
              )
            )
          }
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
          scope={collection.id}
        />
      )}
      {state.type === 'RoleState' ? (
        typeof roles === 'object' ? (
          <RoleView
            role={state.role}
            parentName={collection.collectionName ?? ''}
            onClose={(): void => setState({ type: 'MainState' })}
            onSave={(role): void =>
              loading(
                (typeof role.id === 'number'
                  ? updateRole(role as Role)
                  : createRole(role)
                ).then((): void => setState({ type: 'MainState' }))
              )
            }
            onDelete={(): void =>
              typeof state.role.id === 'number'
                ? loading(
                    ping(
                      `/permissions/role/${state.role.id}/`,
                      {
                        method: 'DELETE',
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    )
                      .then((): void => setState({ type: 'MainState' }))
                      .then((): void =>
                        setRoles(
                          removeKey(roles, defined(state.role.id).toString())
                        )
                      )
                  )
                : undefined
            }
            userRoles={roleUsers}
            permissionName="/permissions/roles"
            collectionId={collection.id}
            onOpenUser={handleOpenUser}
            onAddUser={(user): void =>
              typeof userRoles === 'object' && typeof state.role.id === 'number'
                ? f.var(
                    userRoles.findIndex(({ userId }) => userId === user.id),
                    (userIndex) =>
                      f.var(
                        userRoles[userIndex].roles.map(({ roleId }) => roleId),
                        (currentUserRoles) =>
                          currentUserRoles.includes(defined(state.role.id))
                            ? undefined
                            : loading(
                                ping(
                                  `/permissions/user_roles/${collection.id}/${user.id}/`,
                                  {
                                    method: 'PUT',
                                    body: [
                                      ...currentUserRoles,
                                      state.role.id,
                                    ].map((id) => ({ id })),
                                  },
                                  { expectedResponseCodes: [Http.NO_CONTENT] }
                                ).then(() =>
                                  setUserRoles(
                                    replaceItem(userRoles, userIndex, {
                                      ...userRoles[userIndex],
                                      roles: [
                                        ...userRoles[userIndex].roles,
                                        {
                                          roleId: defined(state.role.id),
                                          roleName: state.role.name,
                                        },
                                      ],
                                    })
                                  )
                                )
                              )
                      )
                  )
                : undefined
            }
          />
        ) : (
          <LoadingScreen />
        )
      ) : undefined}
    </Container.Base>
  );
}
