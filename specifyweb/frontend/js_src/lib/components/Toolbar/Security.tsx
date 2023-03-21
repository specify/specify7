/**
 * Entrypoint for the Security Panel
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import type { GetOrSet, IR, RA } from '../../utils/types';
import { index } from '../../utils/utils';
import { Container, H2, H3 } from '../Atoms';
import { className } from '../Atoms/className';
import { fetchCollection } from '../DataModel/collection';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { Institution, SpecifyUser } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useAvailableCollections } from '../Forms/OtherCollectionView';
import { userInformation } from '../InitialContext/userInformation';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { ActiveLink } from '../Router/ActiveLink';
import { SafeOutlet } from '../Router/RouterUtils';
import { processPolicies } from '../Security/policyConverter';
import type { Role } from '../Security/Role';
import type { BackEndRole } from '../Security/utils';

export type SecurityOutlet = {
  readonly institution: SerializedResource<Institution> | undefined;
  readonly getSetUsers: GetOrSet<
    IR<SerializedResource<SpecifyUser>> | undefined
  >;
  readonly getSetLibraryRoles: GetOrSet<IR<Role> | undefined>;
};

export function SecurityPanel(): JSX.Element | null {
  const [institution] = useAsyncState(
    React.useCallback(
      async () =>
        hasTablePermission('Institution', 'read')
          ? fetchCollection('Institution', { limit: 1 }).then(
              ({ records }) => records[0]
            )
          : undefined,
      []
    ),
    true
  );

  const users = useAsyncState<IR<SerializedResource<SpecifyUser>>>(
    React.useCallback(
      async () =>
        hasTablePermission('SpecifyUser', 'read')
          ? fetchCollection('SpecifyUser', { limit: 0 }).then(({ records }) =>
              index(records)
            )
          : {
              [userInformation.id]: serializeResource(userInformation),
            },
      []
    ),
    false
  );

  const libraryRoles = useAsyncState<IR<Role>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/library/roles', 'read')
          ? ajax<RA<BackEndRole>>('/permissions/library_roles/', {
              headers: { Accept: 'application/json' },
            }).then(({ data }) =>
              index(
                data.map((role) => ({
                  ...role,
                  policies: processPolicies(role.policies),
                }))
              )
            )
          : undefined,
      []
    ),
    false
  );

  const context: SecurityOutlet = {
    institution,
    getSetUsers: users,
    getSetLibraryRoles: libraryRoles,
  };

  /*
   * FEATURE: replace blank home page with a security dashboard
   *    that includes: whether page is using https, how many super admins
   *    there are and etc
   */
  return (
    <Container.FullGray>
      <H2 className="text-2xl">{userText.securityPanel()}</H2>
      <div className="flex h-0 flex-1 flex-col gap-4 md:flex-row">
        <Aside institution={institution} />
        <ErrorBoundary dismissible>
          <SafeOutlet<SecurityOutlet> {...context} />
        </ErrorBoundary>
      </div>
    </Container.FullGray>
  );
}

function Aside({
  institution,
}: {
  readonly institution: SerializedResource<Institution> | undefined;
}): JSX.Element {
  const availableCollections = useAvailableCollections();
  return (
    <aside className={className.containerBase}>
      {typeof institution === 'object' && (
        <section>
          <H3>{schema.models.Institution.label}</H3>
          <ActiveLink href="/specify/security/institution">
            {institution.name as LocalizedString}
          </ActiveLink>
        </section>
      )}
      <section>
        <H3>
          {availableCollections.length === 0
            ? schema.models.Collection.label
            : userText.collections()}
        </H3>
        <ul>
          {availableCollections.map((collection, index) => (
            <li key={index}>
              <ActiveLink
                href={`/specify/security/collection/${collection.id}/`}
              >
                {collection.collectionName as LocalizedString}
              </ActiveLink>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
