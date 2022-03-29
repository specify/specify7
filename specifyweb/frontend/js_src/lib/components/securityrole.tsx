import React from 'react';
import type { State } from 'typesafe-reducer';

import type { SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { schema } from '../schema';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, Form, Input, Label, Submit, Textarea, Ul } from './basic';
import { useLiveState, useUnloadProtect } from './hooks';
import { icons } from './icons';
import { SearchDialog } from './searchdialog';
import type { Policy } from './securitypolicy';
import { PoliciesView } from './securitypolicy';

export type NewRole = {
  readonly id: number | undefined;
  readonly name: string;
  readonly description: string;
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
  parentName,
  userRoles,
  onDelete: handleDelete,
  onSave: handleSave,
  onClose: handleClose,
  onOpenUser: handleOpenUser,
  onAddUser: handleAddUser,
  permissionName,
}: {
  readonly role: Role | NewRole;
  readonly parentName: string | undefined;
  readonly userRoles: UserRoles | undefined;
  /*
   * All these are delegated to the parent resource so that the parent
   * can update its list of roles
   */
  readonly onSave: (role: Role | NewRole) => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
  readonly onOpenUser: ((userId: number) => void) | undefined;
  readonly onAddUser:
    | ((user: SpecifyResource<SpecifyUser>) => void)
    | undefined;
  readonly permissionName: '/permissions/library/roles' | '/permissions/roles';
}): JSX.Element {
  const [role, setRole] = useLiveState(
    React.useCallback(
      () => replaceKey(initialRole, 'policies', initialRole.policies),
      [initialRole]
    )
  );
  const changesMade =
    typeof role.id === 'undefined' ||
    JSON.stringify(initialRole) !== JSON.stringify(role);
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

  const isReadOnly =
    typeof role.id === 'number' && !hasPermission(permissionName, 'update');

  return (
    <Form onSubmit={(): void => handleSave(role)} className="contents">
      <h3 className="text-xl">{`${adminText('role')} ${role.name}`}</h3>
      <Button.LikeLink onClick={handleClose}>
        {icons.arrowLeft}
        {parentName}
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
      <Label.Generic>
        {commonText('description')}
        <Textarea
          isReadOnly={isReadOnly}
          value={role.description}
          onValueChange={(description): void =>
            setRole(replaceKey(role, 'description', description))
          }
        />
      </Label.Generic>
      {typeof role.id === 'number' && typeof handleOpenUser === 'function' ? (
        <fieldset className="flex flex-col gap-2">
          <legend>{adminText('users')}:</legend>
          {typeof usersWithRole === 'object' ? (
            <>
              <Ul className="flex flex-col gap-2 max-h-[theme(spacing.80)] overflow-auto">
                {Object.values(usersWithRole)
                  .filter(({ roles }) => roles.includes(defined(role.id)))
                  .map(({ user }) => (
                    <li key={user.id}>
                      <Button.LikeLink
                        disabled={
                          user.id !== userInformation.id &&
                          !hasTablePermission('SpecifyUser', 'update') &&
                          !hasPermission(
                            '/permissions/policies/user',
                            'update'
                          ) &&
                          !hasPermission('/permissions/user/roles', 'update')
                        }
                        // TODO: trigger unload protect
                        onClick={(): void => handleOpenUser(user.id)}
                      >
                        {user.name}
                      </Button.LikeLink>
                    </li>
                  ))}
              </Ul>
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
              {state.type === 'AddUserState' &&
              typeof handleAddUser === 'function' ? (
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
              ) : undefined}
            </>
          ) : (
            commonText('loading')
          )}
        </fieldset>
      ) : undefined}
      <PoliciesView
        policies={role.policies}
        onChange={(policies): void =>
          setRole(replaceKey(role, 'policies', policies))
        }
        isReadOnly={isReadOnly}
      />
      <span className="flex-1 -mt-2" />
      <div className="flex gap-2">
        {typeof role.id === 'number' &&
        hasPermission(permissionName, 'delete') ? (
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
