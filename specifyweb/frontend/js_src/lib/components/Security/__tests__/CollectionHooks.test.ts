import { localized } from '../../../utils/types';
import { mergeCollectionUsers } from '../CollectionHooks';

test('preserves presence for policy-only users when merging collection users', () => {
  const userRoles = [
    {
      userId: 1,
      userName: localized('User with role'),
      presence: 'active',
      roles: [],
    },
    {
      userId: 2,
      userName: localized('User without policy'),
      presence: 'offline',
      roles: [{ roleId: 1, roleName: localized('Role') }],
    },
  ] as const;

  const usersWithPolicies = [
    { userId: 1, userName: localized('User with role') },
  ] as const;

  expect(mergeCollectionUsers(userRoles, usersWithPolicies)).toEqual([
    {
      userId: 1,
      userName: localized('User with role'),
      presence: 'active',
      roles: [],
    },
    {
      userId: 2,
      userName: localized('User without policy'),
      presence: 'offline',
      roles: [{ roleId: 1, roleName: localized('Role') }],
    },
  ]);
});
