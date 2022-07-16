import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, formData, Http, ping } from '../ajax';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { replaceKey } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { getOperationPermissions } from '../permissions';
import {
  hasDerivedPermission,
  hasPermission,
  hasTablePermission,
} from '../permissionutils';
import { idFromUrl } from '../resource';
import { schema } from '../schema';
import {
  anyResource,
  decompressPolicies,
  getAllActions,
} from '../securityutils';
import type { IR, RA } from '../types';
import { defined, filterArray } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, DataEntry } from './basic';
import { AppTitle } from './common';
import { LoadingContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { ErrorBoundary } from './errorboundary';
import { useBooleanState, useIsModified, useLiveState } from './hooks';
import { Dialog } from './modaldialog';
import { PasswordPlugin, PasswordResetDialog } from './passwordplugin';
import { SetPermissionContext } from './permissioncontext';
import { ProtectedAction, ProtectedTable } from './permissiondenied';
import { deserializeResource } from './resource';
import { augmentMode, BaseResourceView } from './resourceview';
import { SaveButton } from './savebutton';
import { SecurityPolicies, SecurityPoliciesWrapper } from './securitypolicy';
import { PreviewPermissions } from './securitypreview';
import {
  CollectionAccess,
  LegacyPermissions,
  SetCollection,
  SetPasswordPrompt,
  SetSuperAdmin,
  UserIdentityProviders,
  UserRoles,
} from './securityusercomponents';
import {
  useCollectionRoles,
  useUserAgents,
  useUserInstitutionalPolicies,
  useUserPolicies,
  useUserProviders,
  useUserRoles,
} from './securityuserhooks';
import type { SetAgentsResponse } from './useragentsplugin';
import { UserAgentsDialog } from './useragentsplugin';
import { UserInviteLinkPlugin } from './userinvitelinkplugin';

// FEATURE: allow editing linkages with external accounts
export function SecurityUser({
  user,
  initialCollection,
  collections,
  onOpenRole: handleOpenRole,
  onClose: handleClose,
  onDelete: handleDelete,
  onSave: handleSave,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly initialCollection: number | undefined;
  readonly collections: RA<SerializedResource<Collection>>;
  readonly onOpenRole: (collectionId: number, roleId: number) => void;
  readonly onClose: () => void;
  readonly onDelete: () => void;
  readonly onSave: (
    changedUser: SerializedResource<SpecifyUser>,
    user?: SerializedResource<SpecifyUser>
  ) => void;
}): JSX.Element {
  const collectionRoles = useCollectionRoles(collections);
  const userResource = React.useMemo(() => deserializeResource(user), [user]);
  const [userRoles, setUserRoles, initialUserRoles, changedRoles] =
    useUserRoles(userResource, collections);
  const [userPolicies, setUserPolicies, initialUserPolicies, changedPolicies] =
    useUserPolicies(userResource, collections, initialCollection);
  const [version, setVersion] = React.useState<number>(0);
  const userAgents = useUserAgents(userResource.id, collections, version);
  const identityProviders = useUserProviders(userResource.id);
  const [
    institutionPolicies,
    setInstitutionPolicies,
    initialInstitutionPolicies,
    changedInstitutionPolicies,
  ] = useUserInstitutionalPolicies(userResource);
  const [changedAgent, handleChangedAgent] = useBooleanState();

  const [password, setPassword] = useLiveState<string | undefined>(
    React.useCallback(
      () => (userResource.isNew() ? undefined : ''),
      [userResource]
    )
  );

  const previewAffected =
    changedPolicies || changedRoles || changedInstitutionPolicies;
  const isChanged =
    changedAgent || previewAffected || (password ?? '').length > 0;
  const changesMade = useIsModified(userResource) || isChanged;
  const loading = React.useContext(LoadingContext);

  const [rawCollectionId, setCollectionId] = React.useState<number>(
    initialCollection ?? -1
  );
  const collectionId =
    rawCollectionId === -1
      ? Array.isArray(collections)
        ? collections[0].id
        : -1
      : rawCollectionId;

  const mode = augmentMode('edit', userResource.isNew(), 'SpecifyUser');
  const [state, setState] = React.useState<
    | State<'Main'>
    | State<'SetPasswordDialog'>
    | State<
        'SettingAgents',
        {
          readonly response: SetAgentsResponse;
        }
      >
    | State<'SettingPassword'>
    | State<'NoAdminsError'>
  >({ type: 'Main' });

  const allActions = getAllActions(anyResource);
  const isSuperAdmin =
    institutionPolicies?.some(
      ({ resource, actions }) =>
        resource === anyResource &&
        allActions.every((action) => actions.includes(action))
    ) ?? false;

  const canSetPassword = hasPermission('/admin/user/password', 'update');
  const canCreateInviteLink = hasPermission(
    '/admin/user/invite_link',
    'create'
  );
  const canSeeInstitutionalPolicies = hasDerivedPermission(
    '/permissions/institutional_policies/user',
    'read'
  );
  return (
    <Container.Base className="flex-1">
      <BaseResourceView
        isLoading={false}
        resource={userResource}
        mode={mode}
        isSubForm={false}
      >
        {({ title, formatted, formElement, form }): JSX.Element => (
          <>
            <DataEntry.Header>
              <h3 className="text-2xl">{title}</h3>
              <AppTitle title={formatted} type="form" />
            </DataEntry.Header>
            {form(
              <>
                {canSetPassword || canCreateInviteLink ? (
                  <section>
                    <h4 className="text-xl">
                      {adminText('accountSetupOptions')}
                    </h4>
                    <div className="flex items-center gap-2">
                      <ErrorBoundary dismissable>
                        {canSetPassword && (
                          <PasswordPlugin
                            onSet={setPassword}
                            isNew={userResource.isNew()}
                          />
                        )}
                        {canCreateInviteLink && (
                          <UserInviteLinkPlugin
                            user={user}
                            identityProviders={identityProviders}
                          />
                        )}
                      </ErrorBoundary>
                    </div>
                  </section>
                ) : undefined}
                {canSeeInstitutionalPolicies && (
                  <section>
                    <h4 className="text-xl">
                      {schema.models.Institution.label}
                    </h4>
                    <div className="flex flex-col gap-2">
                      <ErrorBoundary dismissable>
                        <SetSuperAdmin
                          institutionPolicies={institutionPolicies}
                          isSuperAdmin={isSuperAdmin}
                          isCurrentUser={userResource.id === userInformation.id}
                          allActions={allActions}
                          onChange={setInstitutionPolicies}
                        />
                        {
                          /*
                           * If user is a super admin, they have all policies, so no
                           * sense in showing them
                           */
                          !isSuperAdmin &&
                            hasDerivedPermission(
                              '/permissions/institutional_policies/user',
                              'read'
                            ) && (
                              <SecurityPoliciesWrapper
                                policies={institutionPolicies}
                                header={adminText('institutionPolicies')}
                                collapsable={true}
                              >
                                <SecurityPolicies
                                  policies={institutionPolicies}
                                  isReadOnly={!userInformation.isadmin}
                                  scope="institution"
                                  onChange={setInstitutionPolicies}
                                  limitHeight
                                />
                              </SecurityPoliciesWrapper>
                            )
                        }
                      </ErrorBoundary>
                    </div>
                  </section>
                )}
                <ErrorBoundary dismissable>
                  {hasPermission('/admin/user/oic_providers', 'read') && (
                    <UserIdentityProviders
                      identityProviders={identityProviders}
                    />
                  )}
                </ErrorBoundary>
                <SetCollection
                  collectionId={collectionId}
                  collections={collections}
                  onChange={setCollectionId}
                />
                <SetPermissionContext
                  collectionId={collectionId}
                  fallback={
                    /*
                     * Reserve the space for roles, policies and preview when
                     * changed the collection and the permissions are still
                     * being fetched. This prevents loss of current scroll
                     * position
                     */
                    <div className="h-screen" />
                  }
                >
                  {(): JSX.Element => (
                    <>
                      <CollectionAccess
                        userPolicies={userPolicies}
                        onChange={setUserPolicies}
                        onChangedAgent={handleChangedAgent}
                        collectionId={collectionId}
                        userAgents={userAgents}
                        mode={mode}
                        isSuperAdmin={isSuperAdmin}
                      />
                      {hasPermission(
                        '/permissions/user/roles',
                        'read',
                        collectionId
                      ) && (
                        <UserRoles
                          collectionRoles={collectionRoles}
                          collectionId={collectionId}
                          userRoles={userRoles}
                          onChange={setUserRoles}
                          onOpenRole={handleOpenRole}
                        />
                      )}
                      {
                        /*
                         * If user is a super admin, they have all policies, so
                         * no sense in showing them
                         */
                        !isSuperAdmin &&
                        hasPermission(
                          '/permissions/policies/user',
                          'read',
                          collectionId
                        ) ? (
                          <SecurityPoliciesWrapper
                            policies={userPolicies?.[collectionId]}
                            header={adminText('customUserPolices')}
                            collapsable={false}
                          >
                            <SecurityPolicies
                              policies={userPolicies?.[collectionId]}
                              isReadOnly={
                                !hasPermission(
                                  '/permissions/policies/user',
                                  'update',
                                  collectionId
                                )
                              }
                              scope="collection"
                              onChange={(policies): void =>
                                typeof userPolicies === 'object'
                                  ? setUserPolicies(
                                      replaceKey(
                                        userPolicies,
                                        collectionId.toString(),
                                        policies
                                      )
                                    )
                                  : undefined
                              }
                              limitHeight
                            />
                          </SecurityPoliciesWrapper>
                        ) : undefined
                      }
                      {typeof userResource.id === 'number' && (
                        <ErrorBoundary dismissable>
                          <PreviewPermissions
                            userId={userResource.id}
                            userVersion={version}
                            collectionId={collectionId}
                            changesMade={previewAffected}
                            onOpenRole={(roleId): void =>
                              handleOpenRole(collectionId, roleId)
                            }
                          />
                        </ErrorBoundary>
                      )}
                    </>
                  )}
                </SetPermissionContext>
                <ErrorBoundary dismissable>
                  <LegacyPermissions userResource={userResource} mode={mode} />
                </ErrorBoundary>
              </>,
              '-mx-4 p-4 pt-0 flex-1 gap-8'
            )}
            <DataEntry.Footer>
              {changesMade ? (
                <Button.Gray onClick={handleClose}>
                  {commonText('cancel')}
                </Button.Gray>
              ) : (
                <Button.Blue onClick={handleClose}>
                  {commonText('close')}
                </Button.Blue>
              )}
              {!userResource.isNew() &&
              hasTablePermission('SpecifyUser', 'delete') &&
              userResource.id !== userInformation.id ? (
                <DeleteButton
                  resource={userResource}
                  onDeleted={handleDelete}
                />
              ) : undefined}
              <span className="flex-1 -ml-2" />
              {formElement !== null &&
              (mode === 'edit' ||
                // Check if has update access in any collection
                collections
                  /*
                   * Permissions are only fetched for collections that were
                   * displayed. If permissions aren't fetched, then safe to
                   * assume they were not edited
                   */
                  .filter(({ id }) => id in getOperationPermissions())
                  .some(
                    ({ id }) =>
                      hasPermission(
                        '/permissions/policies/user',
                        'update',
                        id
                      ) ||
                      hasPermission('/permissions/user/roles', 'update', id)
                  )) ? (
                <SaveButton
                  resource={userResource}
                  form={formElement}
                  canAddAnother={Array.isArray(userAgents)}
                  onSaving={(): undefined | false => {
                    if (userResource.isNew() && password === undefined) {
                      setState({
                        type: 'SetPasswordDialog',
                      });
                      return false;
                    }
                    return undefined;
                  }}
                  disabled={!changesMade || userAgents === undefined}
                  saveRequired={isChanged}
                  onSaved={({ newResource }): void =>
                    loading(
                      (hasPermission('/admin/user/agents', 'update')
                        ? ajax(
                            `/api/set_agents/${userResource.id}/`,
                            {
                              method: 'POST',
                              headers: {},
                              body: filterArray(
                                defined(userAgents).map(({ address }) =>
                                  idFromUrl(address.get('agent') ?? '')
                                )
                              ),
                            },
                            {
                              expectedResponseCodes: [
                                Http.NO_CONTENT,
                                Http.BAD_REQUEST,
                              ],
                            }
                          )
                        : Promise.resolve({
                            data: '',
                            status: Http.NO_CONTENT,
                          })
                      )
                        .then(({ data, status }) =>
                          status === Http.BAD_REQUEST
                            ? setState({
                                type: 'SettingAgents',
                                response: JSON.parse(data),
                              })
                            : Array.isArray(institutionPolicies) &&
                              changedInstitutionPolicies
                            ? ajax(
                                `/permissions/user_policies/institution/${userResource.id}/`,
                                {
                                  method: 'PUT',
                                  body: decompressPolicies(institutionPolicies),
                                  headers: { Accept: 'text/plain' },
                                },
                                {
                                  expectedResponseCodes: [
                                    Http.NO_CONTENT,
                                    Http.BAD_REQUEST,
                                  ],
                                }
                              ).then(({ data, status }) => {
                                /*
                                 * Removing admin status fails if current user
                                 * is the last admin
                                 */
                                if (status === Http.BAD_REQUEST) {
                                  const parsed: {
                                    readonly NoAdminUsersException: IR<never>;
                                  } = JSON.parse(data);
                                  if (
                                    typeof parsed === 'object' &&
                                    'NoAdminUsersException' in parsed
                                  )
                                    setState({
                                      type: 'NoAdminsError',
                                    });
                                  else
                                    setState({
                                      type: 'SettingAgents',
                                      response: JSON.parse(data),
                                    });
                                } else return true;
                                return undefined;
                              })
                            : true
                        )
                        .then((canContinue) =>
                          canContinue === true
                            ? Promise.all([
                                typeof password === 'string' && password !== ''
                                  ? ping(
                                      `/api/set_password/${userResource.id}/`,
                                      {
                                        method: 'POST',
                                        body: formData({ password }),
                                      },
                                      {
                                        expectedResponseCodes: [
                                          Http.NO_CONTENT,
                                        ],
                                      }
                                    )
                                  : undefined,
                                ...Object.entries(userRoles ?? {})
                                  .filter(
                                    ([collectionId, roles]) =>
                                      JSON.stringify(roles) !==
                                      JSON.stringify(
                                        initialUserRoles.current?.[collectionId]
                                      )
                                  )
                                  .map(async ([collectionId, roles]) =>
                                    Array.isArray(roles)
                                      ? ping(
                                          `/permissions/user_roles/${collectionId}/${userResource.id}/`,
                                          {
                                            method: 'PUT',
                                            body: roles.map(({ roleId }) => ({
                                              id: roleId,
                                            })),
                                          },
                                          {
                                            expectedResponseCodes: [
                                              Http.NO_CONTENT,
                                            ],
                                          }
                                        )
                                      : undefined
                                  ),
                                ...Object.entries(userPolicies ?? {})
                                  .filter(
                                    ([collectionId, policies]) =>
                                      JSON.stringify(policies) !==
                                      JSON.stringify(
                                        initialUserPolicies.current?.[
                                          collectionId
                                        ]
                                      )
                                  )
                                  .map(async ([collectionId, policies]) =>
                                    Array.isArray(policies)
                                      ? ping(
                                          `/permissions/user_policies/${collectionId}/${userResource.id}/`,
                                          {
                                            method: 'PUT',
                                            body: decompressPolicies(policies),
                                          },
                                          {
                                            expectedResponseCodes: [
                                              Http.NO_CONTENT,
                                            ],
                                          }
                                        )
                                      : undefined
                                  ),
                              ])
                                .then(() =>
                                  handleSave(
                                    serializeResource(userResource),
                                    f.maybe(newResource, serializeResource)
                                  )
                                )
                                .then(() => {
                                  if (typeof newResource === 'object') return;
                                  // Sync initial values
                                  initialUserRoles.current = userRoles ?? {};
                                  initialUserPolicies.current =
                                    userPolicies ?? {};
                                  initialInstitutionPolicies.current =
                                    institutionPolicies ?? [];
                                  // Update version & trigger reRender
                                  setVersion(version + 1);
                                  /*
                                   * Make form not submitted again for styling
                                   * purposes
                                   */
                                  formElement?.classList.add(
                                    className.notSubmittedForm
                                  );
                                })
                            : undefined
                        )
                    )
                  }
                />
              ) : undefined}
            </DataEntry.Footer>
          </>
        )}
      </BaseResourceView>
      {state.type === 'SetPasswordDialog' && (
        <SetPasswordPrompt
          onClose={(): void => setState({ type: 'Main' })}
          onSet={(): void => setState({ type: 'SettingPassword' })}
          onIgnore={(): void => {
            setPassword('');
            setState({ type: 'Main' });
          }}
        />
      )}
      {state.type === 'SettingPassword' && (
        <PasswordResetDialog
          onClose={(): void => setState({ type: 'Main' })}
          onSet={setPassword}
        />
      )}
      {state.type === 'SettingAgents' && (
        <ProtectedTable tableName="Division" action="read">
          <ProtectedAction resource="/admin/user/agents" action="update">
            <UserAgentsDialog
              userAgents={userAgents}
              userId={userResource.id}
              onClose={(): void => setState({ type: 'Main' })}
              mode={mode}
              response={state.response}
            />
          </ProtectedAction>
        </ProtectedTable>
      )}
      {state.type === 'NoAdminsError' && (
        <Dialog
          header={adminText('noAdminsErrorDialogHeader')}
          onClose={(): void => setState({ type: 'Main' })}
          buttons={commonText('close')}
        >
          {adminText('noAdminsErrorDialogText')}
        </Dialog>
      )}
    </Container.Base>
  );
}
