import { GetOrSet, IR } from '../types';
import { NewRole, Role } from './securityrole';
import { ajax } from '../ajax';
import { Http } from '../ajaxUtils';
import {
  BackEndRole,
  decompressPolicies,
  processPolicies,
} from '../securityutils';
import { removeKey } from '../helpers';
import { CreateRole } from './securityroletemplate';
import React from 'react';

export const createLibraryRole = async (
  handleChange: GetOrSet<IR<Role> | undefined>[1],
  role: NewRole
): Promise<void> =>
  ajax<BackEndRole>(
    `/permissions/library_roles/`,
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
