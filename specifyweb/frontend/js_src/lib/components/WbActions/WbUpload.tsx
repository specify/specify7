import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { WbVariantLocalization } from '../Toolbar/WbsDialog';
import type { WbCellCounts } from '../WorkBench/CellMeta';
import type { WbMapping } from '../WorkBench/mapping';
import { TableRecordCounts } from '../WorkBench/Results';
import type { RecordCounts } from '../WorkBench/WbValidation';
import { RecordCountPriority } from '../WorkBench/WbValidation';
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
            {Object.keys(recordCounts).length > 0 && (
              <div className="flex flex-col gap-2">
                {Object.entries(recordCounts)
                  .sort(
                    sortFunction(([value]) => RecordCountPriority.indexOf(value))
                  )
                  .map(([resultType, recordsPerType]) =>
                    recordsPerType !== undefined &&
                    Object.keys(recordsPerType).length > 0 ? (
                      <div key={resultType}>
                        <p className="text-sm font-medium">
                          {resultType === 'Uploaded'
                            ? wbText.recordsCreated()
                            : resultType === 'Updated'
                              ? wbText.recordsUpdated()
                              : resultType === 'Deleted'
                                ? wbText.recordsDeleted()
                                : wbText.recordsMatchedAndChanged()}
                        </p>
                        <TableRecordCounts
                          recordCounts={recordsPerType}
                          sortFunction={([, recordCount]) =>
                            -(recordCount ?? 0)
                          }
                        />
                      </div>
                    ) : null
                  )}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
