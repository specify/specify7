import React from 'react';
import { useOutletContext } from 'react-router';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/helpers';
import { removeKey } from '../../utils/utils';
import type { BackEndRole } from './utils';
import type { GetOrSet, IR } from '../../utils/types';
import { NotFoundView } from '../Router/NotFoundView';
import type { SecurityCollectionOutlet } from './Collection';
import type { NewRole, Role } from './Role';
import { CreateRole } from './RoleTemplate';
import { decompressPolicies, processPolicies } from './policyConverter';

export const createCollectionRole = async (
  setRoles: GetOrSet<IR<Role> | undefined>[1],
  collectionId: number,
  role: NewRole | Role
): Promise<void> =>
  typeof role.id === 'number'
    ? setRoles((roles) => ({
        ...roles,
        [role.id!]: {
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
