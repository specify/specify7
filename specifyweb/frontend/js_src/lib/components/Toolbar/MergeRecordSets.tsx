import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { RecordSet } from '../DataModel/types';
import { softError } from '../Errors/assert';
import { RecordSetSelection } from '../SearchDialog/SelectRecordSet';

export function MergeRecordSets({
  recordSets,
}: {
  readonly recordSets: RA<SerializedResource<RecordSet>> | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const [selectedRecordSets, setSelectedRecordSets] = React.useState<
    RA<number>
  >([]);

  const [selectedTable, setSelectedTable] = React.useState<number | null>(null);

  const onSelected = (recordSet: SerializedResource<RecordSet>): void => {
    const { id, dbTableId } = recordSet;

    if (selectedTable !== null && selectedTable !== dbTableId) {
      softError('Cannot merge record set that have different base table');
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
        <RecordSetSelection
          isMerge
          recordSets={recordSets}
          selectedRecordSets={selectedRecordSets}
          selectedTable={selectedTable}
          onClose={handleClose}
          onProceed={handleMerge}
          onValueChange={onSelected}
        />
      )}
    </>
  );
}
