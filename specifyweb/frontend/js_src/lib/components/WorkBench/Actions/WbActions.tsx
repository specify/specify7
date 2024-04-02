import React from 'react';

import { commonText } from '../../../localization/common';
import { wbPlanText } from '../../../localization/wbPlan';
import { wbText } from '../../../localization/workbench';
import { Http } from '../../../utils/ajax/definitions';
import { ping } from '../../../utils/ajax/ping';
import { Button } from '../../Atoms/Button';
import { Link } from '../../Atoms/Link';
import { Dialog } from '../../Molecules/Dialog';
import type { Status } from '../../WbPlanView/Wrapped';
import { CreateRecordSetButton } from '../RecordSet';
import { WbStatus as WbStatusComponent } from '../Status';
import type { WbStatus, Workbench } from '../WbView';
import type { Dataset } from '../../WbPlanView/Wrapped';
import type { WbMapping } from '../mapping';
import { hasPermission } from '../../Permissions/helpers';
import { userPreferences } from '../../Preferences/userPreferences';
import { useBooleanState } from '../../../hooks/useBooleanState';
import { WbResults } from './WbResults';
import { WbValidate } from './WbValidate';
import { WbRollback } from './WbRollback';
import { WbUpload } from './WbUpload';
import { WbRevert } from './WbRevert';
import { WbSave } from './WbSave';

export function useWbActions({
  datasetId,
  triggerRefresh,
  checkDeletedFail,
  openStatus,
  workbench,
}: {
  readonly datasetId: number;
  readonly triggerRefresh: () => void;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly openStatus: () => void;
  readonly workbench: Workbench;
}) {
  const mode = React.useRef<WbStatus | undefined>(undefined);
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
    mode.current = newMode;
    openStatus();
  };

  const checkConflictFail = (statusCode: number): boolean => {
    if (statusCode === Http.CONFLICT)
      /*
       * Upload/Validation/Un-Upload has been initialized by another session
       * Need to reload the page to display the new state
       */
      triggerRefresh();
    return statusCode === Http.CONFLICT;
  };

  return {
    mode,
    refreshInitiatorAborted,
    startUpload,
    triggerStatusComponent,
  };
}

export function WbActionsComponent({
  dataset,
  hasUnSavedChanges,
  isUploaded,
  triggerRefresh,
  mappings,
  checkDeletedFail,
  spreadSheetUpToDate,
  workbench,
  onToggleResults,
}: {
  readonly dataset: Dataset;
  readonly hasUnSavedChanges: boolean;
  readonly isUploaded: boolean;
  readonly triggerRefresh: () => void;
  readonly mappings: WbMapping;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly spreadSheetUpToDate: () => void;
  readonly workbench: Workbench;
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
  const { mode, refreshInitiatorAborted, ...actions } = useWbActions({
    datasetId: dataset.id,
    triggerRefresh,
    checkDeletedFail,
    openStatus,
    workbench,
  });

  const cells = workbench.cells;
  const messages = {
    validate:
      cells.cellCounts?.invalidCells === 0
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
      cells.cellCounts?.invalidCells === 0
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
      {noUploadPlan && (
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
      )}
      {!isUploaded && hasPermission('/workbench/dataset', 'validate') && (
        <WbValidate
          hasUnSavedChanges={hasUnSavedChanges}
          canLiveValidate={canLiveValidate}
          startUpload={actions.startUpload}
          validation={workbench.validation}
        />
      )}
      <WbResults
        hasUnSavedChanges={hasUnSavedChanges}
        onToggleResults={onToggleResults}
      />
      {isUploaded && hasPermission('/workbench/dataset', 'unupload') && (
        <WbRollback
          datasetId={dataset.id}
          triggerStatusComponent={actions.triggerStatusComponent}
        />
      )}
      {!isUploaded && hasPermission('/workbench/dataset', 'upload') && (
        <WbUpload
          hasUnSavedChanges={hasUnSavedChanges}
          mappings={mappings}
          openNoUploadPlan={openNoUploadPlan}
          startUpload={actions.startUpload}
        />
      )}
      {!isUploaded && hasPermission('/workbench/dataset', 'update') && (
        <>
          <WbRevert
            hasUnSavedChanges={hasUnSavedChanges}
            triggerRefresh={triggerRefresh}
            spreadSheetUpToDate={spreadSheetUpToDate}
          />
          <WbSave
            hasUnSavedChanges={hasUnSavedChanges}
            spreadSheetUpToDate={spreadSheetUpToDate}
            checkDeletedFail={checkDeletedFail}
            workbench={workbench}
          />
        </>
      )}
      {mode.current && showStatus && (
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
                  }[mode.current],
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
            triggerRefresh();
          }}
        />
      )}
      {operationCompleted && (
        <Dialog
          buttons={
            <>
              {cells.cellCounts?.invalidCells === 0 &&
                mode.current === 'upload' && (
                  <CreateRecordSetButton
                    dataSetId={dataset.id}
                    dataSetName={dataset.name}
                    small={false}
                    onClose={() => {
                      mode.current = undefined;
                      refreshInitiatorAborted.current = false;
                      closeOperationCompleted();
                    }}
                  />
                )}
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            </>
          }
          header={messages[mode.current!].header}
          onClose={closeOperationCompleted}
        >
          {messages[mode.current!].message}
        </Dialog>
      )}
      {operationAborted && (
        <Dialog
          buttons={commonText.close()}
          header={
            mode.current === 'validate'
              ? wbText.validationCanceled()
              : mode.current === 'unupload'
              ? wbText.rollbackCanceled()
              : wbText.uploadCanceled()
          }
          onClose={closeAbortedMessage}
        >
          {mode.current === 'validate'
            ? wbText.validationCanceledDescription()
            : mode.current === 'unupload'
            ? wbText.rollbackCanceledDescription()
            : wbText.uploadCanceledDescription()}
        </Dialog>
      )}
    </>
  );
}
