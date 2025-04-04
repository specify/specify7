import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { group } from '../../utils/utils';
import { fetchCollection } from '../DataModel/collection';
import { backendFilter } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  fetchResource,
  getResourceApiUrl,
  strictIdFromUrl,
} from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { Address, Collection, SpecifyUser } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { hasTablePermission } from '../Permissions/helpers';
import type { RoleBase } from './Collection';
import type { Role } from './Role';
import { fetchRoles, fetchUserRoles } from './utils';

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
  hasChanges: boolean,
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
      async () => {
        const divisions = hasTablePermission('Discipline', 'read')
          ? group(
              await Promise.all(
                group(
                  collections.map((collection) => [
                    strictIdFromUrl(collection.discipline),
                    collection.id,
                  ])
                ).map(async ([disciplineId, collections]) =>
                  fetchResource('Discipline', disciplineId)
                    .then(({ division }) => strictIdFromUrl(division))
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
            ] as const);
        return (
          typeof userId === 'number'
            ? hasTablePermission('Agent', 'read') &&
              hasTablePermission('Division', 'read')
              ? fetchCollection(
                  'Agent',
                  {
                    limit: 1,
                    specifyUser: userId,
                    domainFilter: false,
                  },
                  backendFilter('division').isIn(divisions.map(([id]) => id))
                ).then(({ records }) => records)
              : Promise.resolve([serializeResource(userInformation.agent)])
            : Promise.resolve([])
        ).then((rawAgents) => {
          const agents = Object.fromEntries(
            rawAgents.map((agent) => [
              strictIdFromUrl(agent.division ?? ''),
              agent,
            ])
          );
          return divisions.map(([divisionId, collections]) => ({
            divisionId,
            collections,
            address: new tables.Address.Resource({
              agent: f.maybe(agents[divisionId]?.id, (agentId) =>
                getResourceApiUrl('Agent', agentId)
              ),
            }),
          }));
        });
      },
      // ReFetch user agents when user is saved
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [userId, collections, version]
    ),
    false
  );

  useErrorContext('userAgents', userAgents);
  return userAgents;
}
