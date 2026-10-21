import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import type { GetOrSet, IR, RA, RR } from '../../utils/types';
import { localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { SECOND } from '../Atoms/timeUnits';
import type { KeysToLowerCase } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import { userInformation } from '../InitialContext/userInformation';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import type { UserRoles } from './Collection';

type User = { readonly userId: number; readonly userName: LocalizedString };

const PRESENCE_REFRESH_INTERVAL = 30 * SECOND;

export function useCollectionUsersWithPolicies(
  collectionId: number
): RA<User> | undefined {
  const [usersWithPolicies] = useAsyncState<RA<User>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/policies/user', 'read', collectionId) &&
        hasTablePermission('SpecifyUser', 'read')
          ? ajax<RR<number, IR<RA<string>>>>(
              `/permissions/user_policies/${collectionId}/`,
              {
                headers: { Accept: 'application/json' },
              }
            ).then(async ({ data }) =>
              Promise.all(
                Object.keys(data)
                  .map((userId) => Number.parseInt(userId))
                  .map(async (userId) => ({
                    userId,
                    userName: await fetchResource('SpecifyUser', userId).then(
                      ({ name }) => localized(name)
                    ),
                  }))
              )
            )
          : [{ userId: userInformation.id, userName: userInformation.name }],
      [collectionId]
    ),
    false
  );
  return usersWithPolicies;
}

export function useCollectionUserRoles(
  collectionId: number
): GetOrSet<UserRoles | undefined> {
  const fetchUserRoles = React.useCallback(
    async () =>
      hasPermission('/permissions/user/roles', 'read', collectionId)
        ? ajax<RA<KeysToLowerCase<UserRoles[number]>>>(
            `/permissions/user_roles/${collectionId}/`,
            {
              headers: { Accept: 'application/json' },
            }
          ).then(({ data }) =>
            data.map(({ userid, username, roles, presence }) => ({
              userId: userid,
              userName: username,
              presence,
              roles: roles
                .map(({ roleid, rolename }) => ({
                  roleId: roleid,
                  roleName: rolename,
                }))
                .sort(sortFunction(({ roleName }) => roleName)),
            }))
          )
        : undefined,
    [collectionId]
  );
  const [userRoles, setUserRoles] = useAsyncState<UserRoles>(
    fetchUserRoles,
    false
  );

  React.useEffect(() => {
    if (!hasPermission('/permissions/user/roles', 'read', collectionId))
      return undefined;
    const interval = globalThis.setInterval(() => {
      void fetchUserRoles()
        .then(setUserRoles)
        .catch((error: unknown) =>
          console.error('Unable to refresh collection user presence', error)
        );
    }, PRESENCE_REFRESH_INTERVAL);
    return (): void => globalThis.clearInterval(interval);
  }, [collectionId, fetchUserRoles, setUserRoles]);

  return [userRoles, setUserRoles];
}

/**
 * Combine users that have only policies or only roles together into one list
 */
export const mergeCollectionUsers = (
  userRoles: UserRoles | undefined,
  usersWithPolicies: RA<User> | undefined = []
): UserRoles | undefined =>
  typeof userRoles === 'object'
    ? [
        ...userRoles.filter(({ roles }) => roles.length > 0),
        ...usersWithPolicies
          .filter(({ userId }) =>
            userRoles.every(
              (user) => user.userId !== userId || user.roles.length === 0
            )
          )
          .map(({ userId, userName }) => ({
            userId,
            presence:
              userRoles.find((user) => user.userId === userId)?.presence ??
              'offline',
            userName,
            roles: [],
          })),
      ].sort(sortFunction(({ userName }) => userName))
    : undefined;
