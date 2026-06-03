import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { ping } from '../../utils/ajax/ping';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
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
  const [isOpen, handleOpen, handleClose, _] =
    useBooleanState(false);

  return (
    <>
      <Button.Small
        disabled={totalCount === 0 || queryResource === undefined}
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
          queryResource={queryResource}
          totalCount={totalCount}
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
  queryResource,
  totalCount,
}: {
  readonly table: SpecifyTable;
  readonly onDeleted: (recordIds: RA<number>) => void;
  readonly recordIds: () => RA<number>;
  readonly onClose: () => void;
  readonly queryResource: SpecifyResource<SpQuery> | undefined;
  readonly totalCount: number;
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);

  const [totalDeleteCount, setTotalDeleteCount] = React.useState<number>(0);
  const [recordIdList, setRecordIdList] = React.useState<RA<number>>([]);
  React.useEffect(() => {
    const recordIdsResult = recordIds();
    setRecordIdList(recordIdsResult);
    console.log(queryResource?.toJSON());
    // If there are no selected ids, delete the entirety of the query's results
    const recordIdCount = recordIdsResult.length;
    if (recordIdCount === 0) {
      setTotalDeleteCount(totalCount);
    } else {
      setTotalDeleteCount(recordIdCount);
    }
  }, [recordIds, totalCount, queryResource]);

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
          query: queryResource?.toJSON(),
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
            <Button.Danger
              disabled={totalDeleteCount === 0}
              onClick={openWarning}
            >
              {commonText.delete()}
            </Button.Danger>
          </>
        }
        header={formsText.bulkDeleteConfirmation({
          count: totalDeleteCount,
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
                  {formsText.bulkDeleteFinalConfirmationOption({ count: totalDeleteCount })}
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
