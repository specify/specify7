import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { softError } from '../Errors/assert';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { TableIcon } from '../Molecules/TableIcon';

export function SelectRecordSets<SCHEMA extends AnySchema>({
  table,
  handleParentClose,
  onAdd: handleAdd,
}: {
  readonly table: SpecifyTable<SCHEMA>;
  readonly handleParentClose: () => void;
  readonly onAdd?:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
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

  const handleAddResource = (): void => {
    Promise.all(
      selectedRecordSets.map(async (recordSet) =>
        fetchCollection('RecordSetItem', {
          recordSet,
          domainFilter: false,
          limit: 2000,
        })
          .then(({ records }) => records.map((record) => record.recordId))
          .catch((error) => {
            softError('Error fetching RecordSetItem:', error);
            return [];
          })
      )
    )
      .then((results) => results.flat())
      .then((recordIds) => {
        const newResources = recordIds.map((id) => new table.Resource({ id }));
        handleAdd?.(newResources);
        handleClose();
        handleParentClose();
      })
      .catch((error) => {
        softError('Unexpected error in handleAddResource:', error);
      });
  };

  const onSelected = (recordSetId: number): void => {
    setSelectedRecordSets((previousSelected) => {
      const isAlreadySelected = previousSelected.includes(recordSetId);
      return isAlreadySelected
        ? previousSelected.filter((item) => item !== recordSetId)
        : [...previousSelected, recordSetId];
    });
  };

  return (
    <>
      <Button.Info onClick={handleOpen}>{commonText.recordSets()}</Button.Info>
      {isOpen && (
        <RecordSetSelection
          recordSets={recordSets?.records}
          selectedRecordSets={selectedRecordSets}
          onClose={handleClose}
          onProceed={handleAddResource}
          onValueChange={onSelected}
        />
      )}
    </>
  );
}

export function RecordSetSelection<T>({
  recordSets,
  onProceed: handleProceed,
  onClose: handleClose,
  selectedRecordSets,
  selectedTable,
  onValueChange: handleValueChange,
  isMerge,
}: {
  readonly recordSets: RA<SerializedResource<RecordSet>> | undefined;
  readonly onProceed: () => void;
  readonly onClose: () => void;
  readonly selectedRecordSets: RA<number>;
  readonly selectedTable?: number | null;
  readonly onValueChange: (recordSet: T) => void;
  readonly isMerge?: boolean;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Info onClick={handleProceed}>
            {isMerge === true ? treeText.merge() : commonText.add()}
          </Button.Info>
        </>
      }
      header={isMerge === true ? treeText.merge() : commonText.add()}
      onClose={handleClose}
    >
      <Ul>
        {recordSets === undefined && <LoadingScreen />}
        {recordSets?.map((recordSet) => (
          <li key={recordSet.id}>
            <Label.Inline>
              <Input.Checkbox
                checked={selectedRecordSets.includes(recordSet.id)}
                disabled={
                  selectedTable !== null &&
                  recordSet.dbTableId !== selectedTable &&
                  isMerge === true
                }
                onValueChange={(): void =>
                  handleValueChange(
                    (isMerge === true ? recordSet : recordSet.id) as T
                  )
                }
              />
              <TableIcon label name={getTableById(recordSet.dbTableId).name} />
              {recordSet.name}
            </Label.Inline>
          </li>
        ))}
      </Ul>
    </Dialog>
  );
}
