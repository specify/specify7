import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import { error } from '../assert';
import type { Institution } from '../datamodel';
import { index, omit, removeKey, replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission } from '../permissions';
import type { BackEndRole } from '../securityutils';
import {
  compressPolicies,
  deflatePolicies,
  inflatePolicies,
} from '../securityutils';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { Button, className, Container } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState } from './hooks';
import { LoadingScreen } from './modaldialog';
import type { Role } from './securityrole';
import { RoleView } from './securityrole';

// FIXME: UI for superuser
export function InstitutionView({
  institution,
}: {
  readonly institution: SpecifyResource<Institution>;
}): JSX.Element {
  const [libraryRoles, setLibraryRoles] = useAsyncState<IR<Role>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/library/roles', 'read')
          ? ajax<RA<BackEndRole>>('/api/permissions/library_roles/', {
              headers: { Accept: 'application/json' },
            }).then(({ data }) =>
              index(
                data.map((role) => ({
                  ...role,
                  policies: compressPolicies(inflatePolicies(role.policies)),
                }))
              )
            )
          : undefined,
      []
    ),
    false
  );
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'RoleState', { readonly roleId: number | undefined }>
  >({ type: 'MainState' });
  const loading = React.useContext(LoadingContext);

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
              {hasPermission('/permissions/library/roles', 'create') && (
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
          )}
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
                  ? ping(
                      `/permissions/library_role/${role.id}/`,
                      {
                        method: 'PUT',
                        body: {
                          ...role,
                          policies: deflatePolicies(role.policies),
                        },
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    ).then((): void =>
                      setLibraryRoles(
                        replaceKey(
                          libraryRoles,
                          defined(role.id).toString(),
                          role as Role
                        )
                      )
                    )
                  : ajax<BackEndRole>(
                      `/permissions/library_roles/`,
                      {
                        method: 'POST',
                        body: {
                          ...omit(role, ['id']),
                          policies: deflatePolicies(role.policies),
                        },
                        headers: { Accept: 'application/json' },
                      },
                      { expectedResponseCodes: [Http.CREATED] }
                    ).then(({ data: role }) =>
                      setLibraryRoles({
                        ...libraryRoles,
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
                      `/permissions/library_role/${state.roleId}/`,
                      {
                        method: 'DELETE',
                      },
                      { expectedResponseCodes: [Http.NO_CONTENT] }
                    )
                      .then((): void => setState({ type: 'MainState' }))
                      .then((): void =>
                        setLibraryRoles(
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
