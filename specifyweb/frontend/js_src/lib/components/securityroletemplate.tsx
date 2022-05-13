import React from 'react';

import type { Collection } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission } from '../permissions';
import { fetchRoles } from '../securityutils';
import type { IR } from '../types';
import { getUniqueName } from '../wbuniquifyname';
import { Button, H3, Ul } from './basic';
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
  readonly collections: IR<SerializedResource<Collection>>;
  readonly scope: number | 'institution';
  readonly onCreated: (role: NewRole | Role) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [roles] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          Object.values(collections).map(async (collection) =>
            fetchRoles(collection.id, undefined).then(
              (roles) => [collection ?? '', roles] as const
            )
          )
        ),
      [collections]
    ),
    false
  );
  return (
    <Dialog
      header={adminText('createRoleDialogHeader')}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
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
        </>
      }
      onClose={handleClose}
    >
      {hasPermission('/permissions/roles', 'copy_from_library') && (
        <section>
          <H3>{adminText('fromLibrary')}</H3>
          {typeof libraryRoles === 'object' ? (
            Object.keys(libraryRoles).length === 0 ? (
              commonText('none')
            ) : (
              <Ul>
                {Object.entries(libraryRoles).map(([roleId, role]) => (
                  <li key={roleId}>
                    <Button.LikeLink
                      onClick={(): void =>
                        handleCreated({
                          id: undefined,
                          name:
                            scope === 'institution'
                              ? getUniqueName(role.name, [role.name])
                              : role.name,
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
            )
          ) : (
            commonText('loading')
          )}
        </section>
      )}
      {hasPermission('/permissions/roles', 'create') && (
        <section>
          <H3>{adminText('fromExistingRole')}</H3>
          {typeof roles === 'object' ? (
            <div className="flex flex-col gap-4">
              {roles
                .filter(([_collection, roles]) => roles.length > 0)
                .map(([collection, roles]) => (
                  <article key={collection.id}>
                    {collection.collectionName}
                    <Ul>
                      {roles.map((role) => (
                        <li key={role.id}>
                          <Button.LikeLink
                            onClick={(): void =>
                              handleCreated({
                                id: undefined,
                                name:
                                  scope === collection.id
                                    ? getUniqueName(role.name, [role.name])
                                    : role.name,
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
      )}
    </Dialog>
  );
}
