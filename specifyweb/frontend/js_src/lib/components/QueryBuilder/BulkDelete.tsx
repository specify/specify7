import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpQuery } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';

export function QueryBulkDelete({
  table,
  totalCount,
  onDeleted,
  recordIds,
  queryResource,
}: {
  readonly table: SpecifyTable;
  readonly totalCount: number;
  readonly onDeleted: (recordIds: RA<number>) => void;
  readonly recordIds: () => RA<number>;
  readonly queryResource: SpecifyResource<SpQuery> | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  return (
    <>
      <Button.Small
        disabled={totalCount === 0 || queryResource === undefined}
        onClick={handleOpen}
      >
        {queryText.bulkDelete()}
      </Button.Small>
      {isOpen && (
        <BulkDeletionDialog
          recordIds={recordIds}
          table={table}
          onClose={handleClose}
          onDeleted={onDeleted}
          queryResource={queryResource}
          totalCount={totalCount}
        />
      )}
    </>
  );
}

export function BulkDeletionDialog({
  table,
  onDeleted,
  recordIds,
  onClose,
  queryResource,
  totalCount,
}: {
  readonly table: SpecifyTable;
  readonly onDeleted: (recordIds: RA<number>) => void;
  readonly recordIds: () => RA<number>;
  readonly onClose: () => void;
  readonly queryResource: SpecifyResource<SpQuery> | undefined;
  readonly totalCount: number;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const recordIdsRef = React.useRef(recordIds);
  recordIdsRef.current = recordIds;

  const ids = recordIds();
  const deleteCount = ids.length === 0 ? totalCount : ids.length;

  const [isWarningOpen, openWarning, closeWarning] = useBooleanState();
  const [confirmationText, setConfirmationText] = React.useState('');

  const handleConfirm = (): void => {
    closeWarning();
    onClose();
    loading(
      ajax<{ readonly task_id: string }>(
        `/bulk_copy/bulk_delete/${table.name}/`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: JSON.stringify({
            ids: recordIdsRef.current(),
            query: queryResource?.toJSON(),
          }),
        }
      )
        .then(({ data }) => {
          // The worker will notify the user via notifications when done.
          // Still call onDeleted so the local query-results UI is updated.
          onDeleted(recordIdsRef.current());
          return data.task_id;
        })
        .catch(console.error)
    );
  };

  return (
    <>
      <Dialog
        buttons={
          <>
            <Button.Danger disabled={deleteCount === 0} onClick={openWarning}>
              {commonText.delete()}
            </Button.Danger>
            <span className="-ml-2 flex-1" />
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          </>
        }
        header={formsText.bulkDeleteConfirmation({
          count: deleteCount,
          tableName: table.label,
        })}
        onClose={onClose}
      >
        {formsText.deleteConfirmationDescription()}
      </Dialog>
      {isWarningOpen && (
        <Dialog
          buttons={
            <>
              <Button.Danger
                disabled={confirmationText !== deleteCount.toString()}
                onClick={handleConfirm}
              >
                {formsText.bulkDeleteFinalConfirmationOption({
                  count: deleteCount,
                })}
              </Button.Danger>
              <span className="-ml-2 flex-1" />
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            </>
          }
          header={formsText.bulkDeleteFinalConfirmation()}
          onClose={closeWarning}
        >
          <div className="flex flex-col gap-4">
            {formsText.bulkDeleteFinalConfirmationDescription()}
            <Input.Text
              value={confirmationText}
              onValueChange={setConfirmationText}
            />
          </div>
        </Dialog>
      )}
    </>
  );
}