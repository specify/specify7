import React from 'react';

import { ajax, Http, ping } from '../ajax';
import type { Collection, SpecifyUser } from '../datamodel';
import { f } from '../functools';
import { replaceItem, replaceKey, sortFunction, toggleItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import {
  collectionAccessResource,
  hasPermission,
  hasTablePermission,
} from '../permissions';
import { schema } from '../schema';
import {
  anyAction,
  anyResource,
  decompressPolicies,
  fetchRoles,
  processPolicies,
} from '../securityutils';
import type { IR, RA } from '../types';
import { defined, filterArray } from '../types';
import { AdminStatusPlugin } from './adminstatusplugin';
import {
  Button,
  className,
  Container,
  DataEntry,
  Form,
  Input,
  Label,
  Select,
  Ul,
} from './basic';
import { ComboBox } from './combobox';
import { LoadingContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { useAsyncState, useIsModified, useUnloadProtect } from './hooks';
import { PasswordPlugin } from './passwordplugin';
import { augmentMode, BaseResourceView } from './resourceview';
import type { Policy } from './securitypolicy';
import { PoliciesView } from './securitypolicy';
import { PreviewPermissions } from './securitypreview';
import { UserAgentsPlugin } from './useragentsplugin';
import { UserCollectionsPlugin } from './usercollectionsplugin';
import { UserInviteLinkPlugin } from './userinvitelinkplugin';

export function UserView({
  user,
  initialCollection,
  collections,
  onOpenRole: handleOpenRole,
  onClose: handleClose,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly initialCollection: number;
  readonly collections: IR<SpecifyResource<Collection>>;
  readonly onOpenRole: (collectionId: number, roleId: number) => void;
  readonly onClose: (user?: SpecifyResource<SpecifyUser>) => void;
}): JSX.Element {
  // Fetching roles from all collections
  const [collectionRoles] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          Object.values(collections).map(async (collection) =>
            fetchRoles(collection.id, undefined).then(
              (roles) => [collection.id, roles] as const
            )
          )
        ).then((entries) => Object.fromEntries(entries)),
      [collections]
    ),
    false
  );

  // Fetching user roles in all collections
  const initialUserRoles = React.useRef<IR<RA<number>>>({});
  const [userRoles, setUserRoles] = useAsyncState<IR<RA<number>>>(
    React.useCallback(
      async () =>
        user.isNew()
          ? {}
          : hasPermission('/permissions/user/roles', 'read')
          ? Promise.all(
              Object.values(collections).map(async (collection) =>
                fetchRoles(collection.id, user.id).then(
                  (roles) =>
                    [
                      collection.id,
                      roles.map((role) => role.id).sort(sortFunction(f.id)),
                    ] as const
                )
              )
            )
              .then((entries) => Object.fromEntries(entries))
              .then((userRoles) => {
                initialUserRoles.current = userRoles;
                return userRoles;
              })
          : undefined,
      [user, collections]
    ),
    false
  );
  const changedRoles =
    typeof userRoles === 'object' &&
    Object.entries(userRoles).some(
      ([collectionId, roles]) =>
        JSON.stringify(roles) !==
        JSON.stringify(initialUserRoles.current[collectionId])
    );

  // Fetching user policies
  const initialUserPolicies = React.useRef<IR<RA<Policy>>>({});
  const [userPolicies, setUserPolicies] = useAsyncState(
    React.useCallback(
      async () =>
        user.isNew()
          ? {}
          : hasPermission('/permissions/policies/user', 'read')
          ? Promise.all(
              Object.values(collections).map(async (collection) =>
                ajax<IR<RA<string>>>(
                  `/permissions/user_policies/${collection.id}/${user.id}/`,
                  {
                    headers: { Accept: 'application/json' },
                  }
                ).then(
                  ({ data }) => [collection.id, processPolicies(data)] as const
                )
              )
            )
              .then((entries) => Object.fromEntries(entries))
              .then((policies) => {
                initialUserPolicies.current = policies;
                return policies;
              })
          : undefined,
      [user, collections]
    ),
    false
  );
  const changedPolices =
    typeof userPolicies === 'object' &&
    JSON.stringify(userPolicies) !==
      JSON.stringify(initialUserPolicies.current);

  // Fetching user institutional policies
  const initialInstitutionPolicies = React.useRef<RA<Policy>>([]);
  const [institutionPolicies, setInstitutionPolicies] = useAsyncState(
    React.useCallback(
      async () =>
        user.isNew()
          ? []
          : hasPermission('/permissions/policies/user', 'read')
          ? ajax<IR<RA<string>>>(
              `/permissions/user_policies/institution/${user.id}/`,
              {
                headers: { Accept: 'application/json' },
              }
            ).then(({ data }) => {
              const policies = processPolicies(data);
              initialInstitutionPolicies.current = policies;
              return policies;
            })
          : undefined,
      [user.id]
    ),
    false
  );
  const changedInstitutionPolicies =
    JSON.stringify(initialInstitutionPolicies.current) !==
    JSON.stringify(institutionPolicies);

  const changesMade =
    useIsModified(user) ||
    changedPolices ||
    changedRoles ||
    changedInstitutionPolicies;
  const unsetUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogMessage')
  );
  const [collectionId, setCollectionId] = React.useState(initialCollection);
  const loading = React.useContext(LoadingContext);

  const isSuperAdmin =
    institutionPolicies?.some(
      ({ resource, actions }) =>
        resource === anyResource && actions.includes(anyAction)
    ) ?? false;

  const hasCollectionAccess =
    userPolicies?.[collectionId].some(
      ({ resource, actions }) =>
        resource === collectionAccessResource && actions.includes('access')
    ) ?? false;

  const mode = augmentMode('edit', user?.isNew(), 'SpecifyUser');

  return (
    <Container.Base className="flex-1 overflow-y-auto">
      <Form
        className="contents"
        onSubmit={(): void =>
          loading(
            Promise.all([
              ...Object.entries(userRoles ?? {})
                .filter(
                  ([collectionId, roles]) =>
                    JSON.stringify(roles) !==
                    JSON.stringify(initialUserRoles.current[collectionId])
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
                    JSON.stringify(initialUserPolicies.current[collectionId])
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
              Array.isArray(institutionPolicies) && changedInstitutionPolicies
                ? ping(
                    `/permissions/user_policies/institution/${user.id}/`,
                    {
                      method: 'PUT',
                      body: decompressPolicies(institutionPolicies),
                    },
                    { expectedResponseCodes: [Http.NO_CONTENT] }
                  )
                : undefined,
            ]).then(f.zero(handleClose))
          )
        }
      >
        <BaseResourceView
          isLoading={false}
          resource={user}
          mode={mode}
          isSubForm={true}
        >
          {({ title, saveButton, form }): JSX.Element => {
            return (
              <>
                <DataEntry.Header>
                  <h3 className="text-xl">{`${adminText('user')} ${title}`}</h3>
                </DataEntry.Header>
                {form}
                <section>
                  <h4 className={className.headerGray}>
                    {commonText('actions')}
                  </h4>
                  <div className="flex gap-2">
                    {/* FIXME: update this to force consistency */}
                    {hasPermission('/admin/user/password', 'update') && (
                      <PasswordPlugin user={user} />
                    )}
                    {hasPermission('/admin/user/password', 'update') && (
                      <UserInviteLinkPlugin user={user} />
                    )}
                    {/* FIXME: update this to force consistency (and use new agents endpoint) */}
                    <UserAgentsPlugin
                      user={user}
                      mode={mode}
                      isRequired={hasCollectionAccess}
                    />
                    <Label.ForCheckbox>
                      <Input.Checkbox
                        isReadOnly={!hasPermission(anyResource, anyAction)}
                        disabled={typeof institutionPolicies === 'undefined'}
                        onValueChange={(): void =>
                          hasPermission(
                            '/permissions/policies/user',
                            'update'
                          ) && typeof institutionPolicies === 'object'
                            ? setInstitutionPolicies(
                                isSuperAdmin
                                  ? filterArray(
                                      institutionPolicies.map((policy) =>
                                        policy.resource === anyResource
                                          ? policy.actions.length === 1 &&
                                            policy.actions.includes(anyAction)
                                            ? undefined
                                            : replaceKey(
                                                policy,
                                                'actions',
                                                policy.actions.filter(
                                                  (action) =>
                                                    action !== anyAction
                                                )
                                              )
                                          : policy
                                      )
                                    )
                                  : f.var(
                                      institutionPolicies.findIndex(
                                        ({ resource }) =>
                                          resource === anyResource
                                      ),
                                      (index) =>
                                        index === -1
                                          ? [
                                              ...institutionPolicies,
                                              {
                                                resource: anyResource,
                                                actions: [anyAction],
                                              },
                                            ]
                                          : replaceItem(
                                              institutionPolicies,
                                              index,
                                              replaceKey(
                                                institutionPolicies[index],
                                                'actions',
                                                [
                                                  ...institutionPolicies[index]
                                                    .actions,
                                                  anyAction,
                                                ]
                                              )
                                            )
                                    )
                              )
                            : undefined
                        }
                        checked={isSuperAdmin}
                      />
                      {adminText('superAdmin')}
                    </Label.ForCheckbox>
                  </div>
                </section>
                {/* TODO: allow editing linkages with external accounts */}

                <Label.Generic>
                  <span className={className.headerGray}>
                    {commonText('collection')}
                  </span>
                  <Select
                    value={collectionId}
                    onValueChange={(value): void =>
                      setCollectionId(Number.parseInt(value))
                    }
                  >
                    {Object.values(collections).map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.get('collectionName')}
                      </option>
                    ))}
                  </Select>
                </Label.Generic>
                <div>
                  <Label.ForCheckbox>
                    <Input.Checkbox
                      isReadOnly={
                        !hasPermission(
                          '/permissions/policies/user',
                          'update'
                        ) || typeof userPolicies === 'undefined'
                      }
                      onValueChange={
                        hasPermission('/permissions/policies/user', 'update')
                          ? (): void =>
                              setUserPolicies(
                                typeof userPolicies === 'object'
                                  ? replaceKey(
                                      userPolicies,
                                      collectionId,
                                      hasCollectionAccess
                                        ? userPolicies[collectionId].filter(
                                            ({ resource }) =>
                                              resource !==
                                              collectionAccessResource
                                          )
                                        : [
                                            ...userPolicies[collectionId],
                                            {
                                              resource:
                                                collectionAccessResource,
                                              actions: ['access'],
                                            },
                                          ]
                                    )
                                  : undefined
                              )
                          : undefined
                      }
                      checked={hasCollectionAccess}
                    />
                    {adminText('collectionAccess')}
                  </Label.ForCheckbox>
                </div>
                {hasPermission('/permissions/user/roles', 'read') && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className={className.headerGray}>
                      {adminText('userRoles')}:
                    </legend>
                    <Ul className="flex flex-col gap-1">
                      {typeof collectionRoles === 'object' &&
                      typeof userRoles === 'object'
                        ? collectionRoles[collectionId].map((role) => (
                            <li
                              key={role.id}
                              className="flex items-center gap-2"
                            >
                              <Label.ForCheckbox>
                                <Input.Checkbox
                                  disabled={
                                    !hasPermission(
                                      '/permissions/user/roles',
                                      'update'
                                    )
                                  }
                                  checked={userRoles[collectionId].includes(
                                    role.id
                                  )}
                                  onValueChange={(): void =>
                                    setUserRoles(
                                      replaceKey(
                                        userRoles,
                                        collectionId.toString(),
                                        Array.from(
                                          toggleItem(
                                            userRoles[collectionId],
                                            role.id
                                          )
                                        ).sort(sortFunction(f.id))
                                      )
                                    )
                                  }
                                />
                                {role.name}
                              </Label.ForCheckbox>
                              <DataEntry.Edit
                                // TODO: trigger unload protect
                                onClick={(): void =>
                                  handleOpenRole(collectionId, role.id)
                                }
                              />
                            </li>
                          ))
                        : commonText('loading')}
                    </Ul>
                  </fieldset>
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
                            replaceKey(userPolicies, collectionId, policies)
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
                <section className="flex flex-col gap-2">
                  <h4 className={className.headerGray}>
                    {adminText('legacyPermissions')}
                  </h4>
                  <div className="flex gap-2">
                    <AdminStatusPlugin user={user} mode={mode} />
                    {hasPermission(
                      '/admin/user/sp6/collection_access',
                      'read'
                    ) && <UserCollectionsPlugin user={user} />}
                  </div>
                  {f.var(
                    defined(
                      schema.models.SpecifyUser.getLiteralField('userType')
                    ),
                    (userType) => (
                      <Label.Generic title={userType.getLocalizedDesc()}>
                        {userType.label}
                        <ComboBox
                          id={undefined}
                          model={user}
                          resource={user}
                          field={userType}
                          fieldName={userType.name}
                          pickListName={undefined}
                          defaultValue={undefined}
                          className="w-full"
                          mode={mode}
                          isRequired={true}
                          isDisabled={false}
                        />
                      </Label.Generic>
                    )
                  )}
                </section>
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
                  {!user.isNew() &&
                  // FIXME: notify parent of resource deletion
                  hasTablePermission(user.specifyModel.name, 'delete') ? (
                    <DeleteButton
                      model={user}
                      onDeleted={f.zero(handleClose)}
                    />
                  ) : undefined}
                  <span className="flex-1 -ml-2" />
                  {hasPermission('/permissions/policies/user', 'update') ||
                  hasPermission('/permissions/user/roles', 'update')
                    ? saveButton?.({
                        canAddAnother: true,
                        onSaving: console.error,
                        onSaved: ({ newResource }) => handleClose(newResource),
                        disabled: !changesMade,
                      })
                    : undefined}
                </DataEntry.Footer>
              </>
            );
          }}
        </BaseResourceView>
      </Form>
    </Container.Base>
  );
}
