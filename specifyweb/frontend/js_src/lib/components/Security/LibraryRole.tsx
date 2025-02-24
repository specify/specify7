import React from 'react';
import { useOutletContext } from 'react-router';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { GetOrSet, IR } from '../../utils/types';
import { defined, localized } from '../../utils/types';
import { removeKey, replaceKey } from '../../utils/utils';
import { LoadingContext } from '../Core/Contexts';
import { schema } from '../DataModel/schema';
import { tables } from '../DataModel/tables';
import { LoadingScreen } from '../Molecules/Dialog';
import { NotFoundView } from '../Router/NotFoundView';
import { locationToState } from '../Router/RouterState';
import type { SecurityOutlet } from '../Toolbar/Security';
import { createLibraryRole } from './CreateLibraryRole';
import { decompressPolicies } from './policyConverter';
import type { NewRole, Role } from './Role';
import { RoleView } from './Role';

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
      parentName={localized(institution.name) ?? tables.Institution.label}
      permissionName="/permissions/library/roles"
      role={role}
      roleUsers={undefined}
      userRoles={undefined}
      onAddUsers={undefined}
      onDelete={(): void =>
        typeof role.id === 'number'
          ? loading(
              ping(`/permissions/library_role/${role.id}/`, {
                method: 'DELETE',
              })
                .then((): void =>
                  handleChangeLibraryRoles(
                    removeKey(libraryRoles, role.id!.toString())
                  )
                )
                .then((): void => navigate(closeUrl, { replace: true }))
            )
          : undefined
      }
      onSave={(role): void =>
        loading(
          (typeof role.id === 'number'
            ? updateLibraryRole(handleChangeLibraryRoles, role as Role)
            : createLibraryRole(handleChangeLibraryRoles, role as Role)
          ).then((): void => navigate(closeUrl))
        )
      }
    />
  ) : role === false ? (
    <NotFoundView container={false} />
  ) : (
    <LoadingScreen />
  );
}

function useRole(
  libraryRoles: IR<Role> | undefined
): NewRole | Role | false | undefined {
  const location = useLocation();
  const state = locationToState(location, 'SecurityRole');
  const role = state?.role;
  const { roleId } = useParams();
  return React.useMemo(() => {
    if (typeof role === 'object') return role;
    const id = f.parseInt(roleId);
    if (typeof id === 'number') {
      return typeof libraryRoles === 'object'
        ? (libraryRoles[id] ?? false)
        : undefined;
    } else
      return {
        id: undefined,
        name: localized(''),
        description: localized(''),
        policies: [],
      };
  }, [libraryRoles, roleId, role]);
}

export const updateLibraryRole = async (
  handleChange: GetOrSet<IR<Role> | undefined>[1],
  role: Role
): Promise<void> =>
  ping(`/permissions/library_role/${role.id}/`, {
    method: 'PUT',
    body: {
      ...role,
      policies: decompressPolicies(role.policies),
    },
  }).then((): void =>
    handleChange((roles) =>
      replaceKey(defined(roles), role.id.toString(), role)
    )
  );
