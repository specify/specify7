import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, Http, ping } from '../ajax';
import { error } from '../assert';
import type { Collection, Institution, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { removeKey, replaceKey, sortFunction } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissionutils';
import { schema } from '../schema';
import type { BackEndRole } from '../securityutils';
import {
  decompressPolicies,
  policiesToTsv,
  processPolicies,
} from '../securityutils';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, Container, DataEntry, Ul } from './basic';
import { LoadingContext } from './contexts';
import { downloadFile } from './filepicker';
import { useAsyncState, useBooleanState, useTitle } from './hooks';
import { LoadingScreen } from './modaldialog';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
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
    | State<'CreatingRoleState'>
    | State<'MainState'>
    | State<'RoleState', { readonly role: NewRole | Role }>
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

  const admins = useAdmins();

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
            <ViewInstitutionButton institution={institution} />
          </div>
          <div className="flex flex-1 flex-col gap-8 overflow-y-scroll">
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
                      collections={collections}
                      libraryRoles={libraryRoles}
                      scope="institution"
                      onClose={(): void =>
                        setState({
                          type: 'MainState',
                        })
                      }
                      onCreated={(role): void =>
                        setState({
                          type: 'RoleState',
                          role,
                        })
                      }
                    />
                  )}
                  <SecurityImportExport
                    baseName={institution.name ?? ''}
                    collectionId={schema.domainLevelIds.collection}
                    permissionName="/permissions/library/roles"
                    roles={libraryRoles}
                    onCreateRole={createRole}
                    onUpdateRole={updateRole}
                  />
                  <Button.Blue
                    className={
                      process.env.NODE_ENV === 'production'
                        ? `hidden`
                        : undefined
                    }
                    onClick={(): void =>
                      loading(
                        downloadFile('Permission Policies.tsv', policiesToTsv())
                      )
                    }
                  >
                    [DEV] Download policy list
                  </Button.Blue>
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h4 className="text-xl">{adminText('institutionUsers')}</h4>
              {typeof users === 'object' ? (
                <>
                  <Ul>
                    {Object.values(users)
                      .sort(sortFunction(({ name }) => name))
                      .map((user) => (
                        <li key={user.id}>
                          <Button.LikeLink
                            disabled={
                              user.id !== userInformation.id &&
                              !hasTablePermission('SpecifyUser', 'read')
                            }
                            onClick={handleOpenUser?.bind(undefined, user.id)}
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
              {typeof users === 'object' && admins === undefined && (
                <p>{adminText('loadingAdmins')}</p>
              )}
            </section>
          </div>
        </>
      ) : state.type === 'RoleState' ? (
        typeof libraryRoles === 'object' ? (
          <RoleView
            collectionId={schema.domainLevelIds.collection}
            parentName={institution.name ?? schema.models.Institution.label}
            permissionName="/permissions/library/roles"
            role={state.role}
            userRoles={undefined}
            onAddUsers={undefined}
            onClose={(): void => setState({ type: 'MainState' })}
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
      ) : (
        error('Invalid state')
      )}
    </Container.Base>
  );
}

export function useAdmins():
  | {
      readonly admins: ReadonlySet<number>;
      readonly legacyAdmins: ReadonlySet<number>;
    }
  | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        hasPermission('/permissions/list_admins', 'read')
          ? ajax<{
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
              legacyAdmins: new Set(
                data.sp6_admins.map(({ userid }) => userid)
              ),
            }))
          : { admins: new Set<number>(), legacyAdmins: new Set<number>() },
      []
    ),
    false
  )[0];
}

function ViewInstitutionButton({
  institution,
}: {
  readonly institution: SerializedResource<Institution>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resource = React.useMemo(
    () => deserializeResource(institution),
    [institution]
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
