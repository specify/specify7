import React from 'react';

import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { Dialog } from '../Molecules/Dialog';
import type { Status } from '../WbPlanView/Wrapped';
import { CreateRecordSetButton } from '../WorkBench/RecordSet';
import { WbStatus as WbStatusComponent } from '../WorkBench/Status';
import type { WbStatus, Workbench } from '../WorkBench/WbView';
import type { Dataset } from '../WbPlanView/Wrapped';
import type { WbMapping } from '../WorkBench/mapping';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { useBooleanState } from '../../hooks/useBooleanState';
import { WbResults } from './WbResults';
import { WbValidate } from './WbValidate';
import { WbRollback } from './WbRollback';
import { WbUpload } from './WbUpload';
import { WbRevert } from './WbRevert';
import { WbSave } from './WbSave';
import { GET } from '../../utils/utils';

export function useWbActions({
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
}) {
  const modeRef = React.useRef<WbStatus | undefined>(undefined);
  const refreshInitiatorAborted = React.useRef<boolean>(false);

  const startUpload = (newMode: WbStatus): void => {
    workbench.validation.stopLiveValidation();
    // TODO: figure out what to do in updateValidationButton();
    workbench.validation.updateValidationButton();
    ping(`/api/workbench/${newMode}/${datasetId}/`, {
      method: 'POST',
      expectedErrors: [Http.CONFLICT],
    })
      .then((statusCode): void => {
        checkDeletedFail(statusCode);
        checkConflictFail(statusCode);
      })
      .then(() => triggerStatusComponent(newMode));
  };

  const triggerStatusComponent = (newMode: WbStatus): void => {
    modeRef.current = newMode;
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
    modeRef,
    refreshInitiatorAborted,
    startUpload,
    triggerStatusComponent,
  };
}

export function WbActionsComponent({
  dataset,
  hasUnsavedChanges,
  isUploaded,
  workbench,
  mappings,
  checkDeletedFail,
  onDatasetRefresh: handleRefresh,
  onSpreadsheetUpToDate: handleSpreadsheetUpToDate,
  onToggleResults,
}: {
  readonly dataset: Dataset;
  readonly hasUnsavedChanges: boolean;
  readonly isUploaded: boolean;
  readonly workbench: Workbench;
  readonly mappings: WbMapping;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly onDatasetRefresh: () => void;
  readonly onSpreadsheetUpToDate: () => void;
  readonly onToggleResults: () => void;
}): JSX.Element {
  const [canLiveValidate] = userPreferences.use(
    'workBench',
    'general',
    'liveValidation'
  );
  const [noUploadPlan, openNoUploadPlan, closeNoUploadPlan] = useBooleanState();
  const [showStatus, openStatus, closeStatus] = useBooleanState();
  const [operationAborted, openAbortedMessage, closeAbortedMessage] =
    useBooleanState();
  const [operationCompleted, openOperationCompleted, closeOperationCompleted] =
    useBooleanState();
  const { modeRef, refreshInitiatorAborted, ...actions } = useWbActions({
    datasetId: dataset.id,
    onRefresh: handleRefresh,
    checkDeletedFail,
    onOpenStatus: openStatus,
    workbench,
  });

  // TODO: put the message rendering logic in a utility function?
  const cellCounts = workbench.cellCounts[GET];
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
            header: wbText.uploadSuccessful(),
            message: wbText.uploadSuccessfulDescription(),
          }
        : {
            header: wbText.uploadErrors(),
            message: (
              <>
                {wbText.uploadErrorsDescription()}
                <br />
                <br />
                {wbText.uploadErrorsSecondDescription()}
              </>
            ),
          },
    unupload: {
      header: wbText.dataSetRollback(),
      message: wbText.dataSetRollbackDescription(),
    },
  };

  React.useEffect(() => {
    if (
      !isUploaded &&
      (mappings?.lines ?? []).length === 0 &&
      hasPermission('/workbench/dataset', 'upload')
    ) {
      openNoUploadPlan();
    }
  }, []);

  return (
    <>
      {noUploadPlan ? (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              <Link.Info href={`/specify/workbench/plan/${dataset.id}/`}>
                {commonText.create()}
              </Link.Info>
            </>
          }
          header={wbPlanText.noUploadPlan()}
          onClose={closeNoUploadPlan}
        >
          {wbPlanText.noUploadPlanDescription()}
        </Dialog>
      ) : undefined}
      {!isUploaded && hasPermission('/workbench/dataset', 'validate') ? (
        <WbValidate
          hasUnsavedChanges={hasUnsavedChanges}
          canLiveValidate={canLiveValidate}
          startUpload={actions.startUpload}
          validation={workbench.validation}
        />
      ) : undefined}
      <WbResults
        hasUnsavedChanges={hasUnsavedChanges}
        onToggleResults={onToggleResults}
      />
      {isUploaded && hasPermission('/workbench/dataset', 'unupload') ? (
        <WbRollback
          datasetId={dataset.id}
          triggerStatusComponent={actions.triggerStatusComponent}
        />
      ) : undefined}
      {!isUploaded && hasPermission('/workbench/dataset', 'upload') ? (
        <WbUpload
          hasUnsavedChanges={hasUnsavedChanges}
          mappings={mappings}
          openNoUploadPlan={openNoUploadPlan}
          startUpload={actions.startUpload}
          cellCounts={workbench.cellCounts[0]}
        />
      ) : undefined}
      {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
        <>
          <WbRevert
            hasUnsavedChanges={hasUnsavedChanges}
            onRefresh={handleRefresh}
            onSpreadsheetUpToDate={handleSpreadsheetUpToDate}
          />
          <WbSave
            hasUnsavedChanges={hasUnsavedChanges}
            onSpreadsheetUpToDate={handleSpreadsheetUpToDate}
            checkDeletedFail={checkDeletedFail}
            workbench={workbench}
          />
        </>
      ) : undefined}
      {typeof modeRef.current === 'string' && showStatus ? (
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
                  }[modeRef.current],
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
      {operationCompleted ? (
        <Dialog
          buttons={
            <>
              {cellCounts.invalidCells === 0 && modeRef.current === 'upload' && (
                <CreateRecordSetButton
                  dataSetId={dataset.id}
                  dataSetName={dataset.name}
                  small={false}
                  onClose={() => {
                    modeRef.current = undefined;
                    refreshInitiatorAborted.current = false;
                    closeOperationCompleted();
                  }}
                />
              )}
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            </>
          }
          header={messages[modeRef.current!].header}
          onClose={closeOperationCompleted}
        >
          {messages[modeRef.current!].message}
        </Dialog>
      ) : undefined}
      {operationAborted ? (
        <Dialog
          buttons={commonText.close()}
          header={
            modeRef.current === 'validate'
              ? wbText.validationCanceled()
              : modeRef.current === 'unupload'
              ? wbText.rollbackCanceled()
              : wbText.uploadCanceled()
          }
          onClose={closeAbortedMessage}
        >
          {modeRef.current === 'validate'
            ? wbText.validationCanceledDescription()
            : modeRef.current === 'unupload'
            ? wbText.rollbackCanceledDescription()
            : wbText.uploadCanceledDescription()}
        </Dialog>
      ) : undefined}
    </>
  );
}
