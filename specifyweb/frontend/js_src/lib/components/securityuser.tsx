import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, formData, Http, ping } from '../ajax';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { decompressPolicies } from '../securityutils';
import type { IR } from '../types';
import { defined, filterArray } from '../types';
import { Button, className, Container, DataEntry, Form } from './basic';
import { LoadingContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { useIsModified, useUnloadProtect } from './hooks';
import { PasswordPlugin, PasswordResetDialog } from './passwordplugin';
import { deserializeResource } from './resource';
import { augmentMode, BaseResourceView } from './resourceview';
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
import { UserInviteLinkPlugin } from './userinvitelinkplugin';
import { SetAgentsResponse, UserAgentsDialog } from './useragentsplugin';
import { parseResourceUrl } from '../resource';

// TODO: allow editing linkages with external accounts
export function UserView({
  user,
  initialCollection,
  collections,
  onOpenRole: handleOpenRole,
  onClose: handleClose,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly initialCollection: number;
  readonly collections: IR<SerializedResource<Collection>>;
  readonly onOpenRole: (collectionId: number, roleId: number) => void;
  readonly onClose: (user?: SpecifyResource<SpecifyUser> | false) => void;
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
    initialInstitutionPolicies,
    changedInstitutionPolicies,
  ] = useUserInstitutionalPolicies(userResource);

  const changesMade =
    useIsModified(userResource) ||
    changedPolicies ||
    changedRoles ||
    changedInstitutionPolicies;
  const unsetUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogMessage')
  );
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
  // FIXME: make sure agents are set before saving

  return (
    <Container.Base className="flex-1 gap-4 overflow-y-auto">
      <Form className="contents">
        <BaseResourceView
          isLoading={false}
          resource={userResource}
          mode={mode}
          isSubForm={true}
        >
          {({ title, saveButton, form }): JSX.Element => {
            return (
              <>
                <div>
                  <DataEntry.Header>
                    <h3 className="text-xl">{`${adminText(
                      'user'
                    )} ${title}`}</h3>
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
                <PreviewPermissions
                  userId={user.id}
                  collectionId={collectionId}
                  changesMade={changesMade}
                  onOpenRole={(roleId): void =>
                    handleOpenRole(collectionId, roleId)
                  }
                />
                <LegacyPermissions userResource={userResource} mode={mode} />
                <DataEntry.Footer>
                  {changesMade ? (
                    <Button.Gray
                      onClick={(): void => {
                        unsetUnloadProtect();
                        handleClose();
                      }}
                    >
                      {commonText('cancel')}
                    </Button.Gray>
                  ) : (
                    <Button.Blue onClick={f.zero(handleClose)}>
                      {commonText('close')}
                    </Button.Blue>
                  )}
                  {!userResource.isNew() &&
                  hasTablePermission('SpecifyUser', 'delete') ? (
                    <DeleteButton
                      model={userResource}
                      onDeleted={f.zero(handleClose)}
                    />
                  ) : undefined}
                  <span className="flex-1 -ml-2" />
                  {hasPermission('/permissions/policies/user', 'update') ||
                  hasPermission('/permissions/user/roles', 'update') ||
                  mode === 'edit'
                    ? saveButton?.({
                        canAddAnother: true,
                        onSaving() {
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
                        },
                        disabled:
                          !changesMade || typeof userAgents === 'undefined',
                        onSaved: ({ newResource }) =>
                          loading(
                            Promise.all([
                              typeof password === 'string' && password !== ''
                                ? ping(
                                    `/api/set_password/${user.id}/`,
                                    {
                                      method: 'POST',
                                      body: formData({ password }),
                                    },
                                    { expectedResponseCodes: [Http.NO_CONTENT] }
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
                                    `/permissions/user_roles/${collectionId}/${user.id}/`,
                                    {
                                      method: 'PUT',
                                      body: roles.map((id) => ({ id })),
                                    },
                                    { expectedResponseCodes: [Http.NO_CONTENT] }
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
                                    `/permissions/user_policies/${collectionId}/${user.id}/`,
                                    {
                                      method: 'PUT',
                                      body: decompressPolicies(policies),
                                    },
                                    { expectedResponseCodes: [Http.NO_CONTENT] }
                                  )
                                ),
                              Array.isArray(institutionPolicies) &&
                              changedInstitutionPolicies
                                ? ping(
                                    `/permissions/user_policies/institution/${user.id}/`,
                                    {
                                      method: 'PUT',
                                      body: decompressPolicies(
                                        institutionPolicies
                                      ),
                                    },
                                    { expectedResponseCodes: [Http.NO_CONTENT] }
                                  )
                                : undefined,
                            ])
                              .then(async () =>
                                ajax(
                                  `/api/set_agents/${user.id}`,
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
                                      Http.OK,
                                      Http.NO_CONTENT,
                                    ],
                                  }
                                )
                              )
                              .then(({ data, status }) => {
                                // Mark resources as saved
                                initialUserRoles.current = userRoles ?? {};
                                initialUserPolicies.current =
                                  userPolicies ?? {};
                                initialInstitutionPolicies.current =
                                  institutionPolicies ?? [];
                                if (status === Http.OK)
                                  handleClose(newResource);
                                else
                                  setState({
                                    type: 'SettingAgents',
                                    response: JSON.parse(data),
                                  });
                              })
                          ),
                      })
                    : undefined}
                </DataEntry.Footer>
              </>
            );
          }}
        </BaseResourceView>
      </Form>
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
