import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { sortFunction, toLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { serializeResource } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { toLargeSortConfig } from '../Molecules/Sorting';
import { userPreferences } from '../Preferences/userPreferences';

export function ChooseCollection(): JSX.Element {
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
            collection[toLowerCase(fieldNames.join('.') as 'description')],
          direction === 'desc'
        )
      )
      .map(serializeResource);
  }, [sortOrder]);

  const handleClose = React.useContext(OverlayContext);
  const navigate = useNavigate();
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.cancel()}</Button.DialogClose>}
      header={commonText.chooseCollection()}
      onClose={handleClose}
    >
      <Select
        aria-label={headerText.currentCollection({
          collectionTable: schema.models.Collection.label,
        })}
        className="col-span-2 flex-1"
        title={headerText.currentCollection({
          collectionTable: schema.models.Collection.label,
        })}
        value={schema.domainLevelIds.collection}
        onValueChange={(value): void =>
          switchCollection(navigate, Number.parseInt(value), '/specify/')
        }
      >
        {sortedCollections?.map(({ id, collectionName }) => (
          <option key={id as number} value={id as number}>
            {collectionName}
          </option>
        ))}
      </Select>
    </Dialog>
  );
}
