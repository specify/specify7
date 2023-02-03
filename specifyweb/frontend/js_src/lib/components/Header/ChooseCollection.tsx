import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { serializeResource } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import type { Collection } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { usePref } from '../UserPreferences/usePref';

export function ChooseCollection(): JSX.Element {
  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const isReverseSort = sortOrder.startsWith('-');
  const sortField = (isReverseSort ? sortOrder.slice(1) : sortOrder) as string &
    keyof Collection['fields'];
  const sortedCollections = React.useMemo(
    () =>
      Array.from(userInformation.availableCollections)
        .sort(
          sortFunction((collection) => collection[sortField], isReverseSort)
        )
        .map(serializeResource),
    [isReverseSort, sortField]
  );
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
