import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useErrorContext } from '../../hooks/useErrorContext';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Container, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
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
      // FEATURE: support sorting by related model
      sortFunction(
        (collection) =>
          collection[fieldNames.join('.') as keyof Collection['fields']],
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
            collectionTable: schema.models.Collection.label,
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
                <p>
                  {userText.loginToProceed({
                    collectionTable: schema.models.Collection.label,
                  })}
                </p>
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
