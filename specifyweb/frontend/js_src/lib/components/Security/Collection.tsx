import React from 'react';
import { useOutletContext } from 'react-router';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ajax } from '../../utils/ajax';
import type { Collection } from '../DataModel/types';
import type { KeysToLowerCase, SerializedResource } from '../DataModel/helpers';
import { index, sortFunction } from '../../utils/utils';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { fetchResource } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { fetchRoles } from './utils';
import type { GetOrSet, IR, RA, RR } from '../../utils/types';
import { defined } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { LoadingContext } from '../Core/Contexts';
import { useAsyncState, useBooleanState, useTitle } from '../../hooks/hooks';
import { formatList } from '../Atoms/Internationalization';
import { NotFoundView } from '../Router/NotFoundView';
import { useAvailableCollections } from '../Forms/OtherCollectionView';
import { SetPermissionContext } from '../Permissions/Context';
import { deserializeResource } from '../../hooks/resource';
import { ResourceView } from '../Forms/ResourceView';
import { SafeOutlet } from '../Router/RouterUtils';
import { updateCollectionRole } from './CollectionRole';
import { createCollectionRole } from './CreateRole';
import { ImportExport } from './ImportExport';
import type { Role } from './Role';
import type { SecurityOutlet } from '../Toolbar/Security';
import { useErrorContext } from '../../hooks/useErrorContext';
import { Container, Ul } from '../Atoms';
import { Link } from '../Atoms/Link';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';

export type RoleBase = {
  readonly roleId: number;
  readonly roleName: string;
};

export type UserRoles = RA<{
  readonly userId: number;
  readonly userName: string;
  readonly roles: RA<RoleBase>;
}>;

export type SecurityCollectionOutlet = SecurityOutlet & {
  readonly collection: SerializedResource<Collection>;
  readonly getSetRoles: GetOrSet<IR<Role> | undefined>;
  readonly getSetUserRoles: GetOrSet<UserRoles | undefined>;
};

export function SecurityCollection(): JSX.Element {
  const { collectionId = '' } = useParams();
  const availableCollections = useAvailableCollections();
  const collection = availableCollections.find(
    ({ id }) => id.toString() === collectionId
  );
  return typeof collection === 'object' ? (
    <SetPermissionContext collectionId={collection.id}>
      <CollectionView collection={collection} />
    </SetPermissionContext>
  ) : (
    <NotFoundView />
  );
}

export function CollectionView({
  collection,
}: {
  readonly collection: SerializedResource<Collection>;
}): JSX.Element {
  const getSetRoles = useAsyncState<IR<Role>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/roles', 'read', collection.id)
          ? fetchRoles(collection.id).then((roles) => index(defined(roles)))
          : undefined,
      [collection.id]
    ),
    false
  );
  const [roles, setRoles] = getSetRoles;
  useErrorContext('roles', roles);

  const [usersWithPolicies] = useAsyncState<
    RA<{ readonly userId: number; readonly userName: string }>
  >(
    React.useCallback(
      () =>
        hasPermission('/permissions/policies/user', 'read', collection.id) &&
        hasTablePermission('SpecifyUser', 'read')
          ? ajax<RR<number, IR<RA<string>>>>(
              `/permissions/user_policies/${collection.id}/`,
              {
                headers: { Accept: 'application/json' },
              }
            ).then(async ({ data }) =>
              Promise.all(
                Object.keys(data)
                  .map((userId) => Number.parseInt(userId))
                  .map(async (userId) => ({
                    userId,
                    userName: await fetchResource('SpecifyUser', userId).then(
                      ({ name }) => name
                    ),
                  }))
              )
            )
          : [{ userId: userInformation.id, userName: userInformation.name }],
      [collection.id]
    ),
    false
  );

  const getSetUserRoles = useAsyncState<UserRoles>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/user/roles', 'read', collection.id)
          ? ajax<RA<KeysToLowerCase<UserRoles[number]>>>(
              `/permissions/user_roles/${collection.id}/`,
              {
                method: 'GET',
                headers: { Accept: 'application/json' },
              }
            ).then(({ data }) =>
              data.map(({ userid, username, roles }) => ({
                userId: userid,
                userName: username,
                roles: roles
                  .map(({ roleid, rolename }) => ({
                    roleId: roleid,
                    roleName: rolename,
                  }))
                  .sort(sortFunction(({ roleName }) => roleName)),
              }))
            )
          : undefined,
      [collection.id]
    ),
    false
  );
  const [userRoles] = getSetUserRoles;
  useErrorContext('userRoles', userRoles);

  // Combine users that have only policies or only roles together into one list
  const mergedUsers =
    typeof userRoles === 'object'
      ? [
          ...userRoles.filter(({ roles }) => roles.length > 0),
          ...(usersWithPolicies ?? [])
            .filter(({ userId }) =>
              userRoles.every(
                (user) => user.userId !== userId || user.roles.length === 0
              )
            )
            .map(({ userId, userName }) => ({
              userId,
              userName,
              roles: [],
            })),
        ].sort(sortFunction(({ userName }) => userName))
      : undefined;

  useTitle(collection.collectionName ?? undefined);

  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isOverlay = location.pathname.startsWith(
    `/specify/security/collection/${collection.id}/role/create/`
  );
  const isRoleState =
    !isOverlay &&
    location.pathname.startsWith(
      `/specify/security/collection/${collection.id}/role`
    );
  const isMainState = !isRoleState;
  const outletState = useOutletContext<SecurityOutlet>();
  const outlet = (
    <SafeOutlet<SecurityCollectionOutlet>
      {...outletState}
      collection={collection}
      getSetRoles={getSetRoles}
      getSetUserRoles={getSetUserRoles}
    />
  );

  return (
    <Container.Base className="flex-1 gap-6">
      {isMainState || isOverlay ? (
        <>
          <div className="flex gap-2">
            <h3 className="text-2xl">
              {`${schema.models.Collection.label}: ${
                collection.collectionName ?? ''
              }`}
            </h3>
            {hasTablePermission('Collection', 'read') && (
              <ViewCollectionButton collection={collection} />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-6 overflow-y-scroll">
            {hasPermission('/permissions/roles', 'read', collection.id) && (
              <section className="flex flex-col gap-1">
                <h4 className="text-xl">{adminText('collectionUserRoles')}</h4>
                {typeof roles === 'object' ? (
                  <Ul>
                    {Object.values(roles)
                      .sort(sortFunction(({ name }) => name))
                      .map((role) => (
                        <li key={role.id}>
                          <Link.Default
                            href={`/specify/security/collection/${collection.id}/role/${role.id}/`}
                          >
                            {role.name}
                          </Link.Default>
                        </li>
                      ))}
                  </Ul>
                ) : (
                  commonText('loading')
                )}
                <div className="flex gap-2">
                  {hasPermission(
                    '/permissions/roles',
                    'create',
                    collection.id
                  ) ||
                  (hasPermission(
                    '/permissions/roles',
                    'copy_from_library',
                    collection.id
                  ) &&
                    hasPermission('/permissions/library/roles', 'read')) ? (
                    <CreateRoleButton
                      collectionId={collection.id}
                      isDisabled={
                        !Array.isArray(userRoles) &&
                        hasPermission(
                          '/permissions/user/roles',
                          'read',
                          collection.id
                        )
                      }
                    />
                  ) : undefined}
                  {isOverlay && outlet}
                  <ImportExport
                    baseName={collection.collectionName ?? ''}
                    collectionId={collection.id}
                    permissionName="/permissions/roles"
                    roles={roles}
                    onCreateRole={(role): void =>
                      loading(
                        createCollectionRole(setRoles, collection.id, role)
                      )
                    }
                    onUpdateRole={(role): void =>
                      loading(updateCollectionRole(getSetRoles, role))
                    }
                  />
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h4 className="text-xl">{adminText('collectionUsers')}</h4>
              {typeof mergedUsers === 'object' ? (
                mergedUsers.length === 0 ? (
                  commonText('none')
                ) : (
                  <>
                    <Ul>
                      {mergedUsers.map(({ userId, userName, roles }) => {
                        const canRead =
                          userId === userInformation.id ||
                          hasTablePermission('SpecifyUser', 'read');
                        const children = (
                          <>
                            {userName}
                            {roles.length > 0 && (
                              <span className="text-gray-500">
                                {`(${formatList(
                                  roles.map(({ roleName }) => roleName)
                                )})`}
                              </span>
                            )}
                          </>
                        );
                        return (
                          <li key={userId}>
                            {canRead ? (
                              <Link.Default
                                href={`/specify/security/user/${userId}/`}
                                onClick={(event): void => {
                                  event.preventDefault();
                                  navigate(
                                    `/specify/security/user/${userId}/`,
                                    {
                                      state: {
                                        initialCollectionId: collection.id,
                                      },
                                    }
                                  );
                                }}
                              >
                                {children}
                              </Link.Default>
                            ) : (
                              children
                            )}
                          </li>
                        );
                      })}
                    </Ul>
                    <div>
                      <Link.Green
                        href="/specify/security/user/new/"
                        onClick={(event): void => {
                          event.preventDefault();
                          navigate('/specify/security/user/new/', {
                            state: {
                              initialCollectionId: collection.id,
                            },
                          });
                        }}
                      >
                        {commonText('create')}
                      </Link.Green>
                    </div>
                  </>
                )
              ) : hasPermission(
                  '/permissions/user/roles',
                  'read',
                  collection.id
                ) ? (
                commonText('loading')
              ) : (
                <CurrentUser collectionId={collection.id} />
              )}
            </section>
          </div>
        </>
      ) : (
        outlet
      )}
    </Container.Base>
  );
}

/**
 * Display a button to open current user
 *
 * @remarks
 * Used when the user doesn't have read permission to SpecifyUser table
 */
function CurrentUser({
  collectionId,
}: {
  readonly collectionId: number;
}): JSX.Element {
  const navigate = useNavigate();
  return (
    <Link.Default
      href={`/specify/security/user/${userInformation.id}/`}
      onClick={(event): void => {
        event.preventDefault();
        navigate(`/specify/security/user/${userInformation.id}/`, {
          state: {
            initialCollectionId: collectionId,
          },
        });
      }}
    >
      {userInformation.name}
    </Link.Default>
  );
}

function CreateRoleButton({
  isDisabled,
  collectionId,
}: {
  readonly isDisabled: boolean;
  readonly collectionId: number;
}): JSX.Element {
  return isDisabled ? (
    <Button.Green onClick={undefined}>{commonText('create')}</Button.Green>
  ) : (
    <Link.Green
      href={`/specify/security/collection/${collectionId}/role/create/`}
    >
      {commonText('create')}
    </Link.Green>
  );
}

function ViewCollectionButton({
  collection,
}: {
  readonly collection: SerializedResource<Collection>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resource = React.useMemo(
    () => deserializeResource(collection),
    [collection]
  );
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <ResourceView
          canAddAnother={false}
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={resource}
          onClose={handleClose}
          onDeleted={undefined}
          onSaved={undefined}
        />
      )}
    </>
  );
}
