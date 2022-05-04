import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import type { Collection } from '../datamodel';
import type { KeysToLowerCase, SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { group, index, removeKey, replaceItem, replaceKey } from '../helpers';
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
import type { NewRole, Role, UserRoles } from './securityrole';
import { RoleView } from './securityrole';
import { CreateRole } from './securityroletemplate';

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
          data.map(({ roleid, rolename, users }) => ({
            roleId: roleid,
            roleName: rolename,
            users: users.map(({ userid, username }) => ({
              userId: userid,
              userName: username,
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
  }, [roles, state, initialRoleId, setState]);

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
                            !hasPermission('/permissions/roles', 'update')
                          }
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
                  group(
                    userRoles.flatMap(({ roleId, roleName, users }) =>
                      users.map(({ userId, userName }) => [
                        userId,
                        {
                          userName,
                          roleId,
                          roleName,
                        },
                      ])
                    )
                  )
                    .map(([userId, roles]) => ({
                      userId,
                      userName: defined(roles[0]).userName,
                      roles,
                    }))
                    .filter(
                      ({ userId, roles }) =>
                        roles.length > 0 &&
                        (userId === userInformation.id ||
                          hasTablePermission('SpecifyUser', 'update') ||
                          hasPermission(
                            '/permissions/policies/user',
                            'update'
                          ) ||
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
            userRoles={userRoles}
            onOpenUser={handleOpenUser}
            onAddUser={(user): void =>
              typeof userRoles === 'object' && typeof state.role.id === 'number'
                ? loading(
                    ping(
                      `/permissions/user_roles/${collection.id}/${user.id}/`,
                      {
                        method: 'PUT',
                        body: [
                          userRoles
                            .filter(({ users }) =>
                              users.some(({ userId }) => userId === user.id)
                            )
                            .map(({ roleId }) => roleId),
                          state.role.id,
                        ].map((id) => ({ id })),
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    ).then(() =>
                      setUserRoles(
                        f.var(
                          userRoles.findIndex(
                            ({ roleId }) => roleId === user.id
                          ),
                          (roleIndex) =>
                            replaceItem(userRoles, roleIndex, {
                              ...userRoles[roleIndex],
                              users: [
                                ...userRoles[roleIndex].users,
                                { userId: user.id, userName: user.get('name') },
                              ],
                            })
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
