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
      console.log('cannot merge record set that have different base table');
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

  const handleMerge = async (selectedRecordSets: RA<number>): Promise<void> => {
    /*
     * Add check to verify rs are the same table
     * create a new RS with all the records
     * delete all the RS that were selected
     */
    /*
     * Send to the backend RS ids and backend merges the records
     * need to filter the ids to not have duplicate
     *
     */
    if (selectedTable === null) return;

    const tableName = getTableById(selectedTable).name;

    await ajax(
      `/api/specify/${tableName.toLowerCase()}/replace/${
        selectedRecordSets[0]
      }/`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: {
          old_record_ids: selectedRecordSets,
          // New_record_data: merged.toJSON(),
        },
        expectedErrors: [Http.NOT_ALLOWED],
        errorMode: 'dismissible',
      }
    ).then(({ response }) => {
      if (!response.ok) return;
      handleClose();
    });
    console.log('merge');
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
                      recordSet._tableName !== selectedTable
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
