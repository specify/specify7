import React from 'react';

import { commonText } from '../localization/common';
import { switchCollection } from '../specifyapp';
import type { RA } from '../types';
import { filterArray } from '../types';
import { userInformation } from '../userinfo';
import { Button, Container } from './basic';

/**
 * Asks user to switch collection to view a resource
 */
export function OtherCollection({
  collectionIds,
}: {
  collectionIds: RA<number>;
}): JSX.Element {
  const collections = filterArray(
    userInformation.availableCollections.filter(({ id }) =>
      collectionIds.includes(id)
    )
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
