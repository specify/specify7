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
import { userText } from '../../localization/user';
import { LocalizedString } from 'typesafe-i18n';
import { userPreferences } from '../Preferences/userPreferences';

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
