import React from 'react';
import type { State } from 'typesafe-reducer';

import type { SpecifyUser } from '../datamodel';
import { f } from '../functools';
import { replaceKey } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission, hasTablePermission } from '../permissions';
import { schema } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button, Form, Input, Label, Submit, Ul } from './basic';
import { useLiveState, useTriggerState } from './hooks';
import { icons } from './icons';
import { Dialog } from './modaldialog';
import { useUnloadProtect } from './navigation';
import { SearchDialog } from './searchdialog';
import { SecurityImportExport } from './securityimportexport';
import type { Policy } from './securitypolicy';
import { PoliciesView } from './securitypolicy';
import { AppTitle, AutoGrowTextArea } from './common';

export type NewRole = {
  readonly id: number | undefined;
  readonly name: string;
  readonly description: string;
  readonly policies: RA<Policy>;
};

export type Role = NewRole & {
  readonly id: number;
};

export type UserRoles = RA<{
  readonly roleId: number;
  readonly roleName: string;
  readonly users: RA<{
    readonly userId: number;
    readonly userName: string;
  }>;
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
  const [role, setRole] = useTriggerState(initialRole);
  const changesMade =
    typeof role.id === 'undefined' ||
    JSON.stringify(initialRole) !== JSON.stringify(role);
  const unsetUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogText')
  );
  const [state, setState] = useLiveState<
    | State<'MainState'>
    | State<
        'AddUserState',
        { readonly templateResource: SpecifyResource<SpecifyUser> }
      >
    | State<'DeletionPromptState'>
    // Close AddUser dialog when new user is added
  >(React.useCallback(() => ({ type: 'MainState' }), [userRoles]));
  const usersWithRole =
    typeof userRoles === 'object' && typeof role.id === 'number'
      ? defined(userRoles.find(({ roleId }) => roleId === role.id)).users
      : undefined;

  const isReadOnly =
    typeof role.id === 'number' && !hasPermission(permissionName, 'update');

  return (
    <Form onSubmit={(): void => handleSave(role)} className="contents">
      <h3 className="text-xl">{`${adminText('role')} ${role.name}`}</h3>
      <AppTitle title={role.name} type="form" />
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
        <AutoGrowTextArea
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
              <Ul className="flex flex-col gap-2 max-h-[theme(spacing.96)] overflow-auto">
                {usersWithRole.map(({ userId, userName }) => (
                  <li key={userId}>
                    <Button.LikeLink
                      disabled={
                        userId !== userInformation.id &&
                        !hasTablePermission('SpecifyUser', 'update') &&
                        !hasPermission(
                          '/permissions/policies/user',
                          'update'
                        ) &&
                        !hasPermission('/permissions/user/roles', 'update')
                      }
                      // TODO: trigger unload protect
                      onClick={(): void => handleOpenUser(userId)}
                    >
                      {userName}
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
                      values: usersWithRole.map(({ userId }) =>
                        userId.toString()
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
        scope="collection"
        collapsable={false}
      />
      <span className="flex-1 -mt-2" />
      <div className="flex gap-2">
        {typeof role.id === 'number' &&
        hasPermission(permissionName, 'delete') ? (
          <Button.Red
            disabled={typeof usersWithRole === 'undefined'}
            onClick={
              usersWithRole?.length === 0
                ? handleDelete
                : (): void =>
                    setState({
                      type: 'DeletionPromptState',
                    })
            }
          >
            {commonText('remove')}
          </Button.Red>
        ) : undefined}
        {changesMade ? (
          <Button.Red
            onClick={(): void => {
              unsetUnloadProtect();
              handleClose();
            }}
          >
            {commonText('cancel')}
          </Button.Red>
        ) : (
          <Button.Blue onClick={handleClose}>{commonText('close')}</Button.Blue>
        )}
        <span className="flex-1 -ml-2" />
        {typeof role.id === 'number' && (
          <SecurityImportExport
            roles={{ [role.id]: role as Role }}
            permissionName={permissionName}
            isReadOnly={true}
            baseName={role.name ?? ''}
            onUpdateRole={f.never}
            onCreateRole={f.never}
          />
        )}
        {!isReadOnly && (
          <Submit.Green disabled={!changesMade}>
            {commonText('save')}
          </Submit.Green>
        )}
      </div>
      {state.type === 'DeletionPromptState' && (
        <Dialog
          header={adminText('deleteRoleDialogHeader')}
          buttons={
            <>
              <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              <Button.Red onClick={handleDelete}>
                {commonText('delete')}
              </Button.Red>
            </>
          }
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {adminText('deleteRoleDialogText')}
        </Dialog>
      )}
    </Form>
  );
}
