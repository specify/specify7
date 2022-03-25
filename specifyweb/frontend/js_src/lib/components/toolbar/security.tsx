import React from 'react';
import type { State } from 'typesafe-reducer';

import type { SpecifyUser } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import adminText from '../../localization/admin';
import { router } from '../../router';
import { schema } from '../../schema';
import { setCurrentView } from '../../specifyapp';
import { f } from '../../wbplanviewhelper';
import { Button, className, Container, H2, H3 } from '../basic';
import { useAsyncState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import createBackboneView from '../reactbackboneextend';
import { CollectionView } from '../securitycollection';
import { InstitutionView } from '../securityinstitution';
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
              models.map((collection) => [collection.id, collection])
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
          readonly user: SerializedResource<SpecifyUser>;
        }
      >
  >({ type: 'MainState' });

  // TODO: write a routing library that would make navigation easier
  return typeof data === 'object' ? (
    <Container.Full>
      <H2 className="text-2xl">{adminText('securityPanel')}</H2>
      <div className="flex flex-1 gap-4 overflow-hidden">
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
            {/* Remove collections you don't have access to from the sidebar */}
            <H3>{adminText('collections')}</H3>
            <ul>
              {Object.values(data.collections).map((collection) => (
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
          <InstitutionView institution={data.institution} />
        )}
        {state.type === 'CollectionState' && (
          <CollectionView
            collection={data.collections[state.collectionId]}
            initialRole={state.initialRole}
            onOpenUser={(user): void =>
              setState({
                type: 'UserState',
                user,
                initialCollection: state.collectionId,
              })
            }
          />
        )}
        {state.type === 'UserState' && (
          <UserView
            user={state.user}
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
        )}
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
};

export default function Routes(): void {
  router.route('security/', 'security', () => setCurrentView(new View()));
}
