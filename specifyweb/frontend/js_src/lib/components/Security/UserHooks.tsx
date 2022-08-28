import React from 'react';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/helpers';
import { fetchCollection } from '../DataModel/collection';
import type { Address, Collection, SpecifyUser } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { serializeResource } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import { group, sortFunction } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  hasDerivedPermission,
  hasPermission,
  hasTablePermission,
} from '../Permissions/helpers';
import { fetchResource, getResourceApiUrl, idFromUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { fetchRoles, fetchUserRoles, processPolicies } from './utils';
import type { IR, RA, RR } from '../../utils/types';
import { defined } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import type { RoleBase } from './Collection';
import type { Policy } from './Policy';
import type { Role } from './Role';
import { useErrorContext } from '../../hooks/useErrorContext';
import {useAsyncState} from '../../hooks/useAsyncState';

/** Fetch roles from all collections */
export function useCollectionRoles(
  collections: RA<SerializedResource<Collection>>
): RR<number, RA<Role> | undefined> | undefined {
  const [collectionRoles] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          collections.map(async (collection) =>
            fetchRoles(collection.id).then(
              (roles) => [collection.id, roles] as const
            )
          )
        ).then((entries) => Object.fromEntries(entries)),
      [collections]
    ),
    false
  );
  useErrorContext('collectionRoles', collectionRoles);
  return collectionRoles;
}

/** Fetch user roles in all collections */
export function useUserRoles(
  userResource: SpecifyResource<SpecifyUser>,
  collections: RA<SerializedResource<Collection>>
): readonly [
  userRoles: IR<RA<RoleBase> | undefined> | undefined,
  setUserRoles: (value: IR<RA<RoleBase> | undefined>) => void,
  initialRoles: React.MutableRefObject<IR<RA<RoleBase> | undefined>>,
  hasChanges: boolean
] {
  const initialUserRoles = React.useRef<IR<RA<RoleBase> | undefined>>({});
  const [userRoles, setUserRoles] = useAsyncState<IR<RA<RoleBase> | undefined>>(
    React.useCallback(
      async () =>
        userResource.isNew()
          ? Object.fromEntries(collections.map(({ id }) => [id, []]))
          : Promise.all(
              collections.map(async (collection) =>
                fetchUserRoles(collection.id, userResource.id).then(
                  (roles) => [collection.id, roles] as const
                )
              )
            )
              .then((entries) => Object.fromEntries(entries))
              .then((userRoles) => {
                initialUserRoles.current = userRoles;
                return userRoles;
              }),
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

  useErrorContext('userRoles', userRoles);
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

/** Fetch User Agents in all Collections */
export function useUserAgents(
  userId: number | undefined,
  collections: RA<SerializedResource<Collection>>,
  version: number
): UserAgents | undefined {
  const [userAgents] = useAsyncState(
    React.useCallback(
      async () =>
        f.var(
          hasTablePermission('Discipline', 'read')
            ? group(
                await Promise.all(
                  group(
                    collections.map((collection) => [
                      defined(idFromUrl(collection.discipline)),
                      collection.id,
                    ])
                  ).map(async ([disciplineId, collections]) =>
                    fetchResource('Discipline', disciplineId)
                      .then(({ division }) => defined(idFromUrl(division)))
                      .then((divisionId) =>
                        collections.map(
                          (collectionId) => [divisionId, collectionId] as const
                        )
                      )
                  )
                ).then(f.flat)
              )
            : ([
                [
                  schema.domainLevelIds.division,
                  userInformation.availableCollections
                    .filter(
                      ({ discipline }) =>
                        discipline ===
                        getResourceApiUrl(
                          'Discipline',
                          schema.domainLevelIds.discipline
                        )
                    )
                    .map(({ id }) => id),
                ],
              ] as const),
          async (divisions) =>
            (typeof userId === 'number'
              ? hasTablePermission('Agent', 'read') &&
                hasTablePermission('Division', 'read')
                ? fetchCollection(
                    'Agent',
                    {
                      limit: 1,
                      specifyUser: userId,
                    },
                    {
                      division__in: divisions.map(([id]) => id).join(','),
                    }
                  ).then(({ records }) => records)
                : Promise.resolve([serializeResource(userInformation.agent)])
              : Promise.resolve([])
            ).then((agents) =>
              f.var(
                Object.fromEntries(
                  agents.map((agent) => [
                    defined(idFromUrl(agent.division)),
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
      // ReFetch user agents when user is saved
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [userId, collections, version]
    ),
    false
  );

  useErrorContext('userAgents', userAgents);
  return userAgents;
}

/** Fetching user policies */
export function useUserPolicies(
  userResource: SpecifyResource<SpecifyUser>,
  collections: RA<SerializedResource<Collection>>,
  initialCollection: number | undefined
): readonly [
  userPolicies: IR<RA<Policy> | undefined> | undefined,
  setUserPolicies: (value: IR<RA<Policy> | undefined> | undefined) => void,
  initialPolicies: React.MutableRefObject<IR<RA<Policy> | undefined>>,
  hasChanges: boolean
] {
  const initialUserPolicies = React.useRef<IR<RA<Policy> | undefined>>({});
  const [userPolicies, setUserPolicies] = useAsyncState(
    React.useCallback(
      async () =>
        userResource.isNew()
          ? Object.fromEntries(
              /*
               * Automatically check "Collection Access" when creating user from
               * the collection page
               */
              collections.map(({ id }) => [
                id,
                id === initialCollection
                  ? [
                      {
                        resource: '/system/sp7/collection',
                        actions: ['access'],
                      },
                    ]
                  : [],
              ])
            )
          : Promise.all(
              collections.map(async (collection) =>
                ajax<IR<RA<string>>>(
                  `/permissions/user_policies/${collection.id}/${userResource.id}/`,
                  {
                    headers: { Accept: 'application/json' },
                  },
                  {
                    /*
                     * When looking at a different collection, it is not yet
                     * know if user has read permission. Instead of waiting for
                     * permission query to complete, query anyway and silently
                     * handle the permission denied error
                     */
                    expectedResponseCodes: [Http.OK, Http.FORBIDDEN],
                  }
                ).then(
                  ({ data, status }) =>
                    [
                      collection.id,
                      status === Http.FORBIDDEN
                        ? undefined
                        : processPolicies(data),
                    ] as const
                )
              )
            )
              .then((entries) => Object.fromEntries(entries))
              .then((policies) => {
                initialUserPolicies.current = policies;
                return policies;
              }),
      [userResource, collections, initialCollection]
    ),
    false
  );
  const changedPolices =
    typeof userPolicies === 'object' &&
    JSON.stringify(userPolicies) !==
      JSON.stringify(initialUserPolicies.current);

  useErrorContext('userPolicies', userPolicies);
  return [userPolicies, setUserPolicies, initialUserPolicies, changedPolices];
}

/** Fetching user institutional policies */
export function useUserInstitutionalPolicies(
  userResource: SpecifyResource<SpecifyUser>
): readonly [
  institutionPolicies: RA<Policy> | undefined,
  setInstitutionPolicies: (value: RA<Policy>) => void,
  initialInstitutionPolicies: React.MutableRefObject<RA<Policy>>,
  hasChanges: boolean
] {
  const initialInstitutionPolicies = React.useRef<RA<Policy>>([]);
  const [institutionPolicies, setInstitutionPolicies] = useAsyncState(
    React.useCallback(
      async () =>
        userResource.isNew()
          ? []
          : hasDerivedPermission(
              '/permissions/institutional_policies/user',
              'read'
            )
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
      [userResource]
    ),
    false
  );
  const changedInstitutionPolicies =
    typeof institutionPolicies === 'object' &&
    JSON.stringify(initialInstitutionPolicies.current) !==
      JSON.stringify(institutionPolicies);

  useErrorContext('institutionPolicies', institutionPolicies);
  return [
    institutionPolicies,
    setInstitutionPolicies,
    initialInstitutionPolicies,
    changedInstitutionPolicies,
  ];
}

/** Fetch User's OpenID Connect providers */
export function useUserProviders(
  userId: number | undefined
): IR<boolean> | undefined {
  const [providers] = useAsyncState<IR<boolean>>(
    React.useCallback(
      async () =>
        hasPermission('/admin/user/oic_providers', 'read')
          ? f
              .all({
                allProviders: ajax<
                  RA<{ readonly provider: string; readonly title: string }>
                >('/accounts/oic_providers/', {
                  method: 'GET',
                  headers: { Accept: 'application/json' },
                }).then(({ data }) => data),
                userProviders:
                  typeof userId === 'number'
                    ? ajax<
                        RA<{
                          readonly provider: string;
                          readonly title: string;
                        }>
                      >(`/accounts/oic_providers/${userId}/`, {
                        method: 'GET',
                        headers: { Accept: 'application/json' },
                      }).then(({ data }) => data)
                    : [],
              })
              .then(({ allProviders, userProviders }) =>
                Object.fromEntries(
                  allProviders
                    .map(({ title, provider }) => [
                      title,
                      userProviders.some(
                        (entry) => entry.provider === provider
                      ),
                    ])
                    .sort(sortFunction(([title]) => title))
                )
              )
          : undefined,
      [userId]
    ),
    false
  );

  useErrorContext('providers', providers);
  return providers;
}
