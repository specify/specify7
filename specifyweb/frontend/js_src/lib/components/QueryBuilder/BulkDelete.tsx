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
  totalCount,
  onDeleted,
  recordIds,
}: {
  readonly table: SpecifyTable;
  readonly totalCount: number;
  readonly onDeleted: (recordIds: RA<number>) => void;
  readonly recordIds: () => RA<number>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose, _] =
    useBooleanState(false);

  return (
    <>
      <Button.Small
        disabled={totalCount === 0}
        onClick={handleOpen}
      >
        {queryText.bulkDelete()}
      </Button.Small>
      {isOpen ? (
        <BulkDeletionDialog
          recordIds={recordIds}
          table={table}
          onClose={(): void => {
            handleClose();
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
  readonly onDeleted: (recordIds: RA<number>) => void;
  readonly recordIds: () => RA<number>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);

  const [recordIdList, setRecordIdList] = React.useState<RA<number>>([]);
  React.useEffect(() => {
    setRecordIdList(recordIds());
  }, [recordIds]);

  const [isWarningOpen, openWarning, closeWarning, _] =
    useBooleanState(false);

  const handleClick = (): void => {
    closeWarning();
    onClose();
    loading(
      ping(`/bulk_copy/bulk_delete/${table.name}/`, {
        headers: { Accept: 'text/plain' },
        method: 'POST',
        body: JSON.stringify({
          ids: recordIds(),
        }),
      })
        .then(() => onDeleted(recordIdList))
        .catch((error) => {
          console.error(error);
        })
    );
  };

  return (
    <>
      <Dialog
        buttons={
          <>
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            <Button.Danger onClick={openWarning}>
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
      {
        isWarningOpen ?
        (
          <Dialog
            buttons={
              <>
                <Button.DialogClose>{commonText.close()}</Button.DialogClose>
                <Button.Danger onClick={handleClick}>
                  {formsText.bulkDeleteFinalConfirmationOption({ count: recordIdList.length })}
                </Button.Danger>
              </>
            }
            header={formsText.bulkDeleteFinalConfirmation()}
            onClose={onClose}
          >
            <div className="mb-4 flex flex-col gap-4">
              <section>{formsText.deleteConfirmationDescription()}</section>
            </div>
          </Dialog>
        )
        : undefined
      }
    </>
  );
}
