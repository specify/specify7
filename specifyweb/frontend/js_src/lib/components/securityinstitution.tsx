import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import { error } from '../assert';
import type { Collection, Institution, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { removeKey, replaceKey, sortFunction } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { getResourceViewUrl } from '../resource';
import { schema } from '../schema';
import type { BackEndRole } from '../securityutils';
import { decompressPolicies, processPolicies } from '../securityutils';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, Link, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useTitle } from './hooks';
import { LoadingScreen } from './modaldialog';
import { SecurityImportExport } from './securityimportexport';
import type { NewRole, Role } from './securityrole';
import { RoleView } from './securityrole';
import { CreateRole } from './securityroletemplate';

export function SecurityInstitution({
  institution,
  users,
  onOpenUser: handleOpenUser,
  collections,
  libraryRoles,
  onChangeLibraryRoles: handleChangeLibraryRoles,
}: {
  readonly institution: SerializedResource<Institution>;
  readonly users: IR<SerializedResource<SpecifyUser>> | undefined;
  readonly onOpenUser: ((userId: number | undefined) => void) | undefined;
  readonly libraryRoles: IR<Role> | undefined;
  readonly collections: RA<SerializedResource<Collection>>;
  readonly onChangeLibraryRoles: (
    roles: IR<Role> | ((oldState: IR<Role>) => IR<Role>)
  ) => void;
}): JSX.Element {
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'CreatingRoleState'>
    | State<'RoleState', { readonly role: Role | NewRole }>
  >({ type: 'MainState' });
  const loading = React.useContext(LoadingContext);

  const updateRole = async (role: Role): Promise<void> =>
    ping(
      `/permissions/library_role/${role.id}/`,
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
          ...removeKey(role, 'id'),
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

  const [admins] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
          readonly sp7_admins: RA<{
            readonly userid: number;
            readonly username: string;
          }>;
          readonly sp6_admins: RA<{
            readonly userid: number;
            readonly username: string;
          }>;
        }>('/permissions/list_admins/', {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => ({
          admins: new Set(data.sp7_admins.map(({ userid }) => userid)),
          legacyAdmins: new Set(data.sp6_admins.map(({ userid }) => userid)),
        })),
      []
    ),
    false
  );

  useTitle(
    state.type === 'MainState' ? institution.name ?? undefined : undefined
  );

  return (
    <Container.Base className="flex-1">
      {state.type === 'MainState' || state.type === 'CreatingRoleState' ? (
        <>
          <div className="flex gap-2">
            <h3 className="text-2xl">
              {`${schema.models.Institution.label}: ${institution.name ?? ''}`}
            </h3>
            <Link.Icon
              href={getResourceViewUrl(
                'Institution',
                schema.domainLevelIds.institution
              )}
              className={className.dataEntryEdit}
              icon="pencil"
              title={commonText('edit')}
              aria-label={commonText('edit')}
            />
          </div>
          <div className="flex flex-col flex-1 gap-8 overflow-y-scroll">
            {hasPermission('/permissions/library/roles', 'read') && (
              <section className="flex flex-col gap-2">
                <h4 className="text-xl">{adminText('userRoleLibrary')}</h4>
                {typeof libraryRoles === 'object' ? (
                  <ul>
                    {Object.values(libraryRoles).map((role) => (
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
                  </ul>
                ) : (
                  commonText('loading')
                )}
                <div className="flex gap-2">
                  {hasPermission('/permissions/library/roles', 'create') && (
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
                      scope="institution"
                    />
                  )}
                  <SecurityImportExport
                    roles={libraryRoles}
                    permissionName="/permissions/library/roles"
                    baseName={institution.name ?? ''}
                    collectionId={schema.domainLevelIds.collection}
                    onUpdateRole={updateRole}
                    onCreateRole={createRole}
                  />
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h4 className="text-xl">
                {adminText('institutionUserAccounts')}
              </h4>
              {typeof users === 'object' ? (
                <>
                  <Ul>
                    {Object.values(users)
                      .sort(sortFunction(({ name }) => name))
                      .map((user) => (
                        <li key={user.id}>
                          <Button.LikeLink
                            onClick={handleOpenUser?.bind(undefined, user.id)}
                            disabled={
                              typeof handleOpenUser === 'undefined' ||
                              (user.id !== userInformation.id &&
                                !hasTablePermission('SpecifyUser', 'read'))
                            }
                          >
                            {`${user.name}`}
                            <span className="text-gray-500">{`${
                              admins?.admins.has(user.id)
                                ? ` ${adminText('specifyAdmin')}`
                                : ''
                            }${
                              admins?.legacyAdmins.has(user.id)
                                ? ` ${adminText('legacyAdmin')}`
                                : ''
                            }`}</span>
                          </Button.LikeLink>
                        </li>
                      ))}
                  </Ul>
                  {hasTablePermission('SpecifyUser', 'create') && (
                    <div>
                      <Button.Green
                        onClick={handleOpenUser?.bind(undefined, undefined)}
                      >
                        {commonText('create')}
                      </Button.Green>
                    </div>
                  )}
                </>
              ) : (
                commonText('loading')
              )}
              {typeof users === 'object' && typeof admins === 'undefined' && (
                <p>{adminText('loadingAdmins')}</p>
              )}
            </section>
          </div>
        </>
      ) : state.type === 'RoleState' ? (
        typeof libraryRoles === 'object' ? (
          <RoleView
            role={state.role}
            parentName={institution.name ?? schema.models.Institution.label}
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
              typeof state.role.id === 'number'
                ? loading(
                    ping(
                      `/permissions/library_role/${state.role.id}/`,
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
                            defined(state.role.id).toString()
                          )
                        )
                      )
                  )
                : undefined
            }
            onOpenUser={undefined}
            onAddUser={undefined}
            permissionName="/permissions/library/roles"
            collectionId={schema.domainLevelIds.collection}
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
