import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { getTableById } from '../DataModel/tables';
import { softError } from '../Errors/assert';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { TableIcon } from '../Molecules/TableIcon';

export function SelectRecordSets<SCHEMA extends AnySchema>({
  table,
  collection,
  handleParentClose,
}: {
  readonly table: SpecifyTable<SCHEMA>;
  readonly collection: Collection<AnySchema> | undefined;
  readonly handleParentClose: () => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const [selectedRecordSets, setSelectedRecordSets] = React.useState<
    RA<number>
  >([]);

  const { limit, offset } = usePaginator('recordSets');

  const [recordSets] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('RecordSet', {
          specifyUser: userInformation.id,
          type: 0,
          limit,
          domainFilter: true,
          offset,
          dbTableId: table?.tableId,
          collectionMemberId: schema.domainLevelIds.collection,
        }),
      [table, limit, offset]
    ),
    false
  );

  const handleAdd = async () => {
    const recordIds = await Promise.all(
      selectedRecordSets.map(async (recordSet) =>
        fetchCollection('RecordSetItem', {
          recordSet,
          domainFilter: false,
        })
          .then(({ records }) => records.map((record) => record.recordId))
          .catch((error) => {
            softError('Error fetching RecordSetItem:', error);
            return [];
          })
      )
    ).then((results) => results.flat());

    const newResources = recordIds.map((id) => new table.Resource({ id }));
    collection?.add(newResources);
    handleClose();
    handleParentClose();
  };

  return (
    <>
      <Button.Info onClick={handleOpen}>{commonText.recordSets()}</Button.Info>
      {isOpen && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info
                disabled={recordSets?.records.length === 0}
                onClick={async () => handleAdd()}
              >
                {commonText.add()}
              </Button.Info>
            </>
          }
          header={commonText.add()}
          onClose={handleClose}
        >
          {recordSets === undefined && <LoadingScreen />}
          <Ul>
            {recordSets?.records.map((recordSet) => (
              <li key={recordSet.id}>
                <Label.Inline>
                  <Input.Checkbox
                    checked={selectedRecordSets.includes(recordSet.id)}
                    onValueChange={(): void =>
                      setSelectedRecordSets((previousSelected) => {
                        const isAlreadySelected = previousSelected.includes(
                          recordSet.id
                        );
                        return isAlreadySelected
                          ? previousSelected.filter(
                              (item) => item !== recordSet.id
                            )
                          : [...previousSelected, recordSet.id];
                      })
                    }
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
