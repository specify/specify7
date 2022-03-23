import React from 'react';

import { Http, ping } from '../ajax';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { fetchRoles } from '../securityutils';
import type { IR, RA } from '../types';
import { f, sortFunction } from '../wbplanviewhelper';
import { Button, Form, H3, Input, Label, Select, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useUnloadProtect } from './hooks';
import { icons } from './icons';
import { removeItem, replaceKey } from './wbplanviewstate';

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
  const changesMade =
    typeof userRoles === 'object' &&
    Object.entries(userRoles).some(
      ([collectionId, roles]) =>
        JSON.stringify(roles) !==
        JSON.stringify(initialUserRoles.current[collectionId])
    );
  const setUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogMessage')
  );
  const [collection, setCollection] = React.useState(initialCollection);
  const loading = React.useContext(LoadingContext);
  return (
    <Form
      className="contents"
      onSubmit={(): void =>
        typeof userRoles === 'object'
          ? loading(
              Promise.all(
                Object.entries(userRoles)
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
                  )
              ).then(handleClose)
            )
          : undefined
      }
    >
      <H3>{user.name}</H3>
      <Label.Generic>
        {commonText('collection')}
        <Select
          value={collection}
          onValueChange={(value): void => setCollection(Number.parseInt(value))}
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
          {typeof collectionRoles === 'object' && typeof userRoles === 'object'
            ? collectionRoles[collection].map((role) => (
                <li key={role.id}>
                  <Label.ForCheckbox>
                    <Input.Checkbox
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
                  <Button.Blue
                    title={commonText('edit')}
                    aria-label={commonText('edit')}
                    // TODO: trigger unload protect
                    onClick={(): void => handleOpenRole(collection, role.id)}
                  >
                    {icons.pencil}
                  </Button.Blue>
                </li>
              ))
            : commonText('loading')}
        </Ul>
      </fieldset>
      <span className="flex-1 -mt-2" />
      <div className="flex gap-2">
        {changesMade ? (
          <Button.Gray
            // TODO: improve unload protect workflow
            onClick={(): void => setUnloadProtect(false, handleClose)}
          >
            {commonText('cancel')}
          </Button.Gray>
        ) : (
          <Button.Blue onClick={handleClose}>{commonText('close')}</Button.Blue>
        )}
        <Submit.Green disabled={!changesMade}>
          {commonText('save')}
        </Submit.Green>
      </div>
    </Form>
  );
}
