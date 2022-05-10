import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import type { Collection } from '../datamodel';
import type { KeysToLowerCase, SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { index, removeKey, replaceItem, replaceKey } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import type { BackEndRole } from '../securityutils';
import {
  decompressPolicies,
  fetchRoles,
  processPolicies,
} from '../securityutils';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useLiveState, useTitle } from './hooks';
import { formatList } from './internationalization';
import { LoadingScreen } from './modaldialog';
import { SecurityImportExport } from './securityimportexport';
import type { NewRole, Role } from './securityrole';
import { RoleView } from './securityrole';
import { CreateRole } from './securityroletemplate';

export type UserRoles = RA<{
  readonly userId: number;
  readonly userName: string;
  readonly roles: RA<{
    readonly roleId: number;
    readonly roleName: string;
  }>;
}>;

export function CollectionView({
  collection,
  initialRoleId,
  onOpenUser: handleOpenUser,
  collections,
  libraryRoles,
}: {
  readonly collection: SerializedResource<Collection>;
  readonly initialRoleId: number | undefined;
  readonly onOpenUser: (userId: number | undefined) => void;
  readonly collections: IR<SerializedResource<Collection>>;
  readonly libraryRoles: IR<Role> | undefined;
}): JSX.Element {
  const [roles, setRoles] = useAsyncState<IR<Role>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/roles', 'read')
          ? fetchRoles(collection.id, undefined).then(index)
          : undefined,
      [collection.id]
    ),
    false
  );

  const [userRoles, setUserRoles] = useAsyncState<UserRoles>(
    React.useCallback(
      async () =>
        ajax<RA<KeysToLowerCase<UserRoles[number]>>>(
          `/permissions/user_roles/${collection.id}`,
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
        ),
      [collection.id]
    ),
    // Display loading screen while loading a role
    typeof initialRoleId === 'number'
  );

  const [state, setState] = useLiveState<
    | State<'MainState'>
    | State<'CreatingRoleState'>
    | State<'LoadingRole'>
    | State<
        'RoleState',
        { readonly role: Role | NewRole; readonly userRoles: UserRoles }
      >
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
      typeof roles === 'object' &&
      Array.isArray(userRoles)
    )
      setState({
        type: 'RoleState',
        role: roles[initialRoleId],
        userRoles: userRoles.filter(({ roles }) =>
          roles.some(({ roleId }) => roleId === initialRoleId)
        ),
      });
  }, [roles, state, initialRoleId, setState, userRoles]);

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

  const createRole = async (role: NewRole): Promise<void> =>
    ajax<BackEndRole>(
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
    <Container.Base className="flex-1">
      {state.type === 'MainState' && (
        <>
          <h3 className="text-xl">{collection.collectionName}</h3>
          {hasPermission('/permissions/roles', 'read') && (
            <section className="flex flex-col gap-2">
              <div>
                <h4 className={className.headerGray}>
                  {adminText('userRoles')}:
                </h4>
                {typeof roles === 'object' ? (
                  <ul>
                    {Object.values(roles).map((role) => (
                      <li key={role.id}>
                        <Button.LikeLink
                          disabled={
                            !hasPermission('/permissions/roles', 'update') ||
                            !Array.isArray(userRoles)
                          }
                          onClick={(): void =>
                            setState({
                              type: 'RoleState',
                              role,
                              userRoles:
                                userRoles?.filter(({ roles }) =>
                                  roles.some(
                                    ({ roleId }) => roleId === initialRoleId
                                  )
                                ) ?? [],
                            })
                          }
                        >
                          {role.name}
                        </Button.LikeLink>
                      </li>
                    ))}
                  </ul>
                ) : (
                  commonText('loading')
                )}
              </div>
              <div className="flex gap-2">
                {hasPermission('/permissions/roles', 'create') ||
                hasPermission('/permissions/roles', 'copy_from_library') ? (
                  <Button.Green
                    onClick={(): void =>
                      setState({
                        type: 'CreatingRoleState',
                      })
                    }
                    disabled={!Array.isArray(userRoles)}
                  >
                    {commonText('create')}
                  </Button.Green>
                ) : undefined}
                <SecurityImportExport
                  roles={roles}
                  permissionName="/permissions/roles"
                  baseName={collection.collectionName ?? ''}
                  onUpdateRole={updateRole}
                  onCreateRole={createRole}
                />
              </div>
            </section>
          )}
          <section className="flex flex-col gap-2">
            <h4 className={className.headerGray}>{adminText('users')}:</h4>
            {typeof userRoles === 'object'
              ? f.var(
                  userRoles.filter(
                    ({ userId, roles }) =>
                      roles.length > 0 &&
                      (userId === userInformation.id ||
                        hasTablePermission('SpecifyUser', 'update') ||
                        hasPermission('/permissions/policies/user', 'update') ||
                        hasPermission('/permissions/user/roles', 'update'))
                  ),
                  (users) =>
                    users.length === 0 ? (
                      commonText('none')
                    ) : (
                      <>
                        <Ul>
                          {users.map(({ userId, userName, roles }) => (
                            <li key={userId}>
                              <Button.LikeLink
                                onClick={(): void => handleOpenUser(userId)}
                              >
                                {userName}
                                <span className="text-gray-500">
                                  {`(${formatList(
                                    roles.map(({ roleName }) => roleName)
                                  )})`}
                                </span>
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
                )
              : commonText('loading')}
          </section>
        </>
      )}
      {state.type === 'CreatingRoleState' && (
        <CreateRole
          libraryRoles={libraryRoles}
          collections={collections}
          onCreated={(role): void =>
            setState({
              type: 'RoleState',
              role,
              userRoles:
                userRoles?.filter(({ roles }) =>
                  roles.some(({ roleId }) => roleId === initialRoleId)
                ) ?? [],
            })
          }
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
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
            userRoles={state.userRoles}
            onOpenUser={handleOpenUser}
            onAddUser={(user): void =>
              typeof userRoles === 'object' && typeof state.role.id === 'number'
                ? f.var(
                    userRoles[user.id].roles.map(({ roleId }) => roleId),
                    (currentUserRoles) =>
                      currentUserRoles.includes(defined(state.role.id))
                        ? undefined
                        : loading(
                            ping(
                              `/permissions/user_roles/${collection.id}/${user.id}/`,
                              {
                                method: 'PUT',
                                body: [...currentUserRoles, state.role.id].map(
                                  (id) => ({ id })
                                ),
                              },
                              { expectedResponseCodes: [Http.NO_CONTENT] }
                            ).then(() =>
                              setUserRoles(
                                f.var(
                                  userRoles.findIndex(
                                    ({ userId }) => userId === user.id
                                  ),
                                  (userIndex) =>
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
            permissionName="/permissions/library/roles"
          />
        ) : (
          <LoadingScreen />
        )
      ) : undefined}
    </Container.Base>
  );
}
