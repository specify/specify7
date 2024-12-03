import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getTableById } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';

export function MergeRecordSets({
  recordSets,
}: {
  readonly recordSets: RA<SerializedResource<RecordSet>> | undefined;
}): JSX.Element {
  // Think of having the checkbox in the recordsSets view rather then creating a new dialog
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const [selectedRecordSets, setSelectedRecordSets] = React.useState<
    RA<number>
  >([]);

  const [selectedTable, setSelectedTable] = React.useState<number | null>(null);

  const onSelected = (recordSet: SerializedResource<RecordSet>): void => {
    const { id, dbTableId } = recordSet;

    if (selectedTable !== null && selectedTable !== dbTableId) {
      // How do we want to signal this to the user?
      console.log('Cannot merge record set that have different base table');
      return;
    }

    setSelectedRecordSets((previousSelected) => {
      const isAlreadySelected = previousSelected.includes(id);
      const updatedSelected = isAlreadySelected
        ? previousSelected.filter((item) => item !== id)
        : [...previousSelected, id];

      if (updatedSelected.length === 0) {
        setSelectedTable(null);
      } else if (!isAlreadySelected) {
        setSelectedTable(dbTableId);
      }

      return updatedSelected;
    });
  };
  const loading = React.useContext(LoadingContext);

  const handleMerge = (): void => {
    if (selectedTable === null) return;

    loading(
      ajax(`/stored_query/merge_recordsets/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: {
          recordsetids: selectedRecordSets,
        },
        expectedErrors: [Http.NOT_ALLOWED],
        errorMode: 'dismissible',
      }).then(({ response }) => {
        if (!response.ok) return;
        handleClose();
      })
    );
    globalThis.location.assign('/specify/overlay/record-sets/');
  };

  return (
    <>
      <Button.Info onClick={handleOpen}>{treeText.merge()}</Button.Info>
      {isOpen && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info onClick={handleMerge}>
                {treeText.merge()}
              </Button.Info>
            </>
          }
          header={treeText.merge()}
          onClose={handleClose}
        >
          <Ul>
            {recordSets?.map((recordSet) => (
              <li key={recordSet.id}>
                <Label.Inline>
                  <Input.Checkbox
                    checked={selectedRecordSets.includes(recordSet.id)}
                    disabled={
                      selectedTable !== null &&
                      recordSet.dbTableId !== selectedTable
                    }
                    onValueChange={(): void => onSelected(recordSet)}
                  />
                  <TableIcon
                    label
                    name={getTableById(recordSet.dbTableId).name}
                  />
                  {recordSet.name}
                </Label.Inline>
              </li>
            ))}
          </Ul>
        </Dialog>
      )}
    </>
  );
}
