import React from 'react';

import type { Collection } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { commonText } from '../localization/common';
import { switchCollection } from '../specifyapp';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { Button, Container } from './basic';

/**
 * Asks user to switch collection to view a resource
 */
export function OtherCollection({
  collections: resourceCollections,
}: {
  collections: RA<SerializedResource<Collection>>;
}): JSX.Element {
  const accessibleCollections = new Set(
    userInformation.availableCollections.map(({ id }) => id)
  );
  const collections = resourceCollections.filter((collection) =>
    accessibleCollections.has(collection.id)
  );
  return (
    <Container.FullGray>
      <Container.Center>
        {collections.length === 0 ? (
          commonText('noAccessToResource')
        ) : (
          <>
            <p>{commonText('resourceInaccessible')}</p>
            {collections.length > 1 ? (
              <>
                <p>{commonText('selectCollection')}</p>
                <ul role="list">
                  {collections.map(({ id, collectionName }) => (
                    <li key={id}>
                      <Button.LikeLink
                        onClick={(): void =>
                          switchCollection(collections[0].id, undefined, () => {
                            /* Nothing */
                          })
                        }
                      >
                        {collectionName}
                      </Button.LikeLink>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p>{commonText('loginToProceed')}</p>
                <div>
                  <Button.Blue
                    onClick={(): void => switchCollection(collections[0].id)}
                  >
                    {collections[0].collectionName}
                  </Button.Blue>
                </div>
              </>
            )}
          </>
        )}
      </Container.Center>
    </Container.FullGray>
  );
}
