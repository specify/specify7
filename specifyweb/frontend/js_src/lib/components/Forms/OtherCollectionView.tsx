import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useErrorContext } from '../../hooks/useErrorContext';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Container, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { backboneFieldSeparator } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { tables } from '../DataModel/tables';
import type { Collection } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { toLargeSortConfig } from '../Molecules/Sorting';
import { userPreferences } from '../Preferences/userPreferences';
import { switchCollection } from '../RouterCommands/SwitchCollection';

/**
 * Even though available collections do not change during lifecycle of a page,
 * their sort order may
 */
export function useAvailableCollections(): RA<SerializedResource<Collection>> {
  const [sortOrder] = userPreferences.use(
    'chooseCollection',
    'general',
    'sortOrder'
  );
  const collections = React.useMemo(() => {
    const { direction, fieldNames } = toLargeSortConfig(sortOrder);
    return Array.from(userInformation.availableCollections).sort(
      // FEATURE: support sorting by related table
      sortFunction(
        (collection) =>
          collection[
            fieldNames.join(
              backboneFieldSeparator
            ) as keyof Collection['fields']
          ],
        direction === 'desc'
      )
    );
  }, [sortOrder]);
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
          userText.noAccessToResource({
            collectionTable: tables.Collection.label,
          })
        ) : (
          <>
            <p>{userText.resourceInaccessible()}</p>
            {collections.length > 1 ? (
              <>
                <p>{userText.selectCollection()}</p>
                <Ul className="flex gap-2">
                  {collections.map(({ id, collectionName }) => (
                    <li key={id}>
                      <Button.Info
                        onClick={(): void =>
                          switchCollection(navigate, collections[0].id)
                        }
                      >
                        {localized(collectionName ?? '')}
                      </Button.Info>
                    </li>
                  ))}
                </Ul>
              </>
            ) : (
              <>
                <p>
                  {userText.loginToProceed({
                    collectionTable: tables.Collection.label,
                  })}
                </p>
                <div>
                  <Button.Info
                    onClick={(): void =>
                      switchCollection(navigate, collections[0].id)
                    }
                  >
                    {localized(collections[0].collectionName ?? '')}
                  </Button.Info>
                </div>
              </>
            )}
          </>
        )}
      </Container.Center>
    </Container.FullGray>
  );
}
