import React from 'react';
import { useOutletContext } from 'react-router';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import type { GetOrSet, IR, RA } from '../../utils/types';
import { defined, localized } from '../../utils/types';
import { index } from '../../utils/utils';
import { Container, Ul } from '../Atoms';
import { formatConjunction } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import type { SerializedResource } from '../DataModel/helperTypes';
import { tables } from '../DataModel/tables';
import type { Collection } from '../DataModel/types';
import { useAvailableCollections } from '../Forms/OtherCollectionView';
import { userInformation } from '../InitialContext/userInformation';
import { useTitle } from '../Molecules/AppTitle';
import { RecordEdit } from '../Molecules/ResourceLink';
import { SetPermissionContext } from '../Permissions/Context';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { NotFoundView } from '../Router/NotFoundView';
import { formatUrl } from '../Router/queryString';
import { SafeOutlet } from '../Router/RouterUtils';
import type { SecurityOutlet } from '../Toolbar/Security';
import { CollectionRoles, CurrentUserLink } from './CollectionComponents';
import {
  mergeCollectionUsers,
  useCollectionUserRoles,
  useCollectionUsersWithPolicies,
} from './CollectionHooks';
import type { Role } from './Role';
import { fetchRoles } from './utils';

export type RoleBase = {
  readonly roleId: number;
  readonly roleName: LocalizedString;
};

export type UserRoles = RA<{
  readonly userId: number;
  readonly userName: LocalizedString;
  readonly roles: RA<RoleBase>;
  readonly isLoggedIn: boolean
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
    <NotFoundView container={false} />
  );
}

export function CollectionView({
  collection,
}: {
  readonly collection: SerializedResource<Collection>;
}): JSX.Element {
  useTitle(localized(collection.collectionName) ?? undefined);

  const getSetRoles = useAsyncState<IR<Role>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/roles', 'read', collection.id)
          ? fetchRoles(collection.id).then((roles) =>
              index(
                defined(
                  roles,
                  `Unable to fetch list of roles for collection with id ${collection.id}`
                )
              )
            )
          : undefined,
      [collection.id]
    ),
    false
  );

  const usersWithPolicies = useCollectionUsersWithPolicies(collection.id);
  useErrorContext('usersWithPolicies', usersWithPolicies);

  const getSetUserRoles = useCollectionUserRoles(collection.id);
  const [userRoles] = getSetUserRoles;
  useErrorContext('userRoles', userRoles);

  const mergedUsers = mergeCollectionUsers(userRoles, usersWithPolicies);

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
              {commonText.colonLine({
                label: tables.Collection.label,
                value: collection.collectionName ?? '',
              })}
            </h3>
            {hasTablePermission('Collection', 'read') && (
              <RecordEdit resource={collection} />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-6 overflow-y-scroll">
            {hasPermission('/permissions/roles', 'read', collection.id) && (
              <CollectionRoles
                collection={collection}
                getSetRoles={getSetRoles}
              >
                {isOverlay && outlet}
              </CollectionRoles>
            )}
            <section className="flex flex-col gap-2">
              <h4 className="text-xl">
                {userText.collectionUsers({
                  collectionTable: tables.Collection.label,
                })}
              </h4>
              {typeof mergedUsers === 'object' ? (
                mergedUsers.length === 0 ? (
                  commonText.none()
                ) : (
                  <>
                    <Ul>
                      {mergedUsers.map(({ userId, userName, roles, isLoggedIn }) => {
                        const canRead =
                          userId === userInformation.id ||
                          hasTablePermission('SpecifyUser', 'read');
                        const children = (
                          <>
                            {userName}
                            {roles.length > 0 && (
                              <span className="text-gray-500">
                                {`(${formatConjunction(
                                  roles.map(({ roleName }) => roleName)
                                )})`}
                              </span>
                            )}
                              <span
                                className={`ml-2 inline-block w-2.5 h-2.5 rounded-full  
                                  ${isLoggedIn ? 'bg-green-500' : 'bg-red-500'}
                                `}
                              />
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
                                    formatUrl(
                                      `/specify/security/user/${userId}/`,
                                      {
                                        collection: collection.id,
                                      }
                                    )
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
                      <Link.Success
                        href="/specify/security/user/new/"
                        onClick={(event): void => {
                          event.preventDefault();
                          navigate(
                            formatUrl('/specify/security/user/new/', {
                              collection: collection.id,
                            })
                          );
                        }}
                      >
                        {userText.addUser()}
                      </Link.Success>
                    </div>
                  </>
                )
              ) : hasPermission(
                  '/permissions/user/roles',
                  'read',
                  collection.id
                ) ? (
                commonText.loading()
              ) : (
                <CurrentUserLink collectionId={collection.id} />
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
