import React from 'react';

import type { Collection } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import commonText from '../localization/common';
import * as navigation from '../navigation';
import type { RA } from '../types';
import { defined } from '../types';
import { userInformation } from '../userinfo';
import { Button } from './basic';
import createBackboneView from './reactbackboneextend';

export function OtherCollection({
  collections: resourceCollections,
}: {
  collections: RA<SerializedResource<Collection>>;
}): JSX.Element {
  const accessibleCollections = new Set(
    userInformation.available_collections.map((collection) => collection[0])
  );
  const collections = resourceCollections.filter((collection) =>
    accessibleCollections.has(collection.id)
  );
  return (
    <div role="alert">
      {collections.length === 0 ? (
        commonText('noAccessToResource')
      ) : (
        <>
          <p>{commonText('resourceInaccessible')}</p>
          {collections.length === 1 ? (
            <>
              <p>{commonText('selectCollection')}</p>
              <ul role="list">
                {collections.map(({ id, collectionName }) => (
                  <li key={id}>
                    <Button.LikeLink
                      onClick={(): void =>
                        navigation.switchCollection(collections[0].id)
                      }
                    >
                      {collectionName}
                    </Button.LikeLink>
                  </li>
                ))}
                <li>
                  <a>{commonText('collection')}</a>
                </li>
              </ul>
            </>
          ) : (
            <>
              <p>
                {commonText('loginToProceed')(
                  defined(collections[0].collectionName ?? undefined)
                )}
                <Button.LikeLink
                  onClick={(): void =>
                    navigation.switchCollection(collections[0].id)
                  }
                >
                  {commonText('open')}
                </Button.LikeLink>
                .
              </p>
              `);
            </>
          )}
        </>
      )}

      <p>${commonText('selectCollection')}</p>
      <ul role="list">
        <li>
          <a>${commonText('collection')}</a>
        </li>
      </ul>
    </div>
  );
}

export const OtherCollectionView = createBackboneView(OtherCollection);
