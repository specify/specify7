/**
 * Entrypoint for the Security Panel
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../../ajax';
import { fetchCollection } from '../../collection';
import type { SpecifyUser } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import { addMissingFields, serializeResource } from '../../datamodelutils';
import { index, removeKey } from '../../helpers';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { hasPermission, hasTablePermission } from '../../permissions';
import { schema } from '../../schema';
import type { BackEndRole } from '../../securityutils';
import { processPolicies } from '../../securityutils';
import type { IR, RA } from '../../types';
import { defined } from '../../types';
import { userInformation } from '../../userinfo';
import { Button, className, Container, H2, H3 } from '../basic';
import { useAsyncState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { useAvailableCollections } from '../othercollectionview';
import { SetPermissionContext } from '../permissioncontext';
import { SecurityCollection } from '../securitycollection';
import { SecurityInsitution } from '../securityinstitution';
import type { Role } from '../securityrole';
import { SecurityUser } from '../securityuser';

export function SecurityPanel(): JSX.Element | null {
  useTitle(adminText('securityPanel'));

  const [institution] = useAsyncState(
    React.useCallback(
      async () =>
        hasTablePermission('Institution', 'read')
          ? fetchCollection('Institution', { limit: 1 }).then(
              ({ records }) => records[0]
            )
          : undefined,
      []
    ),
    true
  );
  const availableCollections = useAvailableCollections();

  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'InstitutionState'>
    | State<
        'CollectionState',
        {
          readonly collectionId: number;
          readonly initialRole: number | undefined;
        }
      >
    | State<
        'UserState',
        {
          readonly initialCollection: number;
          readonly user: SerializedResource<SpecifyUser>;
        }
      >
  >({ type: 'MainState' });

  const [users, setUsers] = useAsyncState<IR<SerializedResource<SpecifyUser>>>(
    React.useCallback(
      async () =>
        hasTablePermission('SpecifyUser', 'read')
          ? fetchCollection('SpecifyUser', { limit: 0 }).then(({ records }) =>
              index(records)
            )
          : {
              [userInformation.id]: serializeResource(userInformation),
            },
      []
    ),
    false
  );

  const [libraryRoles, setLibraryRoles] = useAsyncState<IR<Role>>(
    React.useCallback(
      async () =>
        hasPermission('/permissions/library/roles', 'read')
          ? ajax<RA<BackEndRole>>('/permissions/library_roles/', {
              headers: { Accept: 'application/json' },
            }).then(({ data }) =>
              index(
                data.map((role) => ({
                  ...role,
                  policies: processPolicies(role.policies),
                }))
              )
            )
          : undefined,
      []
    ),
    false
  );

  // TODO: use a routing library to make navigation easier
  return (
    <Container.FullGray>
      <H2 className="text-2xl">{adminText('securityPanel')}</H2>
      <div className="flex flex-1 h-0 gap-4">
        <aside className={className.containerBase}>
          {typeof institution === 'object' && (
            <section>
              <H3>{schema.models.Institution.label}</H3>
              <Button.LikeLink
                aria-pressed={state.type === 'InstitutionState'}
                onClick={(): void =>
                  setState({
                    type: 'InstitutionState',
                  })
                }
              >
                {institution.name}
              </Button.LikeLink>
            </section>
          )}
          <section>
            <H3>{adminText('collections')}</H3>
            <ul>
              {availableCollections.map((collection, index) => (
                <li key={index}>
                  <Button.LikeLink
                    aria-pressed={
                      state.type === 'CollectionState' &&
                      state.collectionId === collection.id
                    }
                    onClick={(): void =>
                      setState({
                        type: 'CollectionState',
                        collectionId: collection.id,
                        initialRole: undefined,
                      })
                    }
                  >
                    {collection.collectionName}
                  </Button.LikeLink>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        {state.type === 'InstitutionState' &&
        typeof institution === 'object' ? (
          <SecurityInsitution
            institution={institution}
            collections={availableCollections}
            users={users}
            libraryRoles={libraryRoles}
            onChangeLibraryRoles={(newState): void =>
              setLibraryRoles(
                typeof newState === 'function'
                  ? newState(defined(libraryRoles))
                  : newState
              )
            }
            onOpenUser={(userId): void =>
              setState({
                type: 'UserState',
                user:
                  typeof userId === 'number'
                    ? defined(users)[userId]
                    : addMissingFields('SpecifyUser', {}),
                initialCollection: availableCollections[0].id,
              })
            }
          />
        ) : undefined}
        {state.type === 'CollectionState' && (
          <SetPermissionContext collectionId={state.collectionId}>
            <SecurityCollection
              collection={defined(
                availableCollections.find(({ id }) => id === state.collectionId)
              )}
              collections={availableCollections}
              initialRoleId={state.initialRole}
              libraryRoles={libraryRoles}
              onOpenUser={(userId): void =>
                setState({
                  type: 'UserState',
                  user:
                    typeof userId === 'number'
                      ? defined(users)[userId]
                      : addMissingFields('SpecifyUser', {}),
                  initialCollection: state.collectionId,
                })
              }
            />
          </SetPermissionContext>
        )}
        {state.type === 'UserState' && typeof users === 'object' ? (
          <SecurityUser
            user={state.user}
            collections={availableCollections}
            initialCollection={state.initialCollection}
            onClose={(): void => setState({ type: 'MainState' })}
            onDelete={(): void => {
              setUsers(removeKey(users, state.user.id.toString()));
              setState({ type: 'MainState' });
            }}
            onSave={(changedUser, newUser): void => {
              setUsers({
                ...users,
                [changedUser.id.toString()]: changedUser,
              });
              if (typeof newUser === 'object')
                setState({
                  type: 'UserState',
                  initialCollection: state.initialCollection,
                  user: newUser,
                });
            }}
            onOpenRole={(collectionId, roleId): void =>
              setState({
                type: 'CollectionState',
                collectionId,
                initialRole: roleId,
              })
            }
          />
        ) : undefined}
      </div>
    </Container.FullGray>
  );
}

export const userTool: UserTool = {
  task: 'security',
  title: adminText('securityPanel'),
  isOverlay: true,
  view: '/specify/security/',
  groupLabel: commonText('administration'),
};
