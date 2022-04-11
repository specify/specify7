import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, formData, Http, ping } from '../ajax';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { replaceKey } from '../helpers';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { parseResourceUrl } from '../resource';
import { decompressPolicies } from '../securityutils';
import type { IR } from '../types';
import { defined, filterArray } from '../types';
import { Button, className, Container, DataEntry } from './basic';
import { LoadingContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { useBooleanState, useIsModified } from './hooks';
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
  UserRoles,
} from './securityusercomponents';
import {
  useCollectionRoles,
  useUserAgents,
  useUserInstitutionalPolicies,
  useUserPolicies,
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
  const userAgents = useUserAgents(user.id, collections);
  const [
    institutionPolicies,
    setInstitutionPolicies,
    changedInstitutionPolicies,
  ] = useUserInstitutionalPolicies(userResource);
  const [changedAgent, handleChangedAgent] = useBooleanState();

  const previewAffected =
    changedPolicies || changedRoles || changedInstitutionPolicies;
  const isChanged = changedAgent || previewAffected;
  const changesMade = useIsModified(userResource) || isChanged;
  const [collectionId, setCollectionId] = React.useState(initialCollection);
  const loading = React.useContext(LoadingContext);

  const mode = augmentMode('edit', userResource.isNew(), 'SpecifyUser');
  const [password, setPassword] = React.useState<string | undefined>(
    userResource.isNew() ? undefined : ''
  );
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
  >({ type: 'Main' });

  return (
    <Container.Base className="flex-1 gap-4 overflow-y-auto">
      <BaseResourceView
        isLoading={false}
        resource={userResource}
        mode={mode}
        isSubForm={false}
      >
        {({ title, formElement, form }): JSX.Element => {
          return (
            <>
              <div>
                <DataEntry.Header>
                  <h3 className="text-xl">{`${adminText('user')} ${title}`}</h3>
                </DataEntry.Header>
                {form}
                <section>
                  <h4 className={className.headerGray}>
                    {commonText('actions')}
                  </h4>
                  <div className="flex gap-2">
                    {hasPermission('/admin/user/password', 'update') && (
                      <PasswordPlugin onSet={setPassword} />
                    )}
                    {hasPermission('/admin/user/password', 'update') && (
                      <UserInviteLinkPlugin user={user} />
                    )}
                    <SetSuperAdmin
                      institutionPolicies={institutionPolicies}
                      onChange={setInstitutionPolicies}
                    />
                  </div>
                </section>
              </div>
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
              {hasPermission('/permissions/policies/user', 'read') && (
                <PoliciesView
                  policies={userPolicies?.[collectionId]}
                  isReadOnly={
                    !hasPermission('/permissions/policies/user', 'update')
                  }
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
              )}
              {typeof user.id === 'number' && (
                <PreviewPermissions
                  userId={user.id}
                  collectionId={collectionId}
                  changesMade={previewAffected}
                  onOpenRole={(roleId): void =>
                    handleOpenRole(collectionId, roleId)
                  }
                />
              )}
              <LegacyPermissions userResource={userResource} mode={mode} />
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
                hasTablePermission('SpecifyUser', 'delete') ? (
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
                              defined(userAgents).map(
                                ({ address }) =>
                                  parseResourceUrl(
                                    address.get('agent') ?? ''
                                  )?.[1]
                              )
                            ),
                          },
                          {
                            expectedResponseCodes: [
                              Http.NO_CONTENT,
                              Http.BAD_REQUEST,
                            ],
                          }
                        ).then(({ data, status }) =>
                          status === Http.BAD_REQUEST
                            ? setState({
                                type: 'SettingAgents',
                                response: JSON.parse(data),
                              })
                            : Promise.all([
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
                                Array.isArray(institutionPolicies) &&
                                changedInstitutionPolicies
                                  ? ping(
                                      `/permissions/user_policies/institution/${userResource.id}/`,
                                      {
                                        method: 'PUT',
                                        body: decompressPolicies(
                                          institutionPolicies
                                        ),
                                      },
                                      {
                                        expectedResponseCodes: [
                                          Http.NO_CONTENT,
                                        ],
                                      }
                                    )
                                  : undefined,
                              ]).then(() =>
                                handleSave(
                                  serializeResource(userResource),
                                  f.maybe(newResource, serializeResource)
                                )
                              )
                        )
                      )
                    }
                  />
                ) : undefined}
              </DataEntry.Footer>
            </>
          );
        }}
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
          userId={user.id}
          onClose={(): void => setState({ type: 'Main' })}
          mode={mode}
          response={state.response}
        />
      )}
    </Container.Base>
  );
}
