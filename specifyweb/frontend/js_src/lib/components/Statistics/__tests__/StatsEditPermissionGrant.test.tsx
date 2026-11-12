import { screen, within } from '@testing-library/react';
import React from 'react';
import * as Router from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';
import { commonText } from '../../../localization/common';
import { userText } from '../../../localization/user';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import type { IR, RA } from '../../../utils/types';
import { frontEndPermissions } from '../../Permissions/definitions';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../../Router/UnloadProtect';
import type { RoleBase } from '../../Security/Collection';
import type { Policy } from '../../Security/Policy';
import { decompressPolicies } from '../../Security/policyConverter';
import type { NewRole, Role } from '../../Security/Role';
import { RoleView } from '../../Security/Role';
import { UserRoles } from '../../Security/UserComponents';

requireContext();

const statsResource = '/preferences/statistics';
const editShared = 'edit_shared';
const collectionId = 4;

const statsEditor: Role = {
  id: 7,
  name: 'Statistics Editor' as LocalizedString,
  description: '' as LocalizedString,
  policies: [{ resource: statsResource, actions: [editShared] }],
};

const otherRole: Role = {
  id: 3,
  name: 'Data Entry' as LocalizedString,
  description: '' as LocalizedString,
  policies: [],
};

function renderRoleView(role: NewRole) {
  const handleSave = jest.fn<void, [NewRole]>();
  const result = mount(
    <Router.MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <SetUnloadProtectsContext.Provider value={f.void}>
          <RoleView
            closeUrl="/specify/security/"
            collectionId={collectionId}
            parentName={undefined}
            permissionName="/permissions/roles"
            role={role}
            roleUsers={undefined}
            userRoles={undefined}
            onAddUsers={undefined}
            onDelete={jest.fn()}
            onSave={handleSave}
          />
        </SetUnloadProtectsContext.Provider>
      </UnloadProtectsContext.Provider>
    </Router.MemoryRouter>
  );
  return { ...result, handleSave };
}

const getPolicyEditor = (): HTMLElement =>
  screen
    .getByRole('heading', { name: userText.rolePolicies() })
    .closest('fieldset')!;

const getPolicyRows = (): RA<HTMLElement> =>
  Array.from(
    within(getPolicyEditor()).getAllByRole('list')[0].children,
    (row) => row as HTMLElement
  );

async function grantStatisticsEditAccess(
  user: ReturnType<typeof mount>['user']
): Promise<HTMLElement> {
  await user.click(
    within(getPolicyEditor()).getByRole('button', { name: commonText.add() })
  );
  const row = getPolicyRows().at(-1)!;
  await user.selectOptions(within(row).getByRole('combobox'), 'preferences');
  await user.selectOptions(
    within(row).getAllByRole('combobox')[1],
    'statistics'
  );
  return row;
}

describe('Granting Statistics edit access to a role', () => {
  test('"Edit Shared" is the only Statistics action and is a front-end permission', () => {
    expect(frontEndPermissions[statsResource]).toEqual([editShared]);
  });

  test('picking Preferences > Statistics grants "Edit Shared"', async () => {
    const { user } = renderRoleView({
      ...statsEditor,
      id: undefined,
      policies: [],
    });
    const row = await grantStatisticsEditAccess(user);

    const comboboxes = within(row).getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
    expect(comboboxes[0]).toHaveValue('preferences');
    expect(comboboxes[1]).toHaveValue('statistics');
    expect(
      within(row).getByRole('checkbox', { name: 'Edit Shared' })
    ).toBeChecked();
  });

  test('saving the role stores the edit_shared policy', async () => {
    const { user, handleSave } = renderRoleView({
      ...statsEditor,
      id: undefined,
      policies: [],
    });
    await grantStatisticsEditAccess(user);
    await user.click(screen.getByRole('button', { name: commonText.save() }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    const [savedRole] = handleSave.mock.calls[0];
    expect(savedRole).toMatchObject({
      name: statsEditor.name,
      policies: [{ resource: statsResource, actions: [editShared] }],
    });
    expect(decompressPolicies(savedRole.policies)).toEqual({
      [statsResource]: [editShared],
    });
  });

  test('an existing role keeps its other policies when access is granted', async () => {
    const existingPolicy: Policy = {
      resource: '/querybuilder/query',
      actions: ['execute'],
    };
    const { user, handleSave } = renderRoleView({
      ...otherRole,
      policies: [existingPolicy],
    });
    await grantStatisticsEditAccess(user);
    await user.click(screen.getByRole('button', { name: commonText.save() }));

    expect(handleSave.mock.calls[0][0].policies).toEqual([
      existingPolicy,
      { resource: statsResource, actions: [editShared] },
    ]);
  });

  test('unchecking "Edit Shared" does not grant the access', async () => {
    const { user, handleSave } = renderRoleView({
      ...statsEditor,
      id: undefined,
      policies: [],
    });
    const row = await grantStatisticsEditAccess(user);
    const checkbox = within(row).getByRole('checkbox', { name: 'Edit Shared' });
    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeRequired();
    await user.click(screen.getByRole('button', { name: commonText.save() }));
    expect(handleSave).not.toHaveBeenCalled();
  });
});

describe('Assigning the Statistics edit role to a user', () => {
  function renderUserRoles(initialRoles: RA<RoleBase>) {
    const handleChange = jest.fn<void, [IR<RA<RoleBase> | undefined>]>();
    function Wrapper(): JSX.Element {
      const [userRoles, setUserRoles] = React.useState<
        IR<RA<RoleBase> | undefined>
      >({ [collectionId]: initialRoles });
      return (
        <Router.MemoryRouter>
          <UserRoles
            collectionId={collectionId}
            collectionRoles={{ [collectionId]: [otherRole, statsEditor] }}
            userRoles={userRoles}
            onChange={(roles): void => {
              handleChange(roles);
              setUserRoles(roles);
            }}
          />
        </Router.MemoryRouter>
      );
    }
    return { ...mount(<Wrapper />), handleChange };
  }

  const getRoleCheckbox = (role: Role): HTMLElement =>
    screen.getByRole('checkbox', { name: role.name });

  test('the role is listed and unassigned for a new user', () => {
    renderUserRoles([]);

    expect(screen.getByText(userText.assignedUserRoles())).toBeInTheDocument();
    expect(getRoleCheckbox(statsEditor)).not.toBeChecked();
    expect(getRoleCheckbox(otherRole)).not.toBeChecked();
  });

  test('checking the role assigns it to the user', async () => {
    const { user, handleChange } = renderUserRoles([]);
    await user.click(getRoleCheckbox(statsEditor));

    expect(handleChange).toHaveBeenLastCalledWith({
      [collectionId]: [{ roleId: statsEditor.id, roleName: statsEditor.name }],
    });
    expect(getRoleCheckbox(statsEditor)).toBeChecked();
    expect(getRoleCheckbox(otherRole)).not.toBeChecked();
  });

  test('the role is added alongside roles the user already has', async () => {
    const { user, handleChange } = renderUserRoles([
      { roleId: otherRole.id, roleName: otherRole.name },
    ]);
    await user.click(getRoleCheckbox(statsEditor));

    expect(handleChange).toHaveBeenLastCalledWith({
      [collectionId]: [
        { roleId: otherRole.id, roleName: otherRole.name },
        { roleId: statsEditor.id, roleName: statsEditor.name },
      ],
    });
  });

  test('unchecking the role removes it from the user', async () => {
    const { user, handleChange } = renderUserRoles([
      { roleId: statsEditor.id, roleName: statsEditor.name },
    ]);
    await user.click(getRoleCheckbox(statsEditor));

    expect(handleChange).toHaveBeenLastCalledWith({ [collectionId]: [] });
    expect(getRoleCheckbox(statsEditor)).not.toBeChecked();
  });
});
