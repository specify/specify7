import React from 'react';
import type { State } from 'typesafe-reducer';

import type { Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission } from '../permissions';
import { schema } from '../schema';
import {
  compressPolicies,
  decompressPolicies,
  removeIncompletePolicies,
} from '../securityutils';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { Button, Form, H3, Input, Label, Submit } from './basic';
import { useLiveState, useUnloadProtect } from './hooks';
import { icons } from './icons';
import { SearchDialog } from './searchdialog';
import type { Policy } from './securitypolicy';
import { PoliciesView } from './securitypolicy';
import { replaceKey } from './wbplanviewstate';

export type NewRole = {
  readonly id: number | undefined;
  readonly name: string;
  readonly policies: RA<Policy>;
};

export type Role = NewRole & {
  readonly id: number;
};

export type UserRoles = IR<{
  readonly user: SerializedResource<SpecifyUser>;
  readonly roles: RA<number>;
}>;

export function RoleView({
  role: initialRole,
  collection,
  userRoles,
  onDelete: handleDelete,
  onSave: handleSave,
  onClose: handleClose,
  onOpenUser: handleOpenUser,
  onAddUser: handleAddUser,
}: {
  readonly role: Role | NewRole;
  readonly collection: SpecifyResource<Collection>;
  readonly userRoles: UserRoles | undefined;
  /*
   * All these are delegated to the parent resource so that the parent
   * can update its list of roles
   */
  readonly onSave: (role: Role | NewRole) => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
  readonly onOpenUser: (user: SerializedResource<SpecifyUser>) => void;
  readonly onAddUser: (user: SpecifyResource<SpecifyUser>) => void;
}): JSX.Element {
  const [role, setRole] = useLiveState(
    React.useCallback(
      () =>
        replaceKey(
          initialRole,
          'policies',
          compressPolicies(initialRole.policies)
        ),
      [initialRole]
    )
  );
  const changesMade = JSON.stringify(initialRole) !== JSON.stringify(role);
  const setUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogMessage')
  );
  const [state, setState] = useLiveState<
    | State<'MainState'>
    | State<
        'AddUserState',
        { readonly templateResource: SpecifyResource<SpecifyUser> }
      >
    // Close AddUser dialog when new user is added
  >(React.useCallback(() => ({ type: 'MainState' }), [userRoles]));
  const usersWithRole =
    typeof userRoles === 'object' && typeof role.id === 'number'
      ? Object.values(userRoles).filter(({ roles }) =>
          roles.includes(defined(role.id))
        )
      : undefined;

  const isReadOnly = !hasPermission('/permissions/roles', 'update');

  return (
    <Form
      onSubmit={(): void =>
        handleSave(
          replaceKey(
            role,
            'policies',
            decompressPolicies(removeIncompletePolicies(role.policies))
          )
        )
      }
      className="contents"
    >
      <H3>{`${adminText('role')} ${role.name}`}</H3>
      <Button.LikeLink onClick={handleClose}>
        {icons.arrowLeft}
        {collection.get('collectionName')}
      </Button.LikeLink>
      {!isReadOnly && (
        <Label.Generic>
          {commonText('name')}
          <Input.Text
            value={role.name}
            onValueChange={(name): void =>
              setRole(replaceKey(role, 'name', name))
            }
            required
            maxLength={1024}
          />
        </Label.Generic>
      )}
      {typeof role.id === 'number' && (
        <fieldset className="flex flex-col gap-2">
          <legend>{adminText('users')}</legend>
          {typeof usersWithRole === 'object' ? (
            <>
              <ul>
                {Object.values(usersWithRole)
                  .filter(({ roles }) => roles.includes(defined(role.id)))
                  .map(({ user }) => (
                    <li key={user.id}>
                      <Button.LikeLink
                        // TODO: trigger unload protect
                        onClick={(): void => handleOpenUser(user)}
                      >
                        {user.name}
                      </Button.LikeLink>
                    </li>
                  ))}
              </ul>
              {hasPermission('/permissions/user/roles', 'update') && (
                <div>
                  <Button.Green
                    onClick={(): void =>
                      setState({
                        type: 'AddUserState',
                        templateResource:
                          new schema.models.SpecifyUser.Resource(),
                      })
                    }
                  >
                    {commonText('add')}
                  </Button.Green>
                </div>
              )}
              {state.type === 'AddUserState' && (
                <SearchDialog
                  forceCollection={undefined}
                  extraFilters={[
                    {
                      field: 'id',
                      operation: 'notIn',
                      values: usersWithRole.map(({ user }) =>
                        user.id.toString()
                      ),
                    },
                  ]}
                  templateResource={state.templateResource}
                  onClose={(): void => setState({ type: 'MainState' })}
                  onSelected={handleAddUser}
                />
              )}
            </>
          ) : (
            commonText('loading')
          )}
        </fieldset>
      )}
      <PoliciesView
        policies={role.policies}
        onChange={(policies): void =>
          setRole(replaceKey(role, 'policies', policies))
        }
        isReadOnly={isReadOnly}
      />
      <div className="flex gap-2">
        {/* FIXME: handle deletion of role with users */}
        {typeof role.id === 'number' &&
        hasPermission('/permissions/roles', 'delete') ? (
          <Button.Red onClick={handleDelete}>{commonText('remove')}</Button.Red>
        ) : undefined}
        {changesMade ? (
          <Button.Red
            // TODO: improve unload protect workflow
            onClick={(): void => setUnloadProtect(false, handleClose)}
          >
            {commonText('cancel')}
          </Button.Red>
        ) : (
          <Button.Blue onClick={handleClose}>{commonText('close')}</Button.Blue>
        )}
        {!isReadOnly && (
          <Submit.Green disabled={!changesMade}>
            {commonText('save')}
          </Submit.Green>
        )}
      </div>
    </Form>
  );
}
