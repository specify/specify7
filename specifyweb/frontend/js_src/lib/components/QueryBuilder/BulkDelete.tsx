import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { ping } from '../../utils/ajax/ping';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { Dialog } from '../Molecules/Dialog';

export function QueryBulkDelete({
  table,
  onDeleted,
  recordIds,
}: {
  readonly table: SpecifyTable;
  readonly onDeleted: () => void;
  readonly recordIds: () => RA<number>;
}): JSX.Element {
  const [isShowingWarning, showWarning, hideWarning, _] =
    useBooleanState(false);

  return (
    <>
      <Button.Small
        disabled={totalCount === undefined || totalCount === 0}
        onClick={showWarning}
      >
        {queryText.bulkDelete()}
      </Button.Small>
      {isShowingWarning ? (
        <BulkDeletionDialog
          recordIds={recordIds}
          table={table}
          onClose={(): void => {
            hideWarning();
          }}
          onDeleted={onDeleted}
        />
      ) : undefined}
    </>
  );
}

export function BulkDeletionDialog({
  table,
  onDeleted,
  recordIds,
  onClose,
}: {
  readonly table: SpecifyTable;
  readonly onDeleted: () => void;
  readonly recordIds: () => RA<number>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);

  const [recordIdList, setRecordIdList] = React.useState<RA<number>>([]);
  React.useEffect(() => {
    setRecordIdList(recordIds());
  }, [recordIds]);

  const handleClick = (): void => {
    onClose();
    loading(
      ping(`/bulk_copy/bulk_delete/${table.name}/`, {
        headers: { Accept: 'text/plain' },
        method: 'POST',
        body: JSON.stringify({
          ids: recordIds(),
        }),
      })
        .then(onDeleted)
        .catch((error) => {
          console.error(error);
        })
    );
  };

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Danger onClick={handleClick}>
            {commonText.delete()}
          </Button.Danger>
        </>
      }
      header={formsText.bulkDeleteConfirmation({
        count: recordIdList.length,
        tableName: table.name,
      })}
      onClose={onClose}
    >
      <div className="mb-4 flex flex-col gap-4">
        <section>{formsText.deleteConfirmationDescription()}</section>
      </div>
    </Dialog>
  );
}
