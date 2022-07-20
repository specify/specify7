import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import type { Collection } from '../datamodel';
import type { KeysToLowerCase, SerializedResource } from '../datamodelutils';
import {
  index,
  removeKey,
  replaceItem,
  replaceKey,
  sortFunction,
} from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissionutils';
import { fetchResource } from '../resource';
import { schema } from '../schema';
import type { BackEndRole } from '../securityutils';
import {
  decompressPolicies,
  fetchRoles,
  processPolicies,
} from '../securityutils';
import type { IR, RA, RR } from '../types';
import { defined, filterArray } from '../types';
import { userInformation } from '../userinfo';
import { Button, Container, DataEntry, Ul } from './basic';
import { LoadingContext } from './contexts';
import {
  useAsyncState,
  useBooleanState,
  useLiveState,
  useTitle,
} from './hooks';
import { formatList } from './internationalization';
import { LoadingScreen } from './modaldialog';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
import { SecurityImportExport } from './securityimportexport';
import type { NewRole, Role } from './securityrole';
import { RoleView } from './securityrole';
import { CreateRole } from './securityroletemplate';

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
            ).then(async ({ data }) =>
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
                roles: roles
                  .map(({ roleid, rolename }) => ({
                    roleId: roleid,
                    roleName: rolename,
                  }))
                  .sort(sortFunction(({ roleName }) => roleName)),
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
    | State<'CreatingRoleState'>
    | State<'LoadingRole'>
    | State<'MainState'>
    | State<'RoleState', { readonly role: NewRole | Role }>
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

  const createRole = async (role: NewRole | Role): Promise<void> =>
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
            <h3 className="text-2xl">
              {`${schema.models.Collection.label}: ${
                collection.collectionName ?? ''
              }`}
            </h3>
            {hasTablePermission('Collection', 'read') && (
              <ViewCollectionButton collection={collection} />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-6 overflow-y-scroll">
            {hasPermission('/permissions/roles', 'read', collection.id) && (
              <section className="flex flex-col gap-1">
                <h4 className="text-xl">{adminText('collectionUserRoles')}</h4>
                {typeof roles === 'object' ? (
                  <Ul>
                    {Object.values(roles)
                      .sort(sortFunction(({ name }) => name))
                      .map((role) => (
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
                      disabled={
                        !Array.isArray(userRoles) &&
                        hasPermission(
                          '/permissions/user/roles',
                          'read',
                          collection.id
                        )
                      }
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
                    baseName={collection.collectionName ?? ''}
                    collectionId={collection.id}
                    permissionName="/permissions/roles"
                    roles={roles}
                    onCreateRole={createRole}
                    onUpdateRole={updateRole}
                  />
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h4 className="text-xl">{adminText('collectionUsers')}</h4>
              {typeof mergedUsers === 'object' ? (
                mergedUsers.length === 0 ? (
                  commonText('none')
                ) : (
                  <>
                    <Ul>
                      {mergedUsers.map(({ userId, userName, roles }) => (
                        <li key={userId}>
                          <Button.LikeLink
                            disabled={
                              userId !== userInformation.id &&
                              !hasTablePermission('SpecifyUser', 'read')
                            }
                            onClick={(): void => handleOpenUser(userId)}
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
          collections={collections}
          libraryRoles={libraryRoles}
          scope={collection.id}
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
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
        />
      )}
      {state.type === 'RoleState' ? (
        typeof roles === 'object' ? (
          <RoleView
            collectionId={collection.id}
            parentName={collection.collectionName ?? ''}
            permissionName="/permissions/roles"
            role={state.role}
            userRoles={roleUsers}
            onAddUsers={(users): void => {
              if (userRoles === undefined || state.role.id === undefined)
                return;
              loading(
                Promise.all(
                  users.map((user) => {
                    const userIndex = userRoles.findIndex(
                      ({ userId }) => userId === user.id
                    );
                    const currentUserRoles = userRoles[userIndex].roles.map(
                      ({ roleId }) => roleId
                    );
                    // Noop if user is already part of this role
                    return currentUserRoles.includes(defined(state.role.id))
                      ? undefined
                      : ping(
                          `/permissions/user_roles/${collection.id}/${user.id}/`,
                          {
                            method: 'PUT',
                            body: [...currentUserRoles, state.role.id].map(
                              (id) => ({
                                id,
                              })
                            ),
                          },
                          { expectedResponseCodes: [Http.NO_CONTENT] }
                        ).then(() => ({
                          userIndex,
                          updatedRoles: {
                            ...userRoles[userIndex],
                            roles: [
                              ...userRoles[userIndex].roles,
                              {
                                roleId: defined(state.role.id),
                                roleName: state.role.name,
                              },
                            ],
                          },
                        }));
                  })
                ).then((addedUserRoles) =>
                  setUserRoles(
                    filterArray(addedUserRoles).reduce(
                      (userRoles, { userIndex, updatedRoles }) =>
                        replaceItem(userRoles, userIndex, updatedRoles),
                      userRoles
                    )
                  )
                )
              );
            }}
            onClose={(): void => setState({ type: 'MainState' })}
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
            onOpenUser={handleOpenUser}
            onSave={(role): void =>
              loading(
                (typeof role.id === 'number'
                  ? updateRole(role as Role)
                  : createRole(role)
                ).then((): void => setState({ type: 'MainState' }))
              )
            }
          />
        ) : (
          <LoadingScreen />
        )
      ) : undefined}
    </Container.Base>
  );
}

function ViewCollectionButton({
  collection,
}: {
  readonly collection: SerializedResource<Collection>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resource = React.useMemo(
    () => deserializeResource(collection),
    [collection]
  );
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <ResourceView
          canAddAnother={false}
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={resource}
          onClose={handleClose}
          onDeleted={undefined}
          onSaved={undefined}
        />
      )}
    </>
  );
}
