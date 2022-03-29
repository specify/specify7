import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { index, omit, removeKey, replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import type { BackEndRole } from '../securityutils';
import {
  decompressPolicies,
  fetchRoles,
  processPolicies,
} from '../securityutils';
import type { IR } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useLiveState } from './hooks';
import { LoadingScreen } from './modaldialog';
import { SecurityImportExport } from './securityimportexport';
import type { NewRole, Role, UserRoles } from './securityrole';
import { RoleView } from './securityrole';
import { CreateRole } from './securityroletemplate';

export function CollectionView({
  collection,
  initialRoleId,
  users,
  onOpenUser: handleOpenUser,
  collections,
  libraryRoles,
}: {
  readonly collection: SpecifyResource<Collection>;
  readonly initialRoleId: number | undefined;
  readonly users: IR<SerializedResource<SpecifyUser>> | undefined;
  readonly onOpenUser: (userId: number) => void;
  readonly collections: IR<SpecifyResource<Collection>>;
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
    false,
    true
  );
  const [userRoles, setUserRoles] = useAsyncState<UserRoles>(
    React.useCallback(
      async () =>
        typeof users === 'object'
          ? Promise.all(
              Object.values(users).map(async (user) =>
                fetchRoles(collection.id, user.id).then(
                  (roles) =>
                    [
                      user.id,
                      {
                        user,
                        roles: roles.map((role) => role.id),
                      },
                    ] as const
                )
              )
            ).then((entries) => Object.fromEntries(entries))
          : undefined,
      [collection.id, users]
    ),
    // Display loading screen while loading a role
    typeof initialRoleId === 'number',
    true
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
          ...omit(role, ['id']),
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

  const loading = React.useContext(LoadingContext);
  return (
    <Container.Base className="flex-1 overflow-y-auto">
      {state.type === 'MainState' && (
        <>
          <h3 className="text-xl">{collection.get('collectionName')}</h3>
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
                {hasPermission('/permissions/roles', 'create') && (
                  <Button.Green
                    onClick={(): void =>
                      setState({
                        type: 'CreatingRoleState',
                      })
                    }
                  >
                    {commonText('create')}
                  </Button.Green>
                )}
                <SecurityImportExport
                  roles={roles}
                  isReadOnly={!hasPermission('/permissions/roles', 'update')}
                  baseName={collection.get('collectionName') ?? ''}
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
                  Object.values(userRoles).filter(
                    ({ roles, user }) =>
                      roles.length > 0 &&
                      (user.id === userInformation.id ||
                        hasTablePermission('SpecifyUser', 'update') ||
                        hasPermission('/permissions/policies/user', 'update') ||
                        hasPermission('/permissions/user/roles', 'update'))
                  ),
                  (users) =>
                    users.length === 0 ? (
                      commonText('none')
                    ) : (
                      <Ul>
                        {users.map(({ user }) => (
                          <li key={user.id}>
                            <Button.LikeLink
                              onClick={(): void => handleOpenUser(user.id)}
                            >
                              {user.name}
                            </Button.LikeLink>
                          </li>
                        ))}
                      </Ul>
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
            parentName={collection.get('collectionName') ?? ''}
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
                        body: [...userRoles[user.id].roles, state.role.id].map(
                          (id) => ({ id })
                        ),
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    ).then(() =>
                      setUserRoles(
                        replaceKey(userRoles, user.id.toString(), {
                          ...userRoles[user.id],
                          roles: [
                            ...userRoles[user.id].roles,
                            defined(state.role.id),
                          ],
                        })
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
