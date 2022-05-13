import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, formData, Http, ping } from '../ajax';
import { error } from '../assert';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { replaceKey } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { idFromUrl } from '../resource';
import {
  anyResource,
  decompressPolicies,
  getAllActions,
} from '../securityutils';
import type { IR } from '../types';
import { defined, filterArray } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Container, DataEntry } from './basic';
import { AppTitle } from './common';
import { LoadingContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { useBooleanState, useIsModified, useLiveState } from './hooks';
import { Dialog } from './modaldialog';
import { PasswordPlugin, PasswordResetDialog } from './passwordplugin';
import { deserializeResource } from './resource';
import { augmentMode, BaseResourceView } from './resourceview';
import { SaveButton } from './savebutton';
import { PoliciesView } from './securitypolicy';
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

// TODO: allow editing linkages with external accounts
export function UserView({
  user,
  initialCollection,
  collections,
  onOpenRole: handleOpenRole,
  onClose: handleClose,
  onDelete: handleDelete,
  onSave: handleSave,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly initialCollection: number;
  readonly collections: IR<SerializedResource<Collection>>;
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
    useUserPolicies(userResource, collections);
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
  const [collectionId, setCollectionId] = React.useState(initialCollection);
  const loading = React.useContext(LoadingContext);

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
              <h3 className="text-xl">{title}</h3>
              <AppTitle title={formatted} type="form" />
            </DataEntry.Header>
            {form(
              <>
                <div>
                  <section>
                    <h4 className={className.headerGray}>
                      {commonText('actions')}
                    </h4>
                    <div className="flex items-center gap-2">
                      {hasPermission('/admin/user/password', 'update') && (
                        <PasswordPlugin onSet={setPassword} />
                      )}
                      {hasPermission('/admin/user/invite_link', 'create') && (
                        <UserInviteLinkPlugin
                          user={user}
                          identityProviders={identityProviders}
                        />
                      )}
                      <SetSuperAdmin
                        institutionPolicies={institutionPolicies}
                        isSuperAdmin={isSuperAdmin}
                        allActions={allActions}
                        onChange={setInstitutionPolicies}
                      />
                    </div>
                  </section>
                </div>
                {!isSuperAdmin &&
                  hasPermission('/permissions/policies/user', 'read') && (
                    <PoliciesView
                      policies={institutionPolicies}
                      isReadOnly={!userInformation.isadmin}
                      scope="institution"
                      onChange={setInstitutionPolicies}
                      header={adminText('institutionPolicies')}
                      collapsable={true}
                    />
                  )}
                {hasPermission('/admin/user/oic_providers', 'read') && (
                  <UserIdentityProviders
                    identityProviders={identityProviders}
                  />
                )}
                <SetCollection
                  collectionId={collectionId}
                  collections={collections}
                  onChange={setCollectionId}
                />
                <CollectionAccess
                  userPolicies={userPolicies}
                  onChange={setUserPolicies}
                  onChangedAgent={handleChangedAgent}
                  collectionId={collectionId}
                  userAgents={userAgents}
                  mode={mode}
                />
                {hasPermission('/permissions/user/roles', 'read') && (
                  <UserRoles
                    collectionRoles={collectionRoles}
                    collectionId={collectionId}
                    userRoles={userRoles}
                    onChange={setUserRoles}
                    onOpenRole={handleOpenRole}
                  />
                )}
                {!isSuperAdmin &&
                  hasPermission('/permissions/policies/user', 'read') && (
                    <PoliciesView
                      policies={userPolicies?.[collectionId]}
                      isReadOnly={
                        !hasPermission('/permissions/policies/user', 'update')
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
                      collapsable={false}
                    />
                  )}
                {typeof userResource.id === 'number' && (
                  <PreviewPermissions
                    userId={userResource.id}
                    userVersion={version}
                    collectionId={collectionId}
                    changesMade={previewAffected}
                    onOpenRole={(roleId): void =>
                      handleOpenRole(collectionId, roleId)
                    }
                  />
                )}
                <LegacyPermissions userResource={userResource} mode={mode} />
              </>,
              'overflow-y-auto -mx-4 p-4 pt-0'
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
              {(hasPermission('/permissions/policies/user', 'update') ||
                hasPermission('/permissions/user/roles', 'update') ||
                mode === 'edit') &&
              formElement !== null ? (
                <SaveButton
                  resource={userResource}
                  form={formElement}
                  canAddAnother={true}
                  onSaving={(): undefined | false => {
                    if (
                      userResource.isNew() &&
                      typeof password === 'undefined'
                    ) {
                      setState({
                        type: 'SetPasswordDialog',
                      });
                      return false;
                    }
                    return undefined;
                  }}
                  disabled={!changesMade || typeof userAgents === 'undefined'}
                  saveRequired={isChanged}
                  onSaved={({ newResource }): void =>
                    loading(
                      ajax(
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
                                    error(
                                      'Failed updating institution policies',
                                      {
                                        data,
                                        status,
                                        userResource,
                                      }
                                    );
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
                                    ping(
                                      `/permissions/user_roles/${collectionId}/${userResource.id}/`,
                                      {
                                        method: 'PUT',
                                        body: roles.map((id) => ({ id })),
                                      },
                                      {
                                        expectedResponseCodes: [
                                          Http.NO_CONTENT,
                                        ],
                                      }
                                    )
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
                                    ping(
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
        <UserAgentsDialog
          userAgents={userAgents}
          userId={userResource.id}
          onClose={(): void => setState({ type: 'Main' })}
          mode={mode}
          response={state.response}
        />
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
