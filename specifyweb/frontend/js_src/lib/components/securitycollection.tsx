import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import { fetchCollection } from '../collection';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { omit, removeKey, replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { fetchRoles, flattenPolicies, inflatePolicies } from '../securityutils';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useLiveState } from './hooks';
import { LoadingScreen } from './modaldialog';
import type { BackEndRole, Role, UserRoles } from './securityrole';
import { RoleView } from './securityrole';

const index = <T extends { readonly id: number }>(data: RA<T>): IR<T> =>
  Object.fromEntries(data.map((item) => [item.id, item]));

export function CollectionView({
  collection,
  initialRole,
  onOpenUser: handleOpenUser,
}: {
  readonly collection: SpecifyResource<Collection>;
  readonly initialRole: number | undefined;
  readonly onOpenUser: (user: SerializedResource<SpecifyUser>) => void;
}): JSX.Element {
  const [roles, setRoles] = useAsyncState<IR<Role>>(
    React.useCallback(
      async () => fetchRoles(collection.id, undefined).then(index),
      [collection.id]
    ),
    false,
    true
  );
  const [userRoles, setUserRoles] = useAsyncState<UserRoles>(
    React.useCallback(
      async () =>
        fetchCollection('SpecifyUser', { limit: 0 }).then(async ({ records }) =>
          Promise.all(
            records.map(async (user) =>
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
        ),
      [collection.id]
    ),
    false,
    true
  );
  const [state, setState] = useLiveState<
    | State<'MainState'>
    | State<'RoleState', { readonly roleId: number | undefined }>
  >(
    React.useCallback(
      () =>
        typeof initialRole === 'number'
          ? ({
              type: 'RoleState',
              roleId: initialRole,
            } as const)
          : ({ type: 'MainState' } as const),
      [initialRole]
    )
  );
  const loading = React.useContext(LoadingContext);
  return (
    <Container.Base className="flex-1 overflow-y-auto">
      {state.type === 'MainState' && (
        <>
          <h3 className="text-xl">{collection.get('collectionName')}</h3>
          <section className="flex flex-col gap-2">
            <h4 className={className.headerGray}>{adminText('admins')}</h4>
            <div>
              <Button.Green>{commonText('add')}</Button.Green>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <div>
              <h4 className={className.headerGray}>{adminText('userRoles')}</h4>
              {typeof roles === 'object' ? (
                <ul>
                  {Object.values(roles).map((role) => (
                    <li key={role.id}>
                      <Button.LikeLink
                        disabled={
                          !hasPermission('/permissions/user/roles', 'update')
                        }
                        onClick={(): void =>
                          setState({
                            type: 'RoleState',
                            roleId: role.id,
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
            {hasPermission('/permissions/roles', 'create') && (
              <div>
                <Button.Green
                  onClick={(): void =>
                    setState({
                      type: 'RoleState',
                      roleId: undefined,
                    })
                  }
                >
                  {commonText('add')}
                </Button.Green>
              </div>
            )}
          </section>
          <section className="flex flex-col gap-2">
            <h4 className={className.headerGray}>{adminText('users')}:</h4>
            {typeof userRoles === 'object' ? (
              <Ul>
                {Object.values(userRoles)
                  .filter(
                    ({ roles, user }) =>
                      roles.length > 0 &&
                      (user.id === userInformation.id ||
                        hasTablePermission('SpecifyUser', 'update') ||
                        hasPermission('/permissions/policies/user', 'update') ||
                        hasPermission('/permissions/user/roles', 'update'))
                  )
                  .map(({ user }) => (
                    <li key={user.id}>
                      <Button.LikeLink
                        onClick={(): void => handleOpenUser(user)}
                      >
                        {user.name}
                      </Button.LikeLink>
                    </li>
                  ))}
              </Ul>
            ) : (
              commonText('loading')
            )}
          </section>
        </>
      )}
      {state.type === 'RoleState' ? (
        typeof roles === 'object' ? (
          <RoleView
            role={
              typeof state.roleId === 'number'
                ? roles[state.roleId]
                : ({
                    id: undefined,
                    name: '',
                    description: '',
                    policies: [],
                  } as const)
            }
            collection={collection}
            onClose={(): void => setState({ type: 'MainState' })}
            onSave={(role): void =>
              loading(
                (typeof role.id === 'number'
                  ? ping(
                      `/permissions/role/${role.id}/`,
                      {
                        method: 'PUT',
                        body: {
                          ...role,
                          policies: flattenPolicies(role.policies),
                        },
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    ).then((): void =>
                      setRoles(
                        replaceKey(
                          roles,
                          defined(role.id).toString(),
                          role as Role
                        )
                      )
                    )
                  : ajax<BackEndRole>(
                      `/permissions/roles/${collection.id}/`,
                      {
                        method: 'POST',
                        body: {
                          ...omit(role, ['id']),
                          policies: flattenPolicies(role.policies),
                        },
                        headers: { Accept: 'application/json' },
                      },
                      { expectedResponseCodes: [Http.CREATED] }
                    ).then(({ data: role }) =>
                      setRoles({
                        ...roles,
                        [role.id]: {
                          ...role,
                          policies: inflatePolicies(role.policies),
                        },
                      })
                    )
                ).then((): void => setState({ type: 'MainState' }))
              )
            }
            onDelete={(): void =>
              typeof state.roleId === 'number'
                ? loading(
                    ping(
                      `/permissions/role/${state.roleId}/`,
                      {
                        method: 'DELETE',
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    )
                      .then((): void => setState({ type: 'MainState' }))
                      .then((): void =>
                        setRoles(
                          removeKey(roles, defined(state.roleId).toString())
                        )
                      )
                  )
                : undefined
            }
            userRoles={userRoles}
            onOpenUser={handleOpenUser}
            onAddUser={(user): void =>
              typeof userRoles === 'object' && typeof state.roleId === 'number'
                ? loading(
                    ping(
                      `/permissions/user_roles/${collection.id}/${user.id}/`,
                      {
                        method: 'PUT',
                        body: [...userRoles[user.id].roles, state.roleId].map(
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
                            defined(state.roleId),
                          ],
                        })
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
