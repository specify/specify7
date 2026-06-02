import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { formatNumber } from '../Atoms/Internationalization';
import type { Tables } from '../DataModel/types';
import { strictGetTable } from '../DataModel/tables';
import { TableIcon } from '../Molecules/TableIcon';
import type { WbVariantLocalization } from '../Toolbar/WbsDialog';
import type { WbCellCounts } from '../WorkBench/CellMeta';
import type { WbMapping } from '../WorkBench/mapping';
import type { RecordCounts } from '../WorkBench/WbValidation';
import type { WbStatus } from '../WorkBench/WbView';

export function WbUpload({
  hasUnsavedChanges,
  mappings,
  openNoUploadPlan,
  startUpload,
  cellCounts,
  viewerLocalization,
  recordCounts,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly mappings: WbMapping | undefined;
  readonly openNoUploadPlan: () => void;
  readonly startUpload: (mode: WbStatus) => void;
  readonly cellCounts: WbCellCounts;
  readonly viewerLocalization: WbVariantLocalization;
  readonly recordCounts: RecordCounts;
}): JSX.Element {
  const [showUpload, openUpload, closeUpload] = useBooleanState();

  const handleUpload = (): void => {
    if ((mappings?.lines ?? []).length > 0) {
      openUpload();
    } else {
      openNoUploadPlan();
    }
  };

  const handleConfirmUpload = (): void => {
    startUpload('upload');
    closeUpload();
  };

  const isFromBatchEdit = viewerLocalization.do === 'Commit';

  const [
    warningDialog,
    _,
    handleCloseWarningDialog,
    handleToggleWarningDialog,
  ] = useBooleanState(false);

  const [noShowWarning = false, setNoShowWarning] = useCachedState(
    'batchEdit',
    'warningBatchEditDialog'
  );

  return (
    <>
      <>
        {noShowWarning || !isFromBatchEdit ? (
          <Button.Small
            aria-haspopup="dialog"
            disabled={hasUnsavedChanges || cellCounts.invalidCells > 0}
            title={
              hasUnsavedChanges
                ? wbText.unavailableWhileEditing()
                : cellCounts.invalidCells > 0
                  ? wbText.uploadUnavailableWhileHasErrors()
                  : undefined
            }
            onClick={handleUpload}
          >
            {viewerLocalization.do}
          </Button.Small>
        ) : (
          <Button.Small
            aria-haspopup="dialog"
            disabled={hasUnsavedChanges || cellCounts.invalidCells > 0}
            title={
              hasUnsavedChanges
                ? wbText.unavailableWhileEditing()
                : cellCounts.invalidCells > 0
                  ? wbText.uploadUnavailableWhileHasErrors()
                  : undefined
            }
            onClick={handleToggleWarningDialog}
          >
            {viewerLocalization.do}
          </Button.Small>
        )}
      </>

      {warningDialog && (
        <Dialog
          buttons={
            <>
              <Button.Warning onClick={handleToggleWarningDialog}>
                {commonText.cancel()}
              </Button.Warning>
              <span className="-ml-2 flex-1" />
              <Label.Inline>
                <Input.Checkbox
                  checked={noShowWarning}
                  onValueChange={(): void => setNoShowWarning(!noShowWarning)}
                />
                {commonText.dontShowAgain()}
              </Label.Inline>
              <Button.Info
                onClick={(): void => {
                  handleCloseWarningDialog();
                  handleUpload();
                }}
              >
                {commonText.proceed()}
              </Button.Info>
            </>
          }
          className={{
            container: dialogClassNames.narrowContainer,
          }}
          dimensionsKey="batchEdit-warning"
          header={batchEditText.commitDataSet()}
          onClose={undefined}
        >
          {batchEditText.warningBatchEditText()}
        </Dialog>
      )}

      {showUpload && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info onClick={handleConfirmUpload}>
                {viewerLocalization.do}
              </Button.Info>
            </>
          }
          header={viewerLocalization.doStart}
          onClose={closeUpload}
        >
          <div className="flex flex-col gap-4">
            <div>{viewerLocalization.doStartDescription}</div>
            {recordCounts.Uploaded !== undefined &&
              Object.keys(recordCounts.Uploaded).length > 0 && (
                <div>
                  <p className="text-sm font-medium">
                    {wbText.recordsCreated()}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {Object.entries(recordCounts.Uploaded as RR<keyof Tables, number>)
                      .sort(([, a], [, b]) => b - a)
                      .map(([tableName, count]) => (
                        <li key={tableName} className="flex items-center gap-1">
                          <TableIcon label={false} name={tableName as Lowercase<keyof Tables>} />
                          <span>
                            {commonText.colonLine({
                              label: strictGetTable(tableName as Lowercase<keyof Tables>).label,
                              value: formatNumber(count),
                            })}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
          </div>
        </Dialog>
      )}
    </>
  );
}
