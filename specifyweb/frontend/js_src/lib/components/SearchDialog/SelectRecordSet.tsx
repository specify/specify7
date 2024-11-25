import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById, tables } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { TableIcon } from '../Molecules/TableIcon';

export function SelectRecordSets<SCHEMA extends AnySchema>({
  table,
}: {
  readonly table: SpecifyTable<SCHEMA>;
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

  const handleAdd = () => {
    const recordSetId = selectedRecordSets[0];

    fetchCollection('RecordSetItem', {
      recordSet: recordSetId,
      limit: 1,
      domainFilter: false,
    })
      .then(({ records }) => {
        console.log('RecordSetItem:', records);
      })
      .catch((error) => {
        console.error('Error fetching RecordSetItem:', error);
      });
  };

  return (
    <>
      <Button.Info onClick={handleOpen}>{commonText.recordSets()}</Button.Info>
      {isOpen && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info onClick={async () => handleAdd()}>
                {commonText.add()}
              </Button.Info>
            </>
          }
          header={commonText.add()}
          onClose={handleClose}
        >
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
