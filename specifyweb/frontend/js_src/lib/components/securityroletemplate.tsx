import React from 'react';

import type { Collection } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { fetchRoles } from '../securityutils';
import type { IR } from '../types';
import { getUniqueName } from '../wbuniquifyname';
import { Button, H3, Select, Ul } from './basic';
import { useAsyncState } from './hooks';
import { Dialog } from './modaldialog';
import type { NewRole, Role } from './securityrole';

export function CreateRole({
  libraryRoles,
  collections,
  onCreated: handleCreated,
  onClose: handleClose,
}: {
  readonly libraryRoles: IR<Role> | undefined;
  readonly collections: IR<SpecifyResource<Collection>>;
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
            {adminText('fromScratch')}
          </Button.Blue>
        </>
      }
      onClose={handleClose}
    >
      <section>
        <H3>{adminText('fromLibrary')}</H3>
        {typeof libraryRoles === 'object' ? (
          <Select
            onValueChange={(roleId): void =>
              handleCreated({
                id: undefined,
                name: getUniqueName(libraryRoles[roleId].name, [
                  libraryRoles[roleId].name,
                ]),
                description: libraryRoles[roleId].description,
                policies: libraryRoles[roleId].policies,
              })
            }
          >
            <option />
            {Object.values(libraryRoles).map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        ) : (
          commonText('loading')
        )}
      </section>
      <section>
        <H3>{adminText('fromExistingRole')}</H3>
        {typeof roles === 'object' ? (
          <div className="flex flex-col gap-2">
            {roles
              .filter(([_collection, roles]) => roles.length > 0)
              .map(([collection, roles]) => (
                <article key={collection.id}>
                  {collection.get('collectionName')}
                  <Ul>
                    {roles.map((role) => (
                      <li key={role.id}>
                        <Button.LikeLink
                          onClick={(): void =>
                            handleCreated({
                              id: undefined,
                              name: getUniqueName(role.name, [role.name]),
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
    </Dialog>
  );
}
