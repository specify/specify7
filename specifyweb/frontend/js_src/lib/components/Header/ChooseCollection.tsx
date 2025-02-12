import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { sortFunction, toLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { backboneFieldSeparator } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { toLargeSortConfig } from '../Molecules/Sorting';
import { userPreferences } from '../Preferences/userPreferences';
import { OverlayContext } from '../Router/Router';
import { switchCollection } from '../RouterCommands/SwitchCollection';

export function ChooseCollection(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const navigate = useNavigate();
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.cancel()}</Button.DialogClose>}
      header={commonText.chooseCollection()}
      icon={icons.archive}
      onClose={handleClose}
    >
      <CollectionPicker
        collectionId={[
          schema.domainLevelIds.collection,
          (id): void => switchCollection(navigate, id, '/specify/'),
        ]}
      />
    </Dialog>
  );
}

export function CollectionPicker({
  collectionId: [collectionId, setCollectionId],
  isReadOnly = false,
}: {
  readonly collectionId: readonly [
    number | undefined,
    (collectionId: number) => void,
  ];
  readonly isReadOnly?: boolean;
}): JSX.Element {
  const [sortOrder] = userPreferences.use(
    'chooseCollection',
    'general',
    'sortOrder'
  );
  const sortedCollections = React.useMemo(() => {
    const { direction, fieldNames } = toLargeSortConfig(sortOrder);
    return Array.from(userInformation.availableCollections)
      .sort(
        sortFunction(
          (collection) =>
            collection[
              toLowerCase(
                fieldNames.join(backboneFieldSeparator) as 'description'
              )
            ],
          direction === 'desc'
        )
      )
      .map(serializeResource);
  }, [sortOrder]);

  return (
    <Select
      aria-label={headerText.currentCollection({
        collectionTable: tables.Collection.label,
      })}
      className="col-span-2 flex-1"
      disabled={isReadOnly}
      required
      title={headerText.currentCollection({
        collectionTable: tables.Collection.label,
      })}
      value={collectionId ?? ''}
      onValueChange={(id): void => setCollectionId(Number.parseInt(id))}
    >
      {collectionId === undefined && <option value="" />}
      {sortedCollections?.map(({ id, collectionName }) => (
        <option key={id as number} value={id as number}>
          {collectionName}
        </option>
      ))}
    </Select>
  );
}
