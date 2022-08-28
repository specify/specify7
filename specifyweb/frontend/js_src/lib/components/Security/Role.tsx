import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

import type { SpecifyUser } from '../DataModel/types';
import { f } from '../../utils/functools';
import { replaceKey } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { hasPermission } from '../Permissions/helpers';
import type { RA } from '../../utils/types';
import { AppTitle, AutoGrowTextArea } from '../Molecules';
import { useLiveState, useTriggerState } from '../../hooks/hooks';
import { icons } from '../Atoms/Icons';
import { Dialog } from '../Molecules/Dialog';
import { useUnloadProtect } from '../../hooks/navigation';
import type { UserRoles } from './Collection';
import { ImportExport } from './ImportExport';
import type { Policy } from './Policy';
import { SecurityPolicies, SecurityPoliciesWrapper } from './Policy';
import { useErrorContext } from '../../hooks/useErrorContext';
import { Link } from '../Atoms/Link';
import { className } from '../Atoms/className';
import { Form, Input, Label } from '../Atoms/Form';
import { Button } from '../Atoms/Button';
import { Submit } from '../Atoms/Submit';

export type NewRole = {
  readonly id: number | undefined;
  readonly name: string;
  readonly description: string;
  readonly policies: RA<Policy>;
};

export type Role = NewRole & {
  readonly id: number;
};

const roleNameMaxLength = 1024;

// REFACTOR: make sure to implement useTitle() where needed
export function RoleView({
  role: initialRole,
  parentName,
  userRoles,
  permissionName,
  collectionId,
  closeUrl,
  roleUsers,
  onDelete: handleDelete,
  onSave: handleSave,
  onAddUsers: handleAddUsers,
}: {
  readonly role: NewRole | Role;
  readonly parentName: string | undefined;
  readonly userRoles: UserRoles | undefined;
  /*
   * All these are delegated to the parent resource so that the parent
   * can update its list of roles
   */
  readonly permissionName: '/permissions/library/roles' | '/permissions/roles';
  readonly collectionId: number;
  readonly closeUrl: string;
  readonly roleUsers: JSX.Element | undefined;
  readonly onSave: (role: NewRole | Role) => void;
  readonly onDelete: () => void;
  readonly onAddUsers:
    | ((user: RA<SpecifyResource<SpecifyUser>>) => void)
    | undefined;
}): JSX.Element {
  const [role, setRole] = useTriggerState(initialRole);
  useErrorContext('role', role);

  const changesMade =
    role.id === undefined ||
    JSON.stringify(initialRole) !== JSON.stringify(role);
  const navigate = useNavigate();
  useUnloadProtect(changesMade, commonText('leavePageDialogText'));
  const [state, setState] = useLiveState<
    | State<'MainState'>
    | State<
        'AddUserState',
        { readonly templateResource: SpecifyResource<SpecifyUser> }
      >
    | State<'DeletionPromptState'>
    // Close AddUser dialog when new user is added
  >(React.useCallback(() => ({ type: 'MainState' }), [userRoles]));

  const isReadOnly =
    typeof role.id === 'number' &&
    !hasPermission(permissionName, 'update', collectionId);

  return (
    <Form className="contents" onSubmit={(): void => handleSave(role)}>
      <h3 className="text-xl">{`${adminText('role')} ${role.name}`}</h3>
      <AppTitle title={role.name} type="form" />
      <Link.Default href={closeUrl}>
        {icons.arrowLeft}
        {parentName}
      </Link.Default>
      <div className="flex flex-1 flex-col gap-2 overflow-auto">
        {!isReadOnly && (
          <Label.Generic className={className.limitedWidth}>
            {commonText('name')}
            <Input.Text
              maxLength={roleNameMaxLength}
              required
              value={role.name}
              onValueChange={(name): void =>
                setRole(replaceKey(role, 'name', name))
              }
            />
          </Label.Generic>
        )}
        <Label.Generic className={className.limitedWidth}>
          {commonText('description')}
          <AutoGrowTextArea
            isReadOnly={isReadOnly}
            value={role.description}
            onValueChange={(description): void =>
              setRole(replaceKey(role, 'description', description))
            }
          />
        </Label.Generic>
        {roleUsers}
        <SecurityPoliciesWrapper
          collapsable={false}
          header={adminText('rolePolicies')}
          policies={role.policies}
        >
          <SecurityPolicies
            isReadOnly={isReadOnly}
            limitHeight={false}
            policies={role.policies}
            scope="collection"
            onChange={(policies): void =>
              setRole(replaceKey(role, 'policies', policies))
            }
          />
        </SecurityPoliciesWrapper>
      </div>
      <div className="flex gap-2">
        {typeof role.id === 'number' &&
        hasPermission(permissionName, 'delete', collectionId) ? (
          <Button.Red
            disabled={
              userRoles === undefined && typeof handleAddUsers === 'function'
            }
            onClick={
              userRoles?.length === 0
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
          <Link.Red
            href={closeUrl}
            onClick={(event): void => {
              event.preventDefault();
              navigate(closeUrl, { state: { noUnloadProtect: true } });
            }}
          >
            {commonText('cancel')}
          </Link.Red>
        ) : (
          <Link.Blue href={closeUrl}>{commonText('close')}</Link.Blue>
        )}
        <span className="-ml-2 flex-1" />
        {typeof role.id === 'number' && (
          <ImportExport
            baseName={role.name ?? ''}
            collectionId={collectionId}
            isReadOnly
            permissionName={permissionName}
            roles={{ [role.id]: role as Role }}
            onCreateRole={f.never}
            onUpdateRole={f.never}
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
          buttons={
            <>
              <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              <Button.Red onClick={handleDelete}>
                {commonText('delete')}
              </Button.Red>
            </>
          }
          header={adminText('deleteRoleDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {adminText('deleteRoleDialogText')}
        </Dialog>
      )}
    </Form>
  );
}
