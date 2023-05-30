import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useUnloadProtect } from '../../hooks/navigation';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useLiveState } from '../../hooks/useLiveState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { schemaText } from '../../localization/schema';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { replaceKey } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form, Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { ReadOnlyContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { SpecifyUser } from '../DataModel/types';
import { AppTitle } from '../Molecules/AppTitle';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import type { UserRoles } from './Collection';
import { ImportExport } from './ImportExport';
import { SecurityPolicies, SecurityPoliciesWrapper } from './Policies';
import type { Policy } from './Policy';

export type NewRole = {
  readonly id: number | undefined;
  readonly name: LocalizedString;
  readonly description: LocalizedString;
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
  readonly parentName: LocalizedString | undefined;
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
  const unsetUnloadProtect = useUnloadProtect(
    changesMade,
    mainText.leavePageConfirmationDescription()
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

  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    (typeof role.id === 'number' &&
      !hasPermission(permissionName, 'update', collectionId));

  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <Form
        className="contents"
        onSubmit={(): void => {
          unsetUnloadProtect();
          handleSave(role);
        }}
      >
        <h3 className="text-xl">
          {commonText.colonLine({
            label: userText.role(),
            value: role.name,
          })}
        </h3>
        <AppTitle title={role.name} />
        <Link.Default href={closeUrl}>
          {icons.arrowLeft}
          {parentName}
        </Link.Default>
        <div className="flex flex-1 flex-col gap-2 overflow-auto">
          {!isReadOnly && (
            <Label.Block className={className.limitedWidth}>
              {getField(tables.SpPermission, 'name').label}
              <Input.Text
                maxLength={roleNameMaxLength}
                required
                value={role.name}
                onValueChange={(name): void =>
                  setRole(replaceKey(role, 'name', name))
                }
              />
            </Label.Block>
          )}
          <Label.Block className={className.limitedWidth}>
            {schemaText.description()}
            <AutoGrowTextArea
              isReadOnly={isReadOnly}
              value={role.description}
              onValueChange={(description): void =>
                setRole(replaceKey(role, 'description', description))
              }
            />
          </Label.Block>
          {roleUsers}
          <SecurityPoliciesWrapper
            collapsable={false}
            header={userText.rolePolicies()}
            policies={role.policies}
          >
            <SecurityPolicies
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
            <Button.Danger
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
              {commonText.remove()}
            </Button.Danger>
          ) : undefined}
          <span className="-ml-2 flex-1" />
          {changesMade ? (
            <Link.Danger
              href={closeUrl}
              onClick={(event): void => {
                event.preventDefault();
                unsetUnloadProtect();
                navigate(closeUrl);
              }}
            >
              {commonText.cancel()}
            </Link.Danger>
          ) : (
            <Link.Info href={closeUrl}>{commonText.close()}</Link.Info>
          )}
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
            <Submit.Save disabled={!changesMade}>
              {commonText.save()}
            </Submit.Save>
          )}
        </div>
        {state.type === 'DeletionPromptState' && (
          <Dialog
            buttons={
              <>
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
                <Button.Danger onClick={handleDelete}>
                  {commonText.delete()}
                </Button.Danger>
              </>
            }
            header={userText.deleteRoleWithUsers()}
            onClose={(): void => setState({ type: 'MainState' })}
          >
            {userText.deleteRoleWithUsersDescription()}
          </Dialog>
        )}
      </Form>
    </ReadOnlyContext.Provider>
  );
}
