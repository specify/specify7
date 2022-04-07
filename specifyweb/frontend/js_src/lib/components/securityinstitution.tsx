import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import { error } from '../assert';
import type { Institution, SpecifyUser } from '../datamodel';
import { omit, removeKey, replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import type { BackEndRole } from '../securityutils';
import { decompressPolicies, processPolicies } from '../securityutils';
import type { IR } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, Ul } from './basic';
import { LoadingContext } from './contexts';
import { LoadingScreen } from './modaldialog';
import { SecurityImportExport } from './securityimportexport';
import type { NewRole, Role } from './securityrole';
import { RoleView } from './securityrole';

export function InstitutionView({
  institution,
  users,
  onOpenUser: handleOpenUser,
  libraryRoles,
  onChangeLibraryRoles: handleChangeLibraryRoles,
}: {
  readonly institution: SpecifyResource<Institution>;
  readonly users: IR<SpecifyResource<SpecifyUser>> | undefined;
  readonly onOpenUser: (userId: number) => void;
  readonly libraryRoles: IR<Role> | undefined;
  readonly onChangeLibraryRoles: (
    roles: IR<Role> | ((oldState: IR<Role>) => IR<Role>)
  ) => void;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'RoleState', { readonly roleId: number | undefined }>
  >({ type: 'MainState' });
  const loading = React.useContext(LoadingContext);

  const updateRole = async (role: Role): Promise<void> =>
    ping(
      `/permissions/library_roles/${role.id}/`,
      {
        method: 'PUT',
        body: {
          ...role,
          policies: decompressPolicies(role.policies),
        },
      },
      { expectedResponseCodes: [Http.NO_CONTENT] }
    ).then((): void =>
      handleChangeLibraryRoles((roles) =>
        replaceKey(defined(roles), role.id.toString(), role)
      )
    );

  const createRole = async (role: NewRole): Promise<void> =>
    ajax<BackEndRole>(
      `/permissions/library_roles/`,
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
      handleChangeLibraryRoles((roles) => ({
        ...roles,
        [role.id]: {
          ...role,
          policies: processPolicies(role.policies),
        },
      }))
    );

  /*
   * TODO: securityCollection.tsx and securityInstitution.tsx are very similar
   *   probably could merge them
   */
  return (
    <Container.Base className="flex-1 overflow-y-auto">
      {state.type === 'MainState' ? (
        <>
          <h3 className="text-xl">{institution.get('name')}</h3>
          {hasPermission('/permissions/library/roles', 'read') && (
            <section className="flex flex-col gap-2">
              <div>
                <h4 className={className.headerGray}>
                  {adminText('userRoleLibrary')}
                </h4>
                {typeof libraryRoles === 'object' ? (
                  <ul>
                    {Object.values(libraryRoles).map((role) => (
                      <li key={role.id}>
                        <Button.LikeLink
                          disabled={
                            !hasPermission(
                              '/permissions/library/roles',
                              'update'
                            )
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
              <div className="flex gap-2">
                {hasPermission('/permissions/library/roles', 'create') && (
                  <Button.Green
                    onClick={(): void =>
                      setState({
                        type: 'RoleState',
                        roleId: undefined,
                      })
                    }
                  >
                    {commonText('create')}
                  </Button.Green>
                )}
                <SecurityImportExport
                  roles={libraryRoles}
                  permissionName="/permissions/library/roles"
                  baseName={institution.get('name') ?? ''}
                  onUpdateRole={updateRole}
                  onCreateRole={createRole}
                />
              </div>
            </section>
          )}
          <section className="flex flex-col gap-2">
            <h4 className={className.headerGray}>{adminText('users')}:</h4>
            {typeof users === 'object' ? (
              <Ul>
                {Object.values(users)
                  .filter(
                    ({ id }) =>
                      id === userInformation.id ||
                      hasTablePermission('SpecifyUser', 'update') ||
                      hasPermission('/permissions/policies/user', 'update') ||
                      hasPermission('/permissions/user/roles', 'update')
                  )
                  .map((user) => (
                    <li key={user.id}>
                      <Button.LikeLink
                        onClick={(): void => handleOpenUser(user.id)}
                      >
                        {user.get('name')}
                      </Button.LikeLink>
                    </li>
                  ))}
              </Ul>
            ) : (
              commonText('loading')
            )}
          </section>
        </>
      ) : state.type === 'RoleState' ? (
        typeof libraryRoles === 'object' ? (
          <RoleView
            role={
              typeof state.roleId === 'number'
                ? libraryRoles[state.roleId]
                : ({
                    id: undefined,
                    name: '',
                    description: '',
                    policies: [],
                  } as const)
            }
            parentName={institution.get('name') ?? adminText('institution')}
            userRoles={undefined}
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
              typeof state.roleId === 'number'
                ? loading(
                    ping(
                      `/permissions/library_role/${state.roleId}/`,
                      {
                        method: 'DELETE',
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    )
                      .then((): void => setState({ type: 'MainState' }))
                      .then((): void =>
                        handleChangeLibraryRoles(
                          removeKey(
                            libraryRoles,
                            defined(state.roleId).toString()
                          )
                        )
                      )
                  )
                : undefined
            }
            onOpenUser={undefined}
            onAddUser={undefined}
            permissionName="/permissions/library/roles"
          />
        ) : (
          <LoadingScreen />
        )
      ) : (
        error('Invalid state')
      )}
    </Container.Base>
  );
}
