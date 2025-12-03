import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { localized } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { keysToLowerCase, sortFunction } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { schema } from '../DataModel/schema';
import { useAvailableCollections } from '../Forms/OtherCollectionView';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import type { SecurityOutlet } from '../Toolbar/Security';
import type { NewRole, Role } from './Role';
import type { BackEndRole } from './utils';
import { fetchRoles } from './utils';

export function CreateRole({
  scope,
  closeUrl,
  getCreatedUrl,
}: {
  readonly scope: number | 'institution';
  readonly closeUrl: string;
  readonly getCreatedUrl: (id: number | undefined) => string;
}): JSX.Element {
  const {
    getSetLibraryRoles: [libraryRoles],
  } = useOutletContext<SecurityOutlet>();

  const collections = useAvailableCollections();

  const collectionId =
    typeof scope === 'number' ? scope : schema.domainLevelIds.collection;
  const [roles] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          collections.map(async (collection) =>
            fetchRoles(collection.id).then(
              (roles) => [collection ?? '', roles ?? []] as const
            )
          )
        ).then((roles) =>
          roles.filter(([_collection, roles]) => roles.length > 0)
        ),
      [collections]
    ),
    false
  );
  const currentRoleNames = (
    scope === 'institution'
      ? Object.values(libraryRoles ?? [])
      : (Object.values(roles ?? []).find(([{ id }]) => id === scope)?.[1] ?? [])
  ).map(({ name }) => name);
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();

  const handleCreated = (role: NewRole | Role): void =>
    navigate(getCreatedUrl(role.id), {
      state: {
        type: 'SecurityRole',
        role,
      },
    });

  return (
    <Dialog
      buttons={
        <>
          {(scope === 'institution' ||
            hasPermission('/permissions/roles', 'create', collectionId)) && (
            <Button.Info
              onClick={(): void =>
                handleCreated({
                  id: undefined,
                  name: userText.newRole(),
                  description: localized(''),
                  policies: [],
                })
              }
            >
              {commonText.new()}
            </Button.Info>
          )}
          <span className="-ml-2 flex-1" />
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
        </>
      }
      header={userText.addRole()}
      onClose={(): void => navigate(closeUrl)}
    >
      {scope === 'institution' ||
      ((hasPermission(
        '/permissions/roles',
        'copy_from_library',
        collectionId
      ) ||
        hasPermission('/permissions/roles', 'create', collectionId)) &&
        hasPermission('/permissions/library/roles', 'read', collectionId)) ? (
        <section>
          <H3>{userText.fromLibrary()}</H3>
          {typeof libraryRoles === 'object' ? (
            Object.keys(libraryRoles).length === 0 ? (
              commonText.none()
            ) : (
              <Ul>
                {Object.values(libraryRoles)
                  .sort(sortFunction(({ name }) => name))
                  .map((role) => (
                    <li key={role.id}>
                      <Button.LikeLink
                        onClick={(): void => {
                          const roleName = getUniqueName(
                            role.name,
                            currentRoleNames
                          );
                          loading(
                            (scope === 'institution' ||
                            hasPermission(
                              '/permissions/roles',
                              'create',
                              collectionId
                            )
                              ? Promise.resolve({
                                  ...role,
                                  id: undefined,
                                  name: roleName,
                                })
                              : /*
                                 * If don't have permission to create a role
                                 * but have permission to copy from the library,
                                 * must provide libraryRoleId in the request
                                 * body
                                 */
                                ajax<BackEndRole>(
                                  `/permissions/roles/${collectionId}/`,
                                  {
                                    headers: { Accept: 'application/json' },
                                    method: 'POST',
                                    body: keysToLowerCase({
                                      libraryRoleId: role.id,
                                      name: roleName,
                                    }),
                                  }
                                ).then(({ data }) => data)
                            ).then((newRole) =>
                              handleCreated({
                                ...newRole,
                                policies: role.policies,
                              })
                            )
                          );
                        }}
                      >
                        {role.name}
                      </Button.LikeLink>
                    </li>
                  ))}
              </Ul>
            )
          ) : (
            commonText.loading()
          )}
        </section>
      ) : undefined}
      {(scope === 'institution' ||
        hasPermission('/permissions/roles', 'create', collectionId)) &&
      (!Array.isArray(roles) || roles.length > 0) ? (
        <section>
          <H3>{userText.fromExistingRole()}</H3>
          {typeof roles === 'object' ? (
            <div className="flex flex-col gap-4">
              {roles.map(([collection, roles]) => (
                <article key={collection.id}>
                  {commonText.colonHeader({
                    header:
                      collection.collectionName ?? collection.id.toString(),
                  })}
                  <Ul>
                    {roles.map((role) => (
                      <li key={role.id}>
                        <Button.LikeLink
                          onClick={(): void =>
                            handleCreated({
                              id: undefined,
                              name: getUniqueName(role.name, currentRoleNames),
                              description: role.description,
                              policies: role.policies,
                            })
                          }
                        >
                          {role.name}
                        </Button.LikeLink>
                      </li>
                    ))}
                  </Ul>
                </article>
              ))}
            </div>
          ) : (
            commonText.loading()
          )}
        </section>
      ) : undefined}
    </Dialog>
  );
}
