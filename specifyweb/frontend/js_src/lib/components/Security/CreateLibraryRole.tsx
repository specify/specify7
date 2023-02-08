import React from 'react';

import { ajax } from '../../utils/ajax';
import type { GetOrSet, IR } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { decompressPolicies, processPolicies } from './policyConverter';
import type { NewRole, Role } from './Role';
import { CreateRole } from './RoleTemplate';
import type { BackEndRole } from './utils';

export const createLibraryRole = async (
  handleChange: GetOrSet<IR<Role> | undefined>[1],
  role: NewRole
): Promise<void> =>
  ajax<BackEndRole>(`/permissions/library_roles/`, {
    method: 'POST',
    body: {
      ...removeKey(role, 'id'),
      policies: decompressPolicies(role.policies),
    },
    headers: { Accept: 'application/json' },
  }).then(({ data: role }) =>
    handleChange((roles) => ({
      ...roles,
      [role.id]: {
        ...role,
        policies: processPolicies(role.policies),
      },
    }))
  );

export function CreateLibraryRole(): JSX.Element {
  return (
    <CreateRole
      closeUrl="/specify/security/institution/"
      getCreatedUrl={(id): string =>
        `/specify/security/institution/role/${id ?? 'new'}/`
      }
      scope="institution"
    />
  );
}
