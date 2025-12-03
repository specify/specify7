import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Collection, SpecifyUser } from '../DataModel/types';
import { hasDerivedPermission, hasPermission } from '../Permissions/helpers';
import type { Policy } from './Policy';
import { processPolicies } from './policyConverter';

/** Fetching user policies */
export function useUserPolicies(
  userResource: SpecifyResource<SpecifyUser>,
  collections: RA<SerializedResource<Collection>>,
  initialCollection: number | undefined
): readonly [
  userPolicies: IR<RA<Policy> | undefined> | undefined,
  setUserPolicies: (value: IR<RA<Policy> | undefined> | undefined) => void,
  initialPolicies: React.MutableRefObject<IR<RA<Policy> | undefined>>,
  hasChanges: boolean,
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
                    /*
                     * When looking at a different collection, it is not yet
                     * know if user has read permission. Instead of waiting for
                     * permission query to complete, query anyway and silently
                     * handle the permission denied error
                     */
                    expectedErrors: [Http.FORBIDDEN],
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
  hasChanges: boolean,
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
                  RA<{
                    readonly provider: string;
                    readonly title: LocalizedString;
                  }>
                >('/accounts/oic_providers/', {
                  headers: { Accept: 'application/json' },
                }).then(({ data }) => data),
                userProviders:
                  typeof userId === 'number'
                    ? ajax<
                        RA<{
                          readonly provider: string;
                          readonly title: LocalizedString;
                        }>
                      >(`/accounts/oic_providers/${userId}/`, {
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
