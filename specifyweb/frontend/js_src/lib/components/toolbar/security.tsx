/**
 * Entrypoint for the Security Panel
 */

import React from 'react';

import { ajax } from '../../ajax';
import { fetchCollection } from '../../collection';
import type { Institution, SpecifyUser } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import { serializeResource } from '../../datamodelutils';
import { index } from '../../helpers';
import { adminText } from '../../localization/admin';
import { hasPermission, hasTablePermission } from '../../permissionutils';
import { schema } from '../../schema';
import type { BackEndRole } from '../../securityutils';
import { processPolicies } from '../../securityutils';
import type { GetOrSet, IR, RA } from '../../types';
import { userInformation } from '../../userinfo';
import { className, Container, H2, H3 } from '../basic';
import { ActiveLink } from '../common';
import { ErrorBoundary } from '../errorboundary';
import { useAsyncState } from '../hooks';
import { useAvailableCollections } from '../othercollectionview';
import { SafeOutlet } from '../routerutils';
import type { Role } from '../securityrole';

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
   * FEATURE: replace blank home page with a security dashabord
   *    that includes: whether page is using https, how many super admins
   *    there are and etc
   */
  return (
    <Container.FullGray>
      <H2 className="text-2xl">{adminText('securityPanel')}</H2>
      <div className="flex h-0 flex-1 gap-4">
        <Aside institution={institution} />
        <ErrorBoundary dismissable>
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
            {institution.name}
          </ActiveLink>
        </section>
      )}
      <section>
        <H3>{adminText('collections')}</H3>
        <ul>
          {availableCollections.map((collection, index) => (
            <li key={index}>
              <ActiveLink
                href={`/specify/security/collection/${collection.id}`}
              >
                {collection.collectionName}
              </ActiveLink>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
