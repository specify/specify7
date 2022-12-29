import React from 'react';

import type { Collection } from '../DataModel/types';
import { sortFunction } from '../../utils/utils';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { Container, Ul } from '../Atoms';
import { useNavigate } from 'react-router-dom';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { useErrorContext } from '../../hooks/useErrorContext';
import { Button } from '../Atoms/Button';
import { SerializedResource } from '../DataModel/helperTypes';
import { usePref } from '../UserPreferences/usePref';
import { toLargeSortConfig } from '../Molecules/Sorting';
import { userText } from '../../localization/user';
import { LocalizedString } from 'typesafe-i18n';

/**
 * Even though available collections do not change during lifecycle of a page,
 * their sort order may
 */
export function useAvailableCollections(): RA<SerializedResource<Collection>> {
  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const collections = React.useMemo(() => {
    const { direction, fieldNames } = toLargeSortConfig(sortOrder);
    return Array.from(userInformation.availableCollections).sort(
      // FEATURE: support sorting by related model
      sortFunction(
        (collection) =>
          collection[fieldNames.join('.') as keyof Collection['fields']],
        direction === 'desc'
      )
    );
  }, [userInformation.availableCollections, sortOrder]);
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
          userText.noAccessToResource()
        ) : (
          <>
            <p>{userText.resourceInaccessible()}</p>
            {collections.length > 1 ? (
              <>
                <p>{userText.selectCollection()}</p>
                <Ul className="flex gap-2">
                  {collections.map(({ id, collectionName }) => (
                    <li key={id}>
                      <Button.Blue
                        onClick={(): void =>
                          switchCollection(navigate, collections[0].id)
                        }
                      >
                        {collectionName as LocalizedString}
                      </Button.Blue>
                    </li>
                  ))}
                </Ul>
              </>
            ) : (
              <>
                <p>{userText.loginToProceed()}</p>
                <div>
                  <Button.Blue
                    onClick={(): void =>
                      switchCollection(navigate, collections[0].id)
                    }
                  >
                    {collections[0].collectionName as LocalizedString}
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
