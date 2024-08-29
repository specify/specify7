import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog } from '../Molecules/Dialog';
import type { Dataset, Status } from '../WbPlanView/Wrapped';
import type { WbCellCounts } from '../WorkBench/CellMeta';
import type { WbMapping } from '../WorkBench/mapping';
import { CreateRecordSetButton } from '../WorkBench/RecordSet';
import { WbStatus as WbStatusComponent } from '../WorkBench/Status';
import type { WbStatus, Workbench } from '../WorkBench/WbView';
import { WbNoUploadPlan } from './WbNoUploadPlan';
import { WbRevert } from './WbRevert';
import { WbRollback } from './WbRollback';
import { WbSave } from './WbSave';
import { WbUpload } from './WbUpload';
import { WbValidate } from './WbValidate';
import { WbVariantLocalization } from '../Toolbar/WbsDialog';
import { resolveVariantFromDataset } from '../WbUtils/datasetVariants';

export function WbActions({
  dataset,
  hasUnsavedChanges,
  isUploaded,
  isResultsOpen,
  workbench,
  cellCounts,
  mappings,
  checkDeletedFail,
  searchRef,
  onDatasetRefresh: handleRefresh,
  onSpreadsheetUpToDate: handleSpreadsheetUpToDate,
  onToggleResults: handleToggleResults,
}: {
  readonly dataset: Dataset;
  readonly hasUnsavedChanges: boolean;
  readonly isUploaded: boolean;
  readonly isResultsOpen: boolean;
  readonly workbench: Workbench;
  readonly cellCounts: WbCellCounts;
  readonly mappings: WbMapping | undefined;
  readonly searchRef: React.MutableRefObject<HTMLInputElement | null>;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly onDatasetRefresh: () => void;
  readonly onSpreadsheetUpToDate: () => void;
  readonly onToggleResults: () => void;
}): JSX.Element {
  const [noUploadPlan, openNoUploadPlan, closeNoUploadPlan] = useBooleanState();
  const [showStatus, openStatus, closeStatus] = useBooleanState();
  const [operationAborted, openAbortedMessage, closeAbortedMessage] =
    useBooleanState();
  const [operationCompleted, openOperationCompleted, closeOperationCompleted] =
    useBooleanState();
  const { mode, refreshInitiatorAborted, startUpload, triggerStatusComponent } =
    useWbActions({
      datasetId: dataset.id,
      onRefresh: handleRefresh,
      checkDeletedFail,
      onOpenStatus: openStatus,
      workbench,
    });
  
  const variant = resolveVariantFromDataset(dataset);
  const viewerLocalization: WbVariantLocalization = variant.localization.viewer;

  const message = mode === undefined ? undefined : getMessage(cellCounts, mode, viewerLocalization);

  const isMapped = mappings !== undefined;

  const dataCheckInProgress = React.useMemo(
    () => workbench.validation.liveValidationStack.length > 0,
    [workbench.validation.liveValidationStack.length]
  );

  return (
    <>
      <WbNoUploadPlan
        datasetId={dataset.id}
        isUploaded={isUploaded}
        mappings={mappings}
        noUploadPlan={noUploadPlan}
        onCloseNoUploadPlan={closeNoUploadPlan}
        onOpenNoUploadPlan={openNoUploadPlan}
      />
      {!isUploaded && variant.canValidate() ? (
        <ErrorBoundary dismissible>
          <WbValidate
            hasUnsavedChanges={hasUnsavedChanges}
            isMapped={isMapped}
            isResultsOpen={isResultsOpen}
            startUpload={startUpload}
            validation={workbench.validation}
          />
        </ErrorBoundary>
      ) : undefined}
      <ErrorBoundary dismissible>
        <Button.Small
          aria-haspopup="tree"
          aria-pressed={isResultsOpen}
          disabled={hasUnsavedChanges || !isMapped || dataCheckInProgress}
          title={
            dataCheckInProgress
              ? wbText.unavailableWhileValidating()
              : isUploaded
              ? undefined
              : wbText.wbUploadedUnavailable()
          }
          onClick={handleToggleResults}
        >
          {commonText.results()}
        </Button.Small>
      </ErrorBoundary>
      {isUploaded && variant.canUndo() ? (
        <ErrorBoundary dismissible>
          <WbRollback
            datasetId={dataset.id}
            viewerLocalization={viewerLocalization}
            triggerStatusComponent={triggerStatusComponent}
          />
        </ErrorBoundary>
      ) : undefined}
      {!isUploaded && variant.canDo() ? (
        <ErrorBoundary dismissible>
          <WbUpload
            cellCounts={cellCounts}
            hasUnsavedChanges={hasUnsavedChanges}
            mappings={mappings}
            openNoUploadPlan={openNoUploadPlan}
            startUpload={startUpload}
            viewerLocalization={viewerLocalization}
          />
        </ErrorBoundary>
      ) : undefined}
      {!isUploaded && variant.canEdit() ? (
        <>
          <ErrorBoundary dismissible>
            <WbRevert
              hasUnsavedChanges={hasUnsavedChanges}
              onRefresh={handleRefresh}
              onSpreadsheetUpToDate={handleSpreadsheetUpToDate}
            />
          </ErrorBoundary>
          <ErrorBoundary dismissible>
            <WbSave
              checkDeletedFail={checkDeletedFail}
              hasUnsavedChanges={hasUnsavedChanges}
              searchRef={searchRef}
              workbench={workbench}
              onSpreadsheetUpToDate={handleSpreadsheetUpToDate}
            />
          </ErrorBoundary>
        </>
      ) : undefined}
      {typeof mode === 'string' && showStatus ? (
        <WbStatusComponent
          dataset={{
            ...dataset,
            // Create initial status if it doesn't exist yet
            uploaderstatus: {
              uploaderstatus:
                dataset.uploaderstatus ??
                ({
                  operation: {
                    validate: 'validating',
                    upload: 'uploading',
                    unupload: 'unuploading',
                  }[mode],
                  taskid: '',
                } as const),
              taskstatus: 'PENDING',
              taskinfo: 'None',
            } as Status,
          }}
          onFinished={(wasAborted): void => {
            refreshInitiatorAborted.current = wasAborted;
            closeStatus();
            if (wasAborted) openAbortedMessage();
            else openOperationCompleted();
            handleRefresh();
          }}
        />
      ) : undefined}
      {operationCompleted && (
        <Dialog
          buttons={
            <>
              {cellCounts.invalidCells === 0 && mode === 'upload' && (
                <CreateRecordSetButton
                  datasetId={dataset.id}
                  datasetName={dataset.name}
                  isUpdate={dataset.isupdate}
                  small={false}
                  onClose={() => {
                    refreshInitiatorAborted.current = false;
                    closeOperationCompleted();
                  }}
                />
              )}
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            </>
          }
          header={message!.header}
          onClose={closeOperationCompleted}
        >
          {message?.message}
        </Dialog>
      )}
      {operationAborted && (
        <Dialog
          buttons={commonText.close()}
          header={
            mode === 'validate'
              ? wbText.validationCanceled()
              : mode === 'unupload'
              ? wbText.rollbackCanceled()
              : viewerLocalization.doCancelled
          }
          onClose={closeAbortedMessage}
        >
          {mode === 'validate'
            ? wbText.validationCanceledDescription()
            : mode === 'unupload'
            ? wbText.rollbackCanceledDescription()
            : viewerLocalization.doCancelledDescription
            }
        </Dialog>
      )}
    </>
  );
}

function useWbActions({
  datasetId,
  workbench,
  checkDeletedFail,
  onRefresh: handleRefresh,
  onOpenStatus: handleOpenStatus,
}: {
  readonly datasetId: number;
  readonly workbench: Workbench;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly onRefresh: () => void;
  readonly onOpenStatus: () => void;
}): {
  readonly mode: WbStatus | undefined;
  readonly refreshInitiatorAborted: React.MutableRefObject<boolean>;
  readonly startUpload: (newMode: WbStatus) => void;
  readonly triggerStatusComponent: (newMode: WbStatus) => void;
} {
  const [mode, setMode] = React.useState<WbStatus | undefined>(undefined);
  const refreshInitiatorAborted = React.useRef<boolean>(false);
  const loading = React.useContext(LoadingContext);

  const startUpload = (newMode: WbStatus): void => {
    workbench.validation.stopLiveValidation();
    loading(
      ping(`/api/workbench/${newMode}/${datasetId}/`, {
        method: 'POST',
        expectedErrors: [Http.CONFLICT],
      }).then((statusCode): void => {
        checkDeletedFail(statusCode);
        checkConflictFail(statusCode);
        triggerStatusComponent(newMode);
      })
    );
  };

  const triggerStatusComponent = (newMode: WbStatus): void => {
    setMode(newMode);
    handleOpenStatus();
  };

  const checkConflictFail = (statusCode: number): boolean => {
    if (statusCode === Http.CONFLICT)
      /*
       * Upload/Validation/Un-Upload has been initialized by another session
       * Need to reload the page to display the new state
       */
      handleRefresh();
    return statusCode === Http.CONFLICT;
  };

  return {
    mode,
    refreshInitiatorAborted,
    startUpload,
    triggerStatusComponent,
  };
}

function getMessage(
  cellCounts: WbCellCounts,
  mode: WbStatus,
  viewerLocalization: WbVariantLocalization
): {
  readonly header: LocalizedString;
  readonly message: JSX.Element | LocalizedString;
} {
  const messages = {
    validate:
      cellCounts.invalidCells === 0
        ? {
            header: wbText.validationNoErrors(),
            message: (
              <>
                {wbText.validationNoErrorsDescription()}
                <br />
                <br />
                {wbText.validationReEditWarning()}
              </>
            ),
          }
        : {
            header: wbText.validationErrors(),
            message: (
              <>
                {wbText.validationErrorsDescription()}
                <br />
                <br />
                {wbText.validationReEditWarning()}
              </>
            ),
          },
    upload:
      cellCounts.invalidCells === 0
        ? {
            header: viewerLocalization.do,
            message: viewerLocalization.doSuccessfulDescription,
          }
        : {
            header: viewerLocalization.doErrors,
            message: (
              <>
                {viewerLocalization.doErrorsDescription}
                <br />
                <br />
                {wbText.uploadErrorsSecondDescription({type: viewerLocalization.do})}
              </>
            ),
          },
    unupload: {
      header: wbText.dataSetRollback(),
      message: viewerLocalization.undoFinishedDescription,
    },
  };

  return messages[mode];
}
