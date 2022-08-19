import React from 'react';
import { useOutletContext } from 'react-router';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ping } from '../ping';
import { Http } from '../ajaxUtils';
import { f } from '../functools';
import { removeKey, replaceKey } from '../helpers';
import { schema } from '../schema';
import { decompressPolicies } from '../securityutils';
import type { GetOrSet, IR } from '../types';
import { defined } from '../types';
import { LoadingContext } from './contexts';
import { LoadingScreen } from './modaldialog';
import { NotFoundView } from './notfoundview';
import { createLibraryRole } from './securitycreatelibraryrole';
import type { NewRole, Role } from './securityrole';
import { RoleView } from './securityrole';
import type { SecurityOutlet } from './toolbar/security';

const closeUrl = '/specify/security/institution/';

export function SecurityLibraryRole(): JSX.Element {
  const { getSetLibraryRoles, institution } =
    useOutletContext<SecurityOutlet>();
  const [libraryRoles, handleChangeLibraryRoles] = getSetLibraryRoles;
  const role = useRole(libraryRoles);
  const navigate = useNavigate();
  const loading = React.useContext(LoadingContext);
  return typeof libraryRoles === 'object' &&
    typeof role === 'object' &&
    typeof institution === 'object' ? (
    <RoleView
      closeUrl={closeUrl}
      collectionId={schema.domainLevelIds.collection}
      parentName={institution.name ?? schema.models.Institution.label}
      permissionName="/permissions/library/roles"
      role={role}
      userRoles={undefined}
      onAddUsers={undefined}
      roleUsers={undefined}
      onDelete={(): void =>
        typeof role.id === 'number'
          ? loading(
              ping(
                `/permissions/library_role/${role.id}/`,
                {
                  method: 'DELETE',
                },
                { expectedResponseCodes: [Http.NO_CONTENT] }
              )
                .then((): void =>
                  handleChangeLibraryRoles(
                    removeKey(libraryRoles, defined(role.id).toString())
                  )
                )
                .then((): void => navigate(closeUrl))
            )
          : undefined
      }
      onSave={(role): void =>
        loading(
          (typeof role.id === 'number'
            ? createLibraryRole(handleChangeLibraryRoles, role as Role)
            : updateLibraryRole(handleChangeLibraryRoles, role as Role)
          ).then((): void => navigate(closeUrl))
        )
      }
    />
  ) : role === false ? (
    <NotFoundView />
  ) : (
    <LoadingScreen />
  );
}

function useRole(
  libraryRoles: IR<Role> | undefined
): NewRole | Role | false | undefined {
  const location = useLocation();
  const state = location.state as
    | { readonly role?: NewRole | Role }
    | undefined;
  const role = state?.role;
  const { roleId } = useParams();
  return React.useMemo(() => {
    if (typeof role === 'object') return role;
    const id = f.parseInt(roleId);
    if (typeof id === 'number') {
      return typeof libraryRoles === 'object'
        ? libraryRoles[id] ?? false
        : undefined;
    } else
      return {
        id: undefined,
        name: '',
        description: '',
        policies: [],
      };
  }, [libraryRoles, roleId, role]);
}

export const updateLibraryRole = async (
  handleChange: GetOrSet<IR<Role> | undefined>[1],
  role: Role
): Promise<void> =>
  ping(
    `/permissions/library_role/${role.id}/`,
    {
      method: 'PUT',
      body: {
        ...role,
        policies: decompressPolicies(role.policies),
      },
    },
    { expectedResponseCodes: [Http.NO_CONTENT] }
  ).then((): void =>
    handleChange((roles) =>
      replaceKey(defined(roles), role.id.toString(), role)
    )
  );
