import React from 'react';

import { ajax, Http, ping } from '../ajax';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission } from '../permissions';
import {
  compressPolicies,
  decompressPolicies,
  fetchRoles,
} from '../securityutils';
import type { IR, RA } from '../types';
import { removeItem, replaceKey, sortFunction } from '../helpers';
import { f } from '../functools';
import {
  Button,
  className,
  Container,
  Form,
  H3,
  Input,
  Label,
  Select,
  Submit,
  Ul,
} from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useUnloadProtect } from './hooks';
import { icons } from './icons';
import { PoliciesView, Policy } from './securitypolicy';
import { PreviewPermissions } from './securitypreview';

export function UserView({
  user,
  initialCollection,
  collections,
  onOpenRole: handleOpenRole,
  onClose: handleClose,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly initialCollection: number;
  readonly collections: IR<SpecifyResource<Collection>>;
  readonly onOpenRole: (collectionId: number, roleId: number) => void;
  readonly onClose: () => void;
}): JSX.Element {
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
  const initialUserRoles = React.useRef<IR<RA<number>>>({});
  const [userRoles, setUserRoles] = useAsyncState<IR<RA<number>>>(
    React.useCallback(
      async () =>
        Promise.all(
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
          }),
      [user.id, collections]
    ),
    false
  );

  const initialUserPolicies = React.useRef<IR<RA<Policy>>>({});
  const [userPolicies, setUserPolicies] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          Object.values(collections).map(async (collection) =>
            ajax<RA<Policy>>(
              `/permissions/user_policies/${collection.id}/${user.id}/`,
              {
                headers: { Accept: 'application/json' },
              }
            ).then(
              ({ data }) => [collection.id, compressPolicies(data)] as const
            )
          )
        )
          .then((entries) => Object.fromEntries(entries))
          .then((policies) => {
            initialUserPolicies.current = policies;
            return policies;
          }),
      [user.id, collections]
    ),
    false
  );
  const changedPolices =
    typeof userPolicies === 'object' &&
    JSON.stringify(userPolicies) !==
      JSON.stringify(initialUserPolicies.current);
  const changedRoles =
    typeof userRoles === 'object' &&
    Object.entries(userRoles).some(
      ([collectionId, roles]) =>
        JSON.stringify(roles) !==
        JSON.stringify(initialUserRoles.current[collectionId])
    );
  const changesMade = changedPolices || changedRoles;
  const setUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogMessage')
  );
  const [collection, setCollection] = React.useState(initialCollection);
  const loading = React.useContext(LoadingContext);
  return (
    <Container.Base className="flex-1 overflow-y-auto">
      <Form
        className="contents"
        onSubmit={(): void =>
          typeof userRoles === 'object' && typeof userPolicies === 'object'
            ? loading(
                Promise.all([
                  ...Object.entries(userRoles)
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
                  ...Object.entries(userPolicies)
                    .filter(
                      ([collectionId, policies]) =>
                        JSON.stringify(policies) !==
                        JSON.stringify(
                          initialUserPolicies.current[collectionId]
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
                ]).then(handleClose)
              )
            : undefined
        }
      >
        <H3>{`${adminText('user')} ${user.name}`}</H3>
        <Label.Generic>
          {commonText('collection')}
          <Select
            value={collection}
            onValueChange={(value): void =>
              setCollection(Number.parseInt(value))
            }
          >
            {Object.values(collections).map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.get('collectionName')}
              </option>
            ))}
          </Select>
        </Label.Generic>
        <fieldset className="flex flex-col gap-2">
          <legend>{adminText('userRoles')}</legend>
          <Ul>
            {typeof collectionRoles === 'object' &&
            typeof userRoles === 'object'
              ? collectionRoles[collection].map((role) => (
                  <li key={role.id} className="flex items-center gap-2">
                    <Label.ForCheckbox>
                      <Input.Checkbox
                        disabled={
                          !hasPermission('/permissions/user/roles', 'update')
                        }
                        checked={userRoles[collection].includes(role.id)}
                        onValueChange={(isChecked): void =>
                          setUserRoles(
                            replaceKey(
                              userRoles,
                              collection.toString(),
                              Array.from(
                                isChecked
                                  ? removeItem(
                                      userRoles[collection],
                                      userRoles[collection].indexOf(role.id)
                                    )
                                  : [...userRoles[collection], role.id]
                              ).sort(sortFunction(f.id))
                            )
                          )
                        }
                      />
                      {role.name}
                    </Label.ForCheckbox>
                    <Button.Simple
                      className={`${className.redButton} print:hidden`}
                      title={commonText('edit')}
                      aria-label={commonText('edit')}
                      // TODO: trigger unload protect
                      onClick={(): void => handleOpenRole(collection, role.id)}
                    >
                      {icons.pencil}
                    </Button.Simple>
                  </li>
                ))
              : commonText('loading')}
          </Ul>
        </fieldset>
        <PoliciesView
          policies={userPolicies?.[collection]}
          isReadOnly={!hasPermission('/permissions/policies/user', 'update')}
          onChange={(policies): void =>
            typeof userPolicies === 'object'
              ? setUserPolicies(replaceKey(userPolicies, collection, policies))
              : undefined
          }
        />
        <PreviewPermissions
          userId={user.id}
          collectionId={collection}
          changesMade={changesMade}
          onOpenRole={(roleId): void => handleOpenRole(collection, roleId)}
        />
        <div className="flex gap-2">
          {changesMade ? (
            <Button.Gray
              // TODO: improve unload protect workflow
              onClick={(): void => setUnloadProtect(false, handleClose)}
            >
              {commonText('cancel')}
            </Button.Gray>
          ) : (
            <Button.Blue onClick={handleClose}>
              {commonText('close')}
            </Button.Blue>
          )}
          <Submit.Green disabled={!changesMade}>
            {commonText('save')}
          </Submit.Green>
        </div>
      </Form>
    </Container.Base>
  );
}
