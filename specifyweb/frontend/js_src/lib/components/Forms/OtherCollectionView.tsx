import React from 'react';

import type { Collection } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { sortFunction } from '../../utils/utils';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { Container, Ul } from '../Atoms';
import { usePref } from '../UserPreferences/Hooks';
import { useNavigate } from 'react-router-dom';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { useErrorContext } from '../../hooks/useErrorContext';
import { Button } from '../Atoms/Button';

/**
 * Even though available collections do not change during lifecycle of a page,
 * their sort order may
 */
export function useAvailableCollections(): RA<SerializedResource<Collection>> {
  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const isReverseSort = sortOrder.startsWith('-');
  const sortField = (isReverseSort ? sortOrder.slice(1) : sortOrder) as string &
    keyof Collection['fields'];
  const collections = React.useMemo(
    () =>
      Array.from(userInformation.availableCollections).sort(
        sortFunction((collection) => collection[sortField], isReverseSort)
      ),
    [userInformation.availableCollections, isReverseSort, sortField]
  );
  useErrorContext('collections', collections);
  return collections;
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
