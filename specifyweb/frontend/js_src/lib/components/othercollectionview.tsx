import React from 'react';

import type { Collection } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { sortFunction } from '../helpers';
import { commonText } from '../localization/common';
import type { RA } from '../types';
import { filterArray } from '../types';
import { userInformation } from '../userinfo';
import { Button, Container, Ul } from './basic';
import { usePref } from './preferenceshooks';
import { useNavigate } from 'react-router-dom';
import { switchCollection } from './switchcollection';

/**
 * Even though available collections do not change during lifecycle of a page,
 * their sort order may
 */
export function useAvailableCollections(): RA<SerializedResource<Collection>> {
  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const isReverseSort = sortOrder.startsWith('-');
  const sortField = (isReverseSort ? sortOrder.slice(1) : sortOrder) as string &
    keyof Collection['fields'];
  return React.useMemo(
    () =>
      Array.from(userInformation.availableCollections).sort(
        sortFunction((collection) => collection[sortField], isReverseSort)
      ),
    [userInformation.availableCollections, isReverseSort, sortField]
  );
}

/**
 * Asks user to switch collection to view a resource
 */
export function OtherCollection({
  collectionIds,
}: {
  readonly collectionIds: RA<number>;
}): JSX.Element {
  const availableCollection = useAvailableCollections();
  const collections = filterArray(
    availableCollection.filter(({ id }) => collectionIds.includes(id))
  );
  const navigate = useNavigate();
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
                <Ul>
                  {collections.map(({ id, collectionName }) => (
                    <li key={id}>
                      <Button.LikeLink
                        onClick={(): void =>
                          switchCollection(navigate, collections[0].id)
                        }
                      >
                        {collectionName}
                      </Button.LikeLink>
                    </li>
                  ))}
                </Ul>
              </>
            ) : (
              <>
                <p>{commonText('loginToProceed')}</p>
                <div>
                  <Button.Blue
                    onClick={(): void =>
                      switchCollection(navigate, collections[0].id)
                    }
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
