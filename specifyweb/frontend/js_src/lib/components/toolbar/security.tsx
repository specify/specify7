import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax } from '../../ajax';
import { fetchCollection } from '../../collection';
import type { SpecifyUser } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import { f } from '../../functools';
import { index } from '../../helpers';
import adminText from '../../localization/admin';
import commonText from '../../localization/common';
import { hasPermission } from '../../permissions';
import { router } from '../../router';
import { schema } from '../../schema';
import type { BackEndRole } from '../../securityutils';
import { processPolicies } from '../../securityutils';
import { setCurrentView } from '../../specifyapp';
import type { IR, RA } from '../../types';
import { defined } from '../../types';
import { userInformation } from '../../userinfo';
import { Button, className, Container, H2, H3 } from '../basic';
import { useAsyncState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import createBackboneView from '../reactbackboneextend';
import { CollectionView } from '../securitycollection';
import { InstitutionView } from '../securityinstitution';
import type { Role } from '../securityrole';
import { UserView } from '../securityuser';

function SecurityPanel(): JSX.Element | null {
  useTitle(adminText('securityPanel'));

  const [data] = useAsyncState(
    React.useCallback(async () => {
      const institutionCollection =
        new schema.models.Institution.LazyCollection();
      const collectionsCollection =
        new schema.models.Collection.LazyCollection();
      return f.all({
        institution: institutionCollection
          .fetchPromise({ limit: 1 })
          .then(({ models }) => models[0]),
        collections: collectionsCollection
          .fetchPromise({ limit: 0 })
          .then(({ models }) =>
            Object.fromEntries(
              models
                .filter((collection) =>
                  Object.keys(userInformation.availableCollections).includes(
                    collection.id.toString()
                  )
                )
                .map((collection) => [collection.id, collection])
            )
          ),
      });
    }, []),
    true
  );

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
          readonly userId: number;
        }
      >
  >({ type: 'MainState' });

  const [users] = useAsyncState<IR<SerializedResource<SpecifyUser>>>(
    React.useCallback(
      async () =>
        fetchCollection('SpecifyUser', { limit: 0 })
          .then(async ({ records }) => records)
          .then(index),
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

  // TODO: write a routing library that would make navigation easier
  return typeof data === 'object' ? (
    <Container.Full>
      <H2 className="text-2xl">{adminText('securityPanel')}</H2>
      <div className="flex flex-1 h-0 gap-4">
        <aside className={`${className.containerBase} overflow-auto`}>
          <section>
            <H3>{adminText('institution')}</H3>
            <Button.LikeLink
              aria-pressed={state.type === 'InstitutionState'}
              onClick={(): void =>
                setState({
                  type: 'InstitutionState',
                })
              }
            >
              {data.institution.get('name')}
            </Button.LikeLink>
          </section>
          <section>
            <H3>{adminText('collections')}</H3>
            <ul>
              {Object.values(data.collections)
                .filter((collection) =>
                  // Only show collections you have access to
                  Object.keys(userInformation.availableCollections).some(
                    ([id]) => f.parseInt(id) === collection.id
                  )
                )
                .map((collection) => (
                  <li key={collection.cid}>
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
                      {collection.get('collectionName')}
                    </Button.LikeLink>
                  </li>
                ))}
            </ul>
          </section>
        </aside>
        {state.type === 'InstitutionState' && (
          <InstitutionView
            institution={data.institution}
            users={users}
            libraryRoles={libraryRoles}
            onChangeLibraryRoles={(newState) =>
              setLibraryRoles(
                typeof newState === 'function'
                  ? newState(defined(libraryRoles))
                  : newState
              )
            }
            onOpenUser={(userId): void =>
              setState({
                type: 'UserState',
                userId,
                initialCollection: Object.values(data.collections)[0].id,
              })
            }
          />
        )}
        {state.type === 'CollectionState' && (
          <CollectionView
            collection={data.collections[state.collectionId]}
            collections={data.collections}
            initialRoleId={state.initialRole}
            libraryRoles={libraryRoles}
            users={users}
            onOpenUser={(userId): void =>
              setState({
                type: 'UserState',
                userId,
                initialCollection: state.collectionId,
              })
            }
          />
        )}
        {state.type === 'UserState' && typeof users === 'object' ? (
          <UserView
            user={users[state.userId]}
            collections={data.collections}
            initialCollection={state.initialCollection}
            onClose={(): void => setState({ type: 'MainState' })}
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
    </Container.Full>
  ) : null;
}

const View = createBackboneView(SecurityPanel);

export const userTool: UserTool = {
  task: 'security',
  title: adminText('securityPanel'),
  isOverlay: true,
  view: '/specify/security/',
  groupLabel: commonText('administration'),
};

export default function Routes(): void {
  router.route('security/', 'security', () => setCurrentView(new View()));
}
