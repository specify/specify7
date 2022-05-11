import React from 'react';
import type { State } from 'typesafe-reducer';

import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import type {
  Collection,
  CollectionObject,
  CollectionRelationship,
  CollectionRelType,
} from '../datamodel';
import { format } from '../dataobjformatters';
import { f } from '../functools';
import { removeItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { hasTablePermission } from '../permissions';
import { schema } from '../schema';
import { switchCollection } from '../specifyapp';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, DataEntry, Link } from './basic';
import { useAsyncState } from './hooks';
import { Dialog } from './modaldialog';
import { deserializeResource } from './resource';
import { SearchDialog } from './searchdialog';
import { LoadingContext } from './contexts';

type Data = {
  readonly relationshipType: SpecifyResource<CollectionRelType>;
  readonly collectionObjects: RA<{
    readonly formatted: string;
    readonly resource: SpecifyResource<CollectionObject>;
    readonly relationship: SpecifyResource<CollectionRelationship>;
  }>;
  readonly otherCollection: {
    readonly id: number;
    readonly href: string;
    readonly name: string;
    readonly formatted: string;
  };
  readonly side: 'left' | 'right';
  readonly otherSide: 'left' | 'right';
};

const processRelationships = async (
  relationships: RA<SpecifyResource<CollectionRelationship>>,
  otherSide: 'left' | 'right'
): Promise<Data['collectionObjects']> =>
  Promise.all(
    relationships.map(async (relationship) =>
      relationship
        .rgetPromise(`${otherSide}Side`)
        .then((collectionObject) => [relationship, collectionObject] as const)
    )
  ).then(async (resources) =>
    Promise.all(
      resources.map(async ([relationship, collectionObject]) => ({
        formatted: await format(collectionObject).then(
          (formatted) => formatted ?? collectionObject.id.toString()
        ),
        resource: collectionObject,
        relationship,
      }))
    )
  );

export async function fetchOtherCollectionData(
  resource: SpecifyResource<CollectionObject>,
  relationship: string
): Promise<Data> {
  const { relationshipType, left, right } = await fetchCollection(
    'CollectionRelType',
    { name: relationship, limit: 1 }
  )
    .then(({ records }) => deserializeResource(records[0]))
    .then(async (relationshipType) =>
      f.all({
        relationshipType,
        left: relationshipType.rgetPromise('leftSideCollection'),
        right: relationshipType.rgetPromise('rightSideCollection'),
      })
    );
  let side: 'left' | 'right';
  let otherSide: 'left' | 'right';
  let relatedCollection: SpecifyResource<Collection> | null;
  if (schema.domainLevelIds.collection === left?.id) {
    side = 'left';
    otherSide = 'right';
    relatedCollection = right;
  } else if (schema.domainLevelIds.collection === right?.id) {
    side = 'right';
    otherSide = 'left';
    relatedCollection = left;
  } else
    throw new Error(
      "Related collection plugin used with relation that doesn't match current collection"
    );
  if (relatedCollection === null)
    throw new Error('Unable to determine collection for the other side');

  const otherCollection = relatedCollection;
  const formattedCollection = format(otherCollection);

  return {
    relationshipType,
    collectionObjects:
      typeof resource.id === 'number'
        ? await fetchCollection(
            'CollectionRelationship',
            { limit: DEFAULT_FETCH_LIMIT },
            side == 'left'
              ? {
                  leftside_id: resource.id,
                  collectionreltype_id: relationshipType.id,
                }
              : {
                  rightside_id: resource.id,
                  collectionreltype_id: relationshipType.id,
                }
          ).then(async ({ records }) =>
            processRelationships(records.map(deserializeResource), otherSide)
          )
        : [],
    otherCollection: {
      id: otherCollection.id,
      href: otherCollection.viewUrl(),
      name: otherCollection.get('collectionName') ?? '',
      formatted: await formattedCollection.then(
        (formatted) => formatted ?? otherCollection.id.toString()
      ),
    },
    side,
    otherSide,
  };
}

export function CollectionOneToManyPlugin({
  resource,
  relationship,
}: {
  readonly resource: SpecifyResource<CollectionObject>;
  readonly relationship: string;
}): JSX.Element {
  const [data, setData] = useAsyncState<Data>(
    React.useCallback(
      async () => fetchOtherCollectionData(resource, relationship),
      [resource, relationship]
    ),
    false
  );

  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<
        'DeniedAccessState',
        {
          collectionName: string;
        }
      >
    | State<
        'SearchState',
        {
          templateResource: SpecifyResource<CollectionObject>;
        }
      >
  >({ type: 'MainState' });

  const loading = React.useContext(LoadingContext);
  return (
    <div className="bg-[color:var(--background)] rounded">
      <table>
        <thead>
          <tr>
            <th>{formsText('collectionObject')}</th>
            <th>{schema.models.Collection.label}</th>
            {hasTablePermission('CollectionRelationship', 'delete') && <td />}
          </tr>
        </thead>
        <tbody>
          {typeof data === 'object' ? (
            data.collectionObjects.map(
              (
                { formatted, resource: relatedResource, relationship },
                index
              ) => (
                <tr key={relatedResource.cid}>
                  <td>
                    <Link.Default
                      href={relatedResource.viewUrl()}
                      className={className.navigationHandled}
                      onClick={(event): void => {
                        event.preventDefault();
                        const collectionsIds =
                          userInformation.availableCollections.map(
                            ({ id }) => id
                          );
                        if (collectionsIds.includes(data.otherCollection.id))
                          switchCollection(
                            data.otherCollection.id,
                            relatedResource.viewUrl()
                          );
                        else
                          setState({
                            type: 'DeniedAccessState',
                            collectionName: data.otherCollection.name,
                          });
                      }}
                    >
                      {formatted}
                    </Link.Default>
                  </td>
                  <td>
                    <Link.Default href={data.otherCollection.href}>
                      {data.otherCollection.formatted}
                    </Link.Default>
                  </td>
                  {hasTablePermission('CollectionRelationship', 'delete') && (
                    <td>
                      <Button.Icon
                        title={commonText('remove')}
                        aria-label={commonText('remove')}
                        icon="trash"
                        onClick={(): void => {
                          if (typeof data === 'undefined') return;
                          resource
                            .getDependentResource(`${data.side}SideRels`)
                            ?.remove(relationship);
                          setData({
                            ...data,
                            collectionObjects: removeItem(
                              data.collectionObjects,
                              index
                            ),
                          });
                        }}
                      />
                    </td>
                  )}
                </tr>
              )
            )
          ) : (
            <tr>
              <td colSpan={2}>{commonText('loading')}</td>
            </tr>
          )}
        </tbody>
      </table>
      {hasTablePermission('CollectionRelationship', 'create') && (
        <DataEntry.Add
          aria-pressed={state.type === 'SearchState'}
          onClick={(): void =>
            setState(
              state.type === 'SearchState'
                ? { type: 'MainState' }
                : {
                    type: 'SearchState',
                    templateResource:
                      new schema.models.CollectionObject.Resource(
                        {},
                        {
                          noBusinessRules: true,
                          noValidation: true,
                        }
                      ),
                  }
            )
          }
        />
      )}
      {state.type === 'DeniedAccessState' && (
        <Dialog
          title={commonText('collectionAccessDeniedDialogTitle')}
          header={commonText('collectionAccessDeniedDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
          buttons={commonText('close')}
        >
          {commonText('collectionAccessDeniedDialogText', state.collectionName)}
        </Dialog>
      )}
      {state.type === 'SearchState' && typeof data === 'object' && (
        <SearchDialog
          forceCollection={data.otherCollection.id}
          extraFilters={undefined}
          templateResource={state.templateResource}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={(addedResource): void => {
            const toAdd = new schema.models.CollectionRelationship.Resource();
            toAdd.set(`${data.otherSide}Side`, addedResource);
            toAdd.set(`${data.side}Side`, resource);
            toAdd.set(
              'collectionRelType',
              data.relationshipType.get('resource_uri')
            );
            loading(
              resource
                .rgetCollection(`${data.side}SideRels`)
                .then((collection) => collection.add(toAdd))
                .then(() => processRelationships([toAdd], data.otherSide))
                .then((relationships) =>
                  setData({
                    ...data,
                    collectionObjects: [
                      ...data.collectionObjects,
                      ...relationships,
                    ],
                  })
                )
            );
          }}
        />
      )}
    </div>
  );
}
