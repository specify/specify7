import React from 'react';
import { useOutletContext, useParams } from 'react-router';
import { useLocation, useNavigate } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useIsModified } from '../../hooks/useIsModified';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { removeKey, replaceKey } from '../../utils/utils';
import { Container } from '../Atoms';
import { className } from '../Atoms/className';
import { DataEntry } from '../Atoms/DataEntry';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { addMissingFields } from '../DataModel/addMissingFields';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { SpecifyUser } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useResourceView } from '../Forms/BaseResourceView';
import { DeleteButton } from '../Forms/DeleteButton';
import { useAvailableCollections } from '../Forms/OtherCollectionView';
import { augmentMode } from '../Forms/ResourceView';
import { SaveButton } from '../Forms/Save';
import { userInformation } from '../InitialContext/userInformation';
import { AppTitle } from '../Molecules/AppTitle';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { getOperationPermissions } from '../Permissions';
import { SetPermissionContext } from '../Permissions/Context';
import {
  hasDerivedPermission,
  hasPermission,
  hasTablePermission,
} from '../Permissions/helpers';
import {
  ProtectedAction,
  ProtectedTable,
} from '../Permissions/PermissionDenied';
import { locationToState, useStableLocation } from '../Router/RouterState';
import type { SecurityOutlet } from '../Toolbar/Security';
import type { SetAgentsResponse } from './MissingAgentsDialog';
import { MissingAgentsDialog } from './MissingAgentsDialog';
import { SecurityPolicies, SecurityPoliciesWrapper } from './Policies';
import { decompressPolicies } from './policyConverter';
import { PreviewPermissions } from './Preview';
import { PasswordResetDialog, SetPassword } from './SetPassword';
import { CollectionAccess, SetCollection } from './UserCollections';
import {
  LegacyPermissions,
  SetPasswordPrompt,
  SetSuperAdmin,
  UserIdentityProviders,
  UserRoles,
} from './UserComponents';
import { useCollectionRoles, useUserAgents, useUserRoles } from './UserHooks';
import { UserInviteLink } from './UserInviteLink';
import {
  useUserInstitutionalPolicies,
  useUserPolicies,
  useUserProviders,
} from './UserPolicyHooks';
import { anyResource, getAllActions } from './utils';

export function SecurityUser(): JSX.Element {
  const location = useStableLocation(useLocation());
  const state = locationToState(location, 'SecurityUser');
  const { userId = '' } = useParams();
  const {
    getSetUsers: [users, setUsers],
  } = useOutletContext<SecurityOutlet>();
  const user = React.useMemo(() => {
    if (typeof state?.user === 'object') return state.user;
    const parsedUserId = f.parseInt(userId);
    return typeof parsedUserId === 'number'
      ? users?.[parsedUserId]
      : addMissingFields('SpecifyUser', {});
  }, [users, userId, state?.user]);

  const navigate = useNavigate();
  return typeof user === 'object' && typeof users === 'object' ? (
    <UserView
      initialCollectionId={state?.initialCollectionId}
      user={user}
      onAdd={(newUser): void => {
        navigate(`/specify/security/user/new/`, {
          state: {
            type: 'SecurityUser',
            initialCollectionId: state?.initialCollectionId,
            user: serializeResource(newUser),
          },
        });
      }}
      onDeleted={(): void => {
        setUsers(removeKey(users, user.id.toString()));
        navigate('/specify/security/', { replace: true });
      }}
      onSave={(changedUser): void => {
        setUsers({
          ...users,
          [changedUser.id.toString()]: changedUser,
        });
        navigate(`/specify/security/user/${changedUser.id}/`, {
          state: {
            type: 'SecurityUser',
            initialCollectionId: state?.initialCollectionId,
            user: changedUser,
          },
          replace: true,
        });
      }}
    />
  ) : (
    <LoadingScreen />
  );
}

// FEATURE: allow editing linkages with external accounts
function UserView({
  user,
  initialCollectionId,
  onSave: handleSave,
  onAdd: handleAdd,
  onDeleted: handleDeleted,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly initialCollectionId: number | undefined;
  readonly onSave: (changedUser: SerializedResource<SpecifyUser>) => void;
  readonly onAdd: (resource: SpecifyResource<SpecifyUser>) => void;
  readonly onDeleted: () => void;
}): JSX.Element {
  const collections = useAvailableCollections();
  const collectionRoles = useCollectionRoles(collections);
  const userResource = React.useMemo(() => deserializeResource(user), [user]);
  useErrorContext('userResource', userResource);
  const [userRoles, setUserRoles, initialUserRoles, changedRoles] =
    useUserRoles(userResource, collections);

  const [userPolicies, setUserPolicies, initialUserPolicies, changedPolicies] =
    useUserPolicies(userResource, collections, initialCollectionId);

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
    initialCollectionId ?? -1
  );
  const collectionId =
    rawCollectionId === -1
      ? Array.isArray(collections)
        ? collections[0].id
        : -1
      : rawCollectionId;

  const mode = augmentMode('edit', userResource.isNew(), 'SpecifyUser');
  const [state, setState] = React.useState<
    | State<
        'SettingAgents',
        {
          readonly response: SetAgentsResponse;
        }
      >
    | State<'Main'>
    | State<'NoAdminsError'>
    | State<'SetPasswordDialog'>
    | State<'SettingPassword'>
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

  const { title, formatted, formElement, form } = useResourceView({
    isLoading: false,
    isSubForm: false,
    mode,
    resource: userResource,
  });

  return (
    <Container.Base className="flex-1">
      <DataEntry.Header>
        <h3 className="text-2xl">{title}</h3>
        <AppTitle title={formatted} />
      </DataEntry.Header>
      {form(
        <>
          {canSetPassword || canCreateInviteLink ? (
            <section>
              <h4 className="text-xl">{userText.accountSetupOptions()}</h4>
              <div className="flex items-center gap-2">
                <ErrorBoundary dismissible>
                  {canSetPassword && (
                    <SetPassword
                      isNew={userResource.isNew()}
                      onSet={setPassword}
                    />
                  )}
                  {canCreateInviteLink && (
                    <UserInviteLink
                      identityProviders={identityProviders}
                      user={user}
                    />
                  )}
                </ErrorBoundary>
              </div>
            </section>
          ) : undefined}
          {canSeeInstitutionalPolicies && (
            <section>
              <h4 className="text-xl">{schema.models.Institution.label}</h4>
              <div className="flex flex-col gap-2">
                <ErrorBoundary dismissible>
                  <SetSuperAdmin
                    allActions={allActions}
                    institutionPolicies={institutionPolicies}
                    isCurrentUser={userResource.id === userInformation.id}
                    isSuperAdmin={isSuperAdmin}
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
                          collapsable
                          header={userText.institutionPolicies()}
                          policies={institutionPolicies}
                        >
                          <SecurityPolicies
                            isReadOnly={!userInformation.isadmin}
                            limitHeight
                            policies={institutionPolicies}
                            scope="institution"
                            onChange={setInstitutionPolicies}
                          />
                        </SecurityPoliciesWrapper>
                      )
                  }
                </ErrorBoundary>
              </div>
            </section>
          )}
          <ErrorBoundary dismissible>
            {hasPermission('/admin/user/oic_providers', 'read') && (
              <UserIdentityProviders identityProviders={identityProviders} />
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
                  collectionId={collectionId}
                  isSuperAdmin={isSuperAdmin}
                  mode={mode}
                  userAgents={userAgents}
                  userPolicies={userPolicies}
                  onChange={setUserPolicies}
                  onChangedAgent={handleChangedAgent}
                />
                {hasPermission(
                  '/permissions/user/roles',
                  'read',
                  collectionId
                ) && (
                  <UserRoles
                    collectionId={collectionId}
                    collectionRoles={collectionRoles}
                    isReadOnly={userPolicies?.[collectionId]?.length === 0}
                    userRoles={userRoles}
                    onChange={setUserRoles}
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
                      collapsable={false}
                      header={userText.customUserPolices()}
                      policies={userPolicies?.[collectionId]}
                    >
                      <SecurityPolicies
                        isReadOnly={
                          !hasPermission(
                            '/permissions/policies/user',
                            'update',
                            collectionId
                          )
                        }
                        limitHeight
                        policies={userPolicies?.[collectionId]}
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
                      />
                    </SecurityPoliciesWrapper>
                  ) : undefined
                }
                {typeof userResource.id === 'number' && (
                  <ErrorBoundary dismissible>
                    <PreviewPermissions
                      changesMade={previewAffected}
                      collectionId={collectionId}
                      userId={userResource.id}
                      userVersion={version}
                    />
                  </ErrorBoundary>
                )}
              </>
            )}
          </SetPermissionContext>
          <ErrorBoundary dismissible>
            <LegacyPermissions mode={mode} userResource={userResource} />
          </ErrorBoundary>
        </>,
        '-mx-4 p-4 pt-0 flex-1 gap-8 [&_input]:max-w-[min(100%,var(--max-field-width))] overflow-auto'
      )}
      <DataEntry.Footer>
        {changesMade ? (
          <Link.Gray href="/specify/security/">{commonText.cancel()}</Link.Gray>
        ) : (
          <Link.Blue href="/specify/security/">{commonText.close()}</Link.Blue>
        )}
        {!userResource.isNew() &&
        hasTablePermission('SpecifyUser', 'delete') &&
        userResource.id !== userInformation.id ? (
          <DeleteButton resource={userResource} onDeleted={handleDeleted} />
        ) : undefined}
        <span className="-ml-2 flex-1" />
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
                hasPermission('/permissions/policies/user', 'update', id) ||
                hasPermission('/permissions/user/roles', 'update', id)
            )) ? (
          <SaveButton
            disabled={!changesMade || userAgents === undefined}
            form={formElement}
            resource={userResource}
            saveRequired={isChanged}
            onAdd={Array.isArray(userAgents) ? handleAdd : undefined}
            onSaved={(): void =>
              /*
               * Need to do requests in series rather than parallel as
               * some are expected to fail when user is not properly
               * assigned agents
               */
              loading(
                (hasPermission('/admin/user/agents', 'update')
                  ? ajax(
                      `/api/set_agents/${userResource.id}/`,
                      {
                        method: 'POST',
                        headers: {},
                        body: filterArray(
                          userAgents!.map(({ address }) =>
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
                                  expectedResponseCodes: [Http.NO_CONTENT],
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
                                      expectedResponseCodes: [Http.NO_CONTENT],
                                    }
                                  )
                                : undefined
                            ),
                          ...Object.entries(userPolicies ?? {})
                            .filter(
                              ([collectionId, policies]) =>
                                JSON.stringify(policies) !==
                                JSON.stringify(
                                  initialUserPolicies.current?.[collectionId]
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
                                      expectedResponseCodes: [Http.NO_CONTENT],
                                    }
                                  )
                                : undefined
                            ),
                        ])
                          .then(() =>
                            handleSave(serializeResource(userResource))
                          )
                          .then(() => {
                            // Sync initial values
                            initialUserRoles.current = userRoles ?? {};
                            initialUserPolicies.current = userPolicies ?? {};
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
            onSaving={(): false | undefined => {
              if (
                userResource.isNew() &&
                password === undefined &&
                canSetPassword
              ) {
                setState({
                  type: 'SetPasswordDialog',
                });
                return false;
              }
              return undefined;
            }}
          />
        ) : undefined}
      </DataEntry.Footer>
      {state.type === 'SetPasswordDialog' && (
        <SetPasswordPrompt
          onClose={(): void => setState({ type: 'Main' })}
          onIgnore={(): void => {
            setPassword('');
            setState({ type: 'Main' });
          }}
          onSet={(): void => setState({ type: 'SettingPassword' })}
        />
      )}
      {state.type === 'SettingPassword' && (
        <PasswordResetDialog
          onClose={(): void => setState({ type: 'Main' })}
          onSet={setPassword}
        />
      )}
      {state.type === 'SettingAgents' && (
        <ProtectedTable action="read" tableName="Division">
          <ProtectedAction action="update" resource="/admin/user/agents">
            <MissingAgentsDialog
              mode={mode}
              response={state.response}
              userAgents={userAgents}
              userId={userResource.id}
              onClose={(): void => setState({ type: 'Main' })}
            />
          </ProtectedAction>
        </ProtectedTable>
      )}
      {state.type === 'NoAdminsError' && (
        <Dialog
          buttons={commonText.close()}
          header={userText.cantRemoveLastAdmin()}
          onClose={(): void => setState({ type: 'Main' })}
        >
          {userText.cantRemoveLastAdminDescription()}
        </Dialog>
      )}
    </Container.Base>
  );
}
