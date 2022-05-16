import React from 'react';

import { ajax, Http } from '../ajax';
import type { Collection } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { keysToLowerCase } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission } from '../permissions';
import { schema } from '../schema';
import type { BackEndRole } from '../securityutils';
import { fetchRoles } from '../securityutils';
import type { IR, RA } from '../types';
import { getUniqueName } from '../wbuniquifyname';
import { Button, H3, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState } from './hooks';
import { Dialog } from './modaldialog';
import type { NewRole, Role } from './securityrole';

export function CreateRole({
  libraryRoles,
  collections,
  scope,
  onCreated: handleCreated,
  onClose: handleClose,
}: {
  readonly libraryRoles: IR<Role> | undefined;
  readonly collections: RA<SerializedResource<Collection>>;
  readonly scope: number | 'institution';
  readonly onCreated: (role: NewRole | Role) => void;
  readonly onClose: () => void;
}): JSX.Element {
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
      : Object.values(roles ?? []).find(([{ id }]) => id === scope)?.[1] ?? []
  ).map(({ name }) => name);
  const loading = React.useContext(LoadingContext);
  return (
    <Dialog
      header={adminText('createRoleDialogHeader')}
      buttons={
        <>
          {scope === 'institution' ||
            (hasPermission('/permissions/roles', 'create', collectionId) && (
              <Button.Blue
                onClick={(): void =>
                  handleCreated({
                    id: undefined,
                    name: adminText('newRole'),
                    description: '',
                    policies: [],
                  })
                }
              >
                {commonText('new')}
              </Button.Blue>
            ))}
          <span className="flex-1 -ml-2" />
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
        </>
      }
      onClose={handleClose}
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
          <H3>{adminText('fromLibrary')}</H3>
          {typeof libraryRoles === 'object' ? (
            Object.keys(libraryRoles).length === 0 ? (
              commonText('none')
            ) : (
              <Ul>
                {Object.entries(libraryRoles).map(([libraryRoleId, role]) => (
                  <li key={libraryRoleId}>
                    <Button.LikeLink
                      onClick={(): void =>
                        f.var(
                          getUniqueName(role.name, currentRoleNames),
                          (roleName) =>
                            loading(
                              (scope === 'institution' ||
                              hasPermission(
                                '/permissions/roles',
                                'create',
                                collectionId
                              )
                                ? Promise.resolve(undefined)
                                : ajax<BackEndRole>(
                                    `/permissions/roles/${collectionId}/`,
                                    {
                                      headers: { Accept: 'application/json' },
                                      method: 'POST',
                                      body: keysToLowerCase({
                                        libraryRoleId,
                                        name: roleName,
                                      }),
                                    },
                                    {
                                      expectedResponseCodes: [Http.CREATED],
                                    }
                                  ).then(({ data }) => data.id)
                              ).then((roleId) =>
                                handleCreated({
                                  id: roleId,
                                  name: roleName,
                                  description: role.description,
                                  policies: role.policies,
                                })
                              )
                            )
                        )
                      }
                    >
                      {role.name}
                    </Button.LikeLink>
                  </li>
                ))}
              </Ul>
            )
          ) : (
            commonText('loading')
          )}
        </section>
      ) : undefined}
      {scope === 'institution' ||
        (hasPermission('/permissions/roles', 'create', collectionId) &&
          (!Array.isArray(roles) || roles.length > 0) && (
            <section>
              <H3>{adminText('fromExistingRole')}</H3>
              {typeof roles === 'object' ? (
                <div className="flex flex-col gap-4">
                  {roles.map(([collection, roles]) => (
                    <article key={collection.id}>
                      {`${collection.collectionName ?? collection.id}:`}
                      <Ul>
                        {roles.map((role) => (
                          <li key={role.id}>
                            <Button.LikeLink
                              onClick={(): void =>
                                handleCreated({
                                  id: undefined,
                                  name: getUniqueName(
                                    role.name,
                                    currentRoleNames
                                  ),
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
                commonText('loading')
              )}
            </section>
          ))}
    </Dialog>
  );
}
