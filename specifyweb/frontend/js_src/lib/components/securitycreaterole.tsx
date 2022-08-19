import React from 'react';
import { useOutletContext } from 'react-router';

import { ajax } from '../ajax';
import { Http } from '../ajaxUtils';
import { removeKey } from '../helpers';
import type { BackEndRole } from '../securityutils';
import { decompressPolicies, processPolicies } from '../securityutils';
import type { GetOrSet, IR } from '../types';
import { defined } from '../types';
import { NotFoundView } from './notfoundview';
import type { SecurityCollectionOutlet } from './securitycollection';
import type { NewRole, Role } from './securityrole';
import { CreateRole } from './securityroletemplate';

export const createCollectionRole = async (
  setRoles: GetOrSet<IR<Role> | undefined>[1],
  collectionId: number,
  role: NewRole | Role
): Promise<void> =>
  typeof role.id === 'number'
    ? setRoles((roles) => ({
        ...roles,
        [defined(role.id)]: {
          ...(role as Role),
        },
      }))
    : ajax<BackEndRole>(
        `/permissions/roles/${collectionId}/`,
        {
          method: 'POST',
          body: {
            ...removeKey(role, 'id'),
            policies: decompressPolicies(role.policies),
          },
          headers: { Accept: 'application/json' },
        },
        { expectedResponseCodes: [Http.CREATED] }
      ).then(({ data: role }) =>
        setRoles((roles) => ({
          ...roles,
          [role.id]: {
            ...role,
            policies: processPolicies(role.policies),
          },
        }))
      );

export function CreateCollectionRole(): JSX.Element {
  const { collection } = useOutletContext<SecurityCollectionOutlet>();
  return typeof collection === 'object' ? (
    <CreateRole
      closeUrl={`/specify/security/collection/${collection.id}/`}
      getCreatedUrl={(id): string =>
        `/specify/security/collection/${collection.id}/role/${id ?? 'new'}/`
      }
      scope={collection.id}
    />
  ) : (
    <NotFoundView />
  );
}
