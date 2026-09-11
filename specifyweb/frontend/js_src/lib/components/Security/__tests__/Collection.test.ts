/**
 * Tests for the displayUsers merging logic and user label construction
 * introduced in CollectionView (Collection.tsx).
 *
 * The PR change computes displayUsers by merging mergeCollectionUsers output
 * with institution admin users (from useAdmins), deduplicating, and sorting.
 * It also computes per-user labels that prepend "Institution Admin" for admins.
 */

import type { LocalizedString } from 'typesafe-i18n';

import {
  computeDisplayUsers,
  computeLabels,
  type AdminsShape,
  type RoleBase,
  type UserRoles,
} from '../Collection';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const L = (s: string): LocalizedString => s as LocalizedString;

const INST_ADMIN_LABEL = L('Institution Admin');

const alice = { userId: 1, userName: L('alice'), roles: [] as RoleBase[] };
const bob = {
  userId: 2,
  userName: L('bob'),
  roles: [{ roleId: 10, roleName: L('Cataloger') }],
};
const carol = { userId: 3, userName: L('carol'), roles: [] as RoleBase[] };

const adminsWithAliceAndCarol: AdminsShape = {
  admins: new Set([1, 3]),
  adminUsers: [
    { userId: 1, userName: L('alice') },
    { userId: 3, userName: L('carol') },
  ],
};

// ---------------------------------------------------------------------------
// displayUsers merging logic
// ---------------------------------------------------------------------------

describe('displayUsers computation', () => {
  test('returns undefined when mergedUsers is undefined', () => {
    const result = computeDisplayUsers(undefined, adminsWithAliceAndCarol);
    expect(result).toBeUndefined();
  });

  test('returns mergedUsers unchanged when admins is undefined', () => {
    const mergedUsers: UserRoles = [alice, bob];
    const result = computeDisplayUsers(mergedUsers, undefined);
    // Should be exactly the same reference since the branch just returns mergedUsers
    expect(result).toEqual(mergedUsers);
  });

  test('returns mergedUsers unchanged when both args are undefined', () => {
    const result = computeDisplayUsers(undefined, undefined);
    expect(result).toBeUndefined();
  });

  test('includes all existing mergedUsers in output', () => {
    const mergedUsers: UserRoles = [alice, bob];
    const result = computeDisplayUsers(mergedUsers, adminsWithAliceAndCarol);
    expect(result?.some((u) => u.userId === alice.userId)).toBe(true);
    expect(result?.some((u) => u.userId === bob.userId)).toBe(true);
  });

  test('adds admin user not already in mergedUsers', () => {
    // carol (userId=3) is an admin but not in mergedUsers
    const mergedUsers: UserRoles = [alice, bob];
    const result = computeDisplayUsers(mergedUsers, adminsWithAliceAndCarol);
    expect(result?.some((u) => u.userId === carol.userId)).toBe(true);
  });

  test('does not duplicate an admin user already in mergedUsers', () => {
    // alice (userId=1) is in both mergedUsers and adminUsers
    const mergedUsers: UserRoles = [alice, bob];
    const result = computeDisplayUsers(mergedUsers, adminsWithAliceAndCarol);
    const aliceEntries = result?.filter((u) => u.userId === alice.userId) ?? [];
    expect(aliceEntries).toHaveLength(1);
  });

  test('added admin users have empty roles array', () => {
    // carol is added from admins and should have no roles
    const mergedUsers: UserRoles = [alice, bob];
    const result = computeDisplayUsers(mergedUsers, adminsWithAliceAndCarol);
    const carolEntry = result?.find((u) => u.userId === carol.userId);
    expect(carolEntry?.roles).toEqual([]);
  });

  test('result is sorted alphabetically by userName', () => {
    // alice < bob < carol
    const mergedUsers: UserRoles = [bob, alice]; // unsorted input
    const result = computeDisplayUsers(mergedUsers, adminsWithAliceAndCarol);
    const userNames = result?.map((u) => u.userName);
    expect(userNames).toEqual(['alice', 'bob', 'carol']);
  });

  test('sort is stable and handles already-sorted input', () => {
    const mergedUsers: UserRoles = [alice, bob];
    const adminsNoExtra: AdminsShape = {
      admins: new Set([1]),
      adminUsers: [{ userId: 1, userName: L('alice') }],
    };
    const result = computeDisplayUsers(mergedUsers, adminsNoExtra);
    const userNames = result?.map((u) => u.userName);
    expect(userNames).toEqual(['alice', 'bob']);
  });

  test('handles empty mergedUsers with admin users to add', () => {
    const result = computeDisplayUsers([], adminsWithAliceAndCarol);
    expect(result).toHaveLength(2);
    const userNames = result?.map((u) => u.userName);
    expect(userNames).toEqual(['alice', 'carol']); // sorted
  });

  test('handles empty mergedUsers and empty adminUsers', () => {
    const emptyAdmins: AdminsShape = {
      admins: new Set(),
      adminUsers: [],
    };
    const result = computeDisplayUsers([], emptyAdmins);
    expect(result).toEqual([]);
  });

  test('handles mergedUsers with users and no admin users to add', () => {
    const noAdmins: AdminsShape = {
      admins: new Set(),
      adminUsers: [],
    };
    const mergedUsers: UserRoles = [alice, bob];
    const result = computeDisplayUsers(mergedUsers, noAdmins);
    expect(result).toHaveLength(2);
  });

  test('preserves roles on existing mergedUsers entries', () => {
    const mergedUsers: UserRoles = [bob]; // bob has roles
    const result = computeDisplayUsers(mergedUsers, adminsWithAliceAndCarol);
    const bobEntry = result?.find((u) => u.userId === bob.userId);
    expect(bobEntry?.roles).toEqual(bob.roles);
  });
});

// ---------------------------------------------------------------------------
// Per-user label construction
// ---------------------------------------------------------------------------

describe('user label computation', () => {
  test('admin user with no roles gets only the institution admin label', () => {
    const labels = computeLabels(
      adminsWithAliceAndCarol,
      1, // alice is an admin
      [],
      INST_ADMIN_LABEL
    );
    expect(labels).toEqual([INST_ADMIN_LABEL]);
  });

  test('admin user with roles gets institution admin label prepended', () => {
    const roles: RoleBase[] = [
      { roleId: 10, roleName: L('Cataloger') },
      { roleId: 11, roleName: L('Manager') },
    ];
    const labels = computeLabels(
      adminsWithAliceAndCarol,
      1, // alice is an admin
      roles,
      INST_ADMIN_LABEL
    );
    expect(labels).toEqual([INST_ADMIN_LABEL, L('Cataloger'), L('Manager')]);
  });

  test('non-admin user with roles gets only role names', () => {
    const roles: RoleBase[] = [{ roleId: 10, roleName: L('Cataloger') }];
    const labels = computeLabels(
      adminsWithAliceAndCarol,
      2, // bob is NOT an admin
      roles,
      INST_ADMIN_LABEL
    );
    expect(labels).toEqual([L('Cataloger')]);
  });

  test('non-admin user with no roles produces empty labels', () => {
    const labels = computeLabels(
      adminsWithAliceAndCarol,
      2, // bob is NOT an admin
      [],
      INST_ADMIN_LABEL
    );
    expect(labels).toEqual([]);
  });

  test('institution admin label is always first in the list', () => {
    const roles: RoleBase[] = [
      { roleId: 5, roleName: L('Data Entry') },
      { roleId: 6, roleName: L('Viewer') },
    ];
    const labels = computeLabels(
      adminsWithAliceAndCarol,
      3, // carol is an admin
      roles,
      INST_ADMIN_LABEL
    );
    expect(labels[0]).toBe(INST_ADMIN_LABEL);
  });

  test('admins=undefined results in no admin label for any user', () => {
    const labels = computeLabels(
      undefined,
      1, // alice would be an admin, but admins is undefined
      [],
      INST_ADMIN_LABEL
    );
    expect(labels).toEqual([]);
  });

  test('admins=undefined user with roles gets only role names', () => {
    const roles: RoleBase[] = [{ roleId: 10, roleName: L('Cataloger') }];
    const labels = computeLabels(undefined, 1, roles, INST_ADMIN_LABEL);
    expect(labels).toEqual([L('Cataloger')]);
  });

  test('user in admins.admins but not an adminUser still gets the label', () => {
    // admins.admins is the Set used for label display; it's independent of adminUsers
    const adminsOnlySet: AdminsShape = {
      admins: new Set([99]),
      adminUsers: [],
    };
    const labels = computeLabels(adminsOnlySet, 99, [], INST_ADMIN_LABEL);
    expect(labels).toEqual([INST_ADMIN_LABEL]);
  });
});
