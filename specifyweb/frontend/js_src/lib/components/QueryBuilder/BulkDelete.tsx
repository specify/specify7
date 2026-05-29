import React from 'react';

import { ajax } from '../../utils/ajax';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { Button } from '../Atoms/Button';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { ping } from '../../utils/ajax/ping';
import { Http } from '../../utils/ajax/definitions';
import { Dialog } from '../Molecules/Dialog';
import { useBooleanState } from '../../hooks/useBooleanState';
import { LoadingContext } from '../Core/Contexts';

export function QueryBulkDelete({
  table,
  totalCount,
  onDeleted,
  recordIds,
}: {
  readonly table: SpecifyTable;
  readonly totalCount: number;
  readonly onDeleted: () => void;
  readonly recordIds: any;
}): JSX.Element {
  const [isShowingWarning, showWarning, hideWarning, _] = useBooleanState(false);

  return (
    <>
      <Button.Small
      disabled={totalCount === undefined || totalCount === 0}
      onClick={showWarning}
      >
      {queryText.bulkDelete()}
      </Button.Small>
      {isShowingWarning ? 
        <BulkDeletionDialog
          table={table}
          totalCount={totalCount}
          onDeleted={onDeleted}
          recordIds={recordIds}
          onClose={(): void => {
            hideWarning();
          }}
        />
      : undefined}
    </>
  );
}

export function BulkDeletionDialog({
  table,
  totalCount,
  onDeleted,
  recordIds,
  onClose,
}: {
  readonly table: SpecifyTable;
  readonly totalCount: number;
  readonly onDeleted: () => void;
  readonly recordIds: any;
  readonly onClose: () => void;
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);

  const handleClick = (): void => {
    loading(
      ping(`/bulk_copy/bulk_delete/${table.name}/`, {
        headers: { Accept: 'text/plain' },
        method: 'POST',
        body: JSON.stringify({
          ids: recordIds(),
        }),
        expectedErrors: [Http.NO_CONTENT],
      })
        .then(onDeleted)
        .catch((error) => {
          console.error(error);
        })
    );
  }

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info onClick={handleClick}>{queryText.yes()}</Button.Info>
        </>
      }
      header={commonText.delete()}
      onClose={onClose}
    >
      <div className="mb-4 flex flex-col gap-4">
        <section>{commonText.delete()}</section>
      </div>
    </Dialog>
  );
}