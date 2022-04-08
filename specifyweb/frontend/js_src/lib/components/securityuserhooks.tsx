import React from 'react';

import { ajax } from '../ajax';
import { fetchCollection } from '../collection';
import type { Address, Collection, SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { group, sortFunction } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { hasPermission } from '../permissions';
import {
  fetchResource,
  getResourceApiUrl,
  parseResourceUrl,
} from '../resource';
import { schema } from '../schema';
import { fetchRoles, processPolicies } from '../securityutils';
import type { IR, RA, RR } from '../types';
import { defined } from '../types';
import { useAsyncState } from './hooks';
import type { Policy } from './securitypolicy';
import type { Role } from './securityrole';

// Fetch roles from all collections
export function useCollectionRoles(
  collections: IR<SerializedResource<Collection>>
): RR<number, RA<Role>> | undefined {
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
  return collectionRoles;
}

// Fetch user roles in all collections
export function useUserRoles(
  userResource: SpecifyResource<SpecifyUser>,
  collections: IR<SerializedResource<Collection>>
): [
  userRoles: IR<RA<number>> | undefined,
  setUserRoles: (value: IR<RA<number>>) => void,
  initialRoles: { current: IR<RA<number>> },
  hasChanges: boolean
] {
  const initialUserRoles = React.useRef<IR<RA<number>>>({});
  const [userRoles, setUserRoles] = useAsyncState<IR<RA<number>>>(
    React.useCallback(
      async () =>
        userResource.isNew()
          ? {}
          : hasPermission('/permissions/user/roles', 'read')
          ? Promise.all(
              Object.values(collections).map(async (collection) =>
                fetchRoles(collection.id, userResource.id).then(
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
              })
          : undefined,
      [userResource, collections]
    ),
    false
  );
  const changedRoles =
    typeof userRoles === 'object' &&
    Object.entries(userRoles).some(
      ([collectionId, roles]) =>
        JSON.stringify(roles) !==
        JSON.stringify(initialUserRoles.current[collectionId])
    );

  return [userRoles, setUserRoles, initialUserRoles, changedRoles];
}

export type UserAgents = RA<{
  readonly divisionId: number;
  readonly collections: RA<number>;
  /*
   * Address resource is used to store a link to the Agent resource,
   * because QueryComboBox requires some sort of parent resource
   */
  readonly address: SpecifyResource<Address>;
}>;

// Fetch User Agents in all Collections
export function useUserAgents(
  userId: number,
  collections: IR<SerializedResource<Collection>>
): UserAgents | undefined {
  const [userAgents] = useAsyncState(
    React.useCallback(
      async () =>
        f.var(
          group(
            await Promise.all(
              group(
                Object.values(collections).map((collection) => [
                  defined(parseResourceUrl(collection.discipline))[1],
                  collection.id,
                ])
              ).map(async ([disciplineId, collections]) =>
                fetchResource('Discipline', disciplineId).then((discipline) =>
                  f.var(
                    defined(parseResourceUrl(defined(discipline).division))[1],
                    (divisionId) =>
                      collections.map(
                        (collectionId) => [divisionId, collectionId] as const
                      )
                  )
                )
              )
            ).then(f.flat)
          ),
          async (divisions) =>
            fetchCollection(
              'Agent',
              {
                limit: 1,
                specifyUser: userId,
              },
              {
                division__in: divisions.map(([id]) => id).join(','),
              }
            ).then(({ records }) =>
              f.var(
                Object.fromEntries(
                  records.map((agent) => [
                    defined(parseResourceUrl(agent.division))[1],
                    agent,
                  ])
                ),
                (agents) =>
                  divisions.map(([divisionId, collections]) => ({
                    divisionId,
                    collections,
                    address: new schema.models.Address.Resource({
                      agent: f.maybe(agents[divisionId]?.id, (agentId) =>
                        getResourceApiUrl('Agent', agentId)
                      ),
                    }),
                  }))
              )
            )
        ),
      [userId, collections]
    ),
    false
  );

  return userAgents;
}

// Fetching user policies
export function useUserPolicies(
  userResource: SpecifyResource<SpecifyUser>,
  collections: IR<SerializedResource<Collection>>
): [
  userPolicies: IR<RA<Policy>> | undefined,
  setUserPolicies: (value: IR<RA<Policy>> | undefined) => void,
  initialPolicies: { current: IR<RA<Policy>> },
  hasChanges: boolean
] {
  const initialUserPolicies = React.useRef<IR<RA<Policy>>>({});
  const [userPolicies, setUserPolicies] = useAsyncState(
    React.useCallback(
      async () =>
        userResource.isNew()
          ? {}
          : hasPermission('/permissions/policies/user', 'read')
          ? Promise.all(
              Object.values(collections).map(async (collection) =>
                ajax<IR<RA<string>>>(
                  `/permissions/user_policies/${collection.id}/${userResource.id}/`,
                  {
                    headers: { Accept: 'application/json' },
                  }
                ).then(
                  ({ data }) => [collection.id, processPolicies(data)] as const
                )
              )
            )
              .then((entries) => Object.fromEntries(entries))
              .then((policies) => {
                initialUserPolicies.current = policies;
                return policies;
              })
          : undefined,
      [userResource, collections]
    ),
    false
  );
  const changedPolices =
    typeof userPolicies === 'object' &&
    JSON.stringify(userPolicies) !==
      JSON.stringify(initialUserPolicies.current);

  return [userPolicies, setUserPolicies, initialUserPolicies, changedPolices];
}

// Fetching user institutional policies
export function useUserInstitutionalPolicies(
  userResource: SpecifyResource<SpecifyUser>
): [
  institutionPolicies: RA<Policy> | undefined,
  setInstitutionPolicies: (value: RA<Policy>) => void,
  initialInstitutionPolicies: { current: RA<Policy> },
  hasChanges: boolean
] {
  const initialInstitutionPolicies = React.useRef<RA<Policy>>([]);
  const [institutionPolicies, setInstitutionPolicies] = useAsyncState(
    React.useCallback(
      async () =>
        userResource.isNew()
          ? []
          : hasPermission('/permissions/policies/user', 'read')
          ? ajax<IR<RA<string>>>(
              `/permissions/user_policies/institution/${userResource.id}/`,
              {
                headers: { Accept: 'application/json' },
              }
            ).then(({ data }) => {
              const policies = processPolicies(data);
              initialInstitutionPolicies.current = policies;
              return policies;
            })
          : undefined,
      [userResource.id]
    ),
    false
  );
  const changedInstitutionPolicies =
    JSON.stringify(initialInstitutionPolicies.current) !==
    JSON.stringify(institutionPolicies);

  return [
    institutionPolicies,
    setInstitutionPolicies,
    initialInstitutionPolicies,
    changedInstitutionPolicies,
  ];
}
