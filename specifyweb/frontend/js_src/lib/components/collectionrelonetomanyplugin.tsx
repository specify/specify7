import React from 'react';
import type { State } from 'typesafe-reducer';

import type {
  Collection,
  CollectionObject,
  CollectionRelationship,
} from '../datamodel';
import { format } from '../dataobjformatters';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
// TODO: elimitate this type of imports
import * as navigation from '../navigation';
import { schema } from '../schema';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { f } from '../wbplanviewhelper';
import { Button, className, Link } from './basic';
import { useAsyncState } from './hooks';
import { Dialog } from './modaldialog';
import { QueryComboBoxSearch } from './querycbxsearch';
import { removeItem } from './wbplanviewstate';

type Data = {
  readonly collectionObjects: RA<{
    readonly formatted: string;
    readonly resource: SpecifyResource<CollectionObject>;
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
  resources: RA<SpecifyResource<CollectionRelationship>>,
  otherSide: 'left' | 'right'
): Promise<Data['collectionObjects']> =>
  Promise.all(
    resources.map(async (resource) =>
      resource.rgetPromise(`${otherSide}Side`, true)
    )
  ).then(async (resources) =>
    Promise.all(
      resources.map(async (collectionObject) => ({
        formatted: await format(collectionObject).then(
          (formatted) => formatted ?? collectionObject.id.toString()
        ),
        resource: collectionObject,
      }))
    )
  );

export async function fetchOtherCollectionData(
  resource: SpecifyResource<CollectionObject>,
  relationship: string
): Promise<Data> {
  const collection = new schema.models.CollectionRelType.LazyCollection({
    filters: { name: relationship },
  });
  const { relationshipType, left, right } = await collection
    .fetchPromise({ limit: 1 })
    .then(async ({ models: [relationshipType] }) =>
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

  const items = new schema.models.CollectionRelationship.LazyCollection({
    filters:
      side == 'left'
        ? {
            leftside_id: resource.id,
            collectionreltype_id: relationshipType.id,
          }
        : {
            rightside_id: resource.id,
            collectionreltype_id: relationshipType.id,
          },
  });
  return {
    collectionObjects: await items
      .fetchPromise()
      .then(async ({ models }) => processRelationships(models, otherSide)),
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
    )
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

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>{formsText('collectionObject')}</th>
            <th>{commonText('collection')}</th>
            <td />
          </tr>
        </thead>
        <tbody>
          {typeof data === 'object' ? (
            data.collectionObjects.map(
              ({ formatted, resource: relatedResource }, index) => (
                <tr key={relatedResource.cid}>
                  <td>
                    <Link.Default
                      href={relatedResource.viewUrl()}
                      className={className.navigationHandled}
                      onClick={(event): void => {
                        event.preventDefault();
                        const collectionsIds =
                          userInformation.available_collections.map(
                            ([id]) => id
                          );
                        if (collectionsIds.includes(data.otherCollection.id))
                          navigation.switchCollection(
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
                  <td>
                    <Button.Icon
                      title={commonText('remove')}
                      aria-label={commonText('remove')}
                      icon="trash"
                      onClick={(): void => {
                        if (typeof data === 'undefined') return;
                        resource.dependentResources[
                          `${data.side}siderels`
                        ]?.remove(relatedResource);
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
      <Button.Icon
        title={commonText('add')}
        aria-label={commonText('add')}
        icon="plus"
        aria-pressed={state.type === 'SearchState'}
        onClick={(): void =>
          setState(
            state.type === 'SearchState'
              ? { type: 'MainState' }
              : {
                  type: 'SearchState',
                  templateResource: new schema.models.CollectionObject.Resource(
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
      {state.type === 'DeniedAccessState' && (
        <Dialog
          title={commonText('collectionAccessDeniedDialogTitle')}
          header={commonText('collectionAccessDeniedDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
          buttons={commonText('close')}
        >
          {commonText('collectionAccessDeniedDialogMessage')(
            state.collectionName
          )}
        </Dialog>
      )}
      {state.type === 'SearchState' && typeof data === 'object' && (
        <QueryComboBoxSearch
          forceCollection={data.otherCollection.id}
          extraFilters={undefined}
          templateResource={state.templateResource}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={async (addedResource): Promise<void> => {
            const toAdd = new schema.models.CollectionRelationship.Resource();
            toAdd.set(`${data.otherSide}Side`, addedResource);
            toAdd.set(`${data.side}Side`, resource);
            toAdd.set('collectionRelType', relationship);
            resource.dependentResources[`${data.side}siderels`]?.add(toAdd);
            setData({
              ...data,
              collectionObjects: [
                ...data.collectionObjects,
                ...(await processRelationships([toAdd], data.otherSide)),
              ],
            });
          }}
        />
      )}
    </>
  );
}
