import React from 'react';

import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { overwriteReadOnly } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import type { Status } from '../WbPlanView/Wrapped';
import type { WbCellCounts, WbCellMetaReact } from './CellMeta';
import { RollbackConfirmation } from './Components';
import { CreateRecordSetButton } from './RecordSet';
import { WbStatus as WbStatusComponent } from './Status';
import type { DialogHandlers, WbStatus, WbView, Workbench } from './WbView';
import type { Dataset } from '../WbPlanView/Wrapped';
import type { WbMapping } from './mapping';
import type { RA } from '../../utils/types';
import { WbValidationReact } from './WbValidation';
import Handsontable from 'handsontable';
import { WbUtils } from './WbUtils';
import { className } from '../Atoms/className';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { useBooleanState } from '../../hooks/useBooleanState';

export function useWbActions({
  datasetId,
  triggerRefresh,
  checkDeletedFail,
  openStatus,
  spreadSheetUpToDate,
  workbench,
}: {
  readonly datasetId: number;
  readonly triggerRefresh: () => void;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly openStatus: () => void;
  readonly spreadSheetUpToDate: () => void;
  readonly workbench: Workbench;
}) {
  const mode = React.useRef<WbStatus | undefined>(undefined);
  const refreshInitiatorAborted = React.useRef<boolean>(false);

  const startUpload = (newMode: WbStatus): void => {
    // this.validation.stopLiveValidation();
    // this.validation.updateValidationButton();
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

  const changeMode = (newMode: WbStatus): void => {
    mode.current = newMode;
  };

  const triggerStatusComponent = (newMode: WbStatus): void => {
    changeMode(newMode);
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

  const save = () => {
    // Clear validation
    overwriteReadOnly(workbench.dataset, 'rowresults', null);
    // this.validation.stopLiveValidation();
    // this.validation.updateValidationButton();

    // Show saving progress bar
    // this.saveProgressBar.open();

    // Send data
    ping(`/api/workbench/rows/${datasetId}/`, {
      method: 'PUT',
      body: workbench.data,
      expectedErrors: [Http.NO_CONTENT, Http.NOT_FOUND],
    })
      .then((status) => checkDeletedFail(status))
      .then(() => {
        spreadSheetUpToDate();
        workbench.cells!.cellMeta = [];
        // utils.searchCells({ key: 'SettingsChange' });
        workbench.hot?.render();
      });
    // .finally(this.saveProgressBar.close);
  };

  return {
    mode,
    refreshInitiatorAborted,
    startUpload,
    triggerStatusComponent,
    save,
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
  toggleResults
}: {
  readonly dataset: Dataset;
  readonly hasUnSavedChanges: boolean;
  readonly isUploaded: boolean;
  readonly triggerRefresh: () => void;
  readonly mappings: WbMapping;
  readonly checkDeletedFail: (statusCode: number) => void;
  readonly spreadSheetUpToDate: () => void;
  readonly workbench: Workbench;
  readonly toggleResults: () => void;
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
    spreadSheetUpToDate,
    workbench,
  });
  const cells = workbench.cells!;
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
          validation={workbench.validation as WbValidationReact}
        />
      )}
      <WbResults hasUnSavedChanges={hasUnSavedChanges} toggleResults={toggleResults} />
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
          <WbSave hasUnSavedChanges={hasUnSavedChanges} save={actions.save} />
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
          header={messages[mode.current as WbStatus].header}
          onClose={closeOperationCompleted}
        >
          {messages[mode.current as WbStatus].message}
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

export function WbValidate({
  canLiveValidate,
  hasUnSavedChanges,
  startUpload,
  validation
}: {
  readonly canLiveValidate: boolean;
  readonly hasUnSavedChanges: boolean;
  readonly startUpload: (mode: WbStatus) => void;
  readonly validation: WbValidationReact
}): JSX.Element {
  const handleValidate = () => startUpload('validate');
  const [validateIsReady, setValidateIsReady] = React.useState<boolean>(false);
  const [liveValidationCount, setCount] = React.useState<number>(validation.liveValidationStack.length);
  React.useEffect(() => {
    validation.setCount = setCount;
    setValidateIsReady(true);
  }, [])
  return (
    <>
      <Button.Small
        className={`wb-data-check ${canLiveValidate ? '' : 'hidden'}`}
        onClick={() => validation.toggleDataCheck()}
        aria-pressed={validation.validationMode === "live"}
      >
        {validation.validationMode === 'live'
        ? liveValidationCount > 0
          ? commonText.countLine({
              resource: wbText.dataCheckOn(),
              count: liveValidationCount,
            })
          : wbText.dataCheckOn()
        : wbText.dataCheck()}
      </Button.Small>
      <Button.Small
        aria-haspopup="dialog"
        className="wb-validate"
        onClick={handleValidate}
        disabled={hasUnSavedChanges}
        title={hasUnSavedChanges ? wbText.unavailableWhileEditing() : ''}
      >
        {wbText.validate()}
      </Button.Small>
    </>
  );
}

export function WbResults({
  hasUnSavedChanges,
  toggleResults
}: {
  readonly hasUnSavedChanges: boolean;
  readonly toggleResults: () => void;
}): JSX.Element {
  
  return (
    <>
      <Button.Small
        aria-haspopup="tree"
        className="wb-show-upload-view"
        disabled={hasUnSavedChanges}
        title={hasUnSavedChanges ? wbText.wbUploadedUnavailable() : ''}
        onClick={toggleResults}
      >
        {commonText.results()}
      </Button.Small>
    </>
  );
}

export function WbRollback({
  datasetId,
  triggerStatusComponent,
}: {
  readonly datasetId: number;
  readonly triggerStatusComponent: (mode: WbStatus) => void;
}): JSX.Element {
  const [rollback, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={rollback}
        className="wb-unupload"
        onClick={handleOpen}
      >
        {wbText.rollback()}
      </Button.Small>
      {rollback && (
        <RollbackConfirmation
          dataSetId={datasetId}
          onClose={handleClose}
          onRollback={() => triggerStatusComponent('unupload')}
        />
      )}
    </>
  );
}

export function WbUpload({
  hasUnSavedChanges,
  mappings,
  openNoUploadPlan,
  startUpload,
}: {
  readonly hasUnSavedChanges: boolean;
  readonly mappings: WbMapping;
  readonly openNoUploadPlan: () => void;
  readonly startUpload: (mode: WbStatus) => void;
}): JSX.Element {
  const [showUpload, openUpload, closeUpload] = useBooleanState();
  const handleUpload = (): void => {
    if ((mappings?.lines ?? []).length > 0) {
      openUpload();
    } else {
      openNoUploadPlan();
    }
  };
  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        className="wb-upload"
        onClick={handleUpload}
        disabled={hasUnSavedChanges}
        title={hasUnSavedChanges ? wbText.unavailableWhileEditing() : ''}
      >
        {wbText.upload()}
      </Button.Small>
      {showUpload && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info
                onClick={(): void => {
                  startUpload('upload');
                  closeUpload();
                }}
              >
                {wbText.upload()}
              </Button.Info>
            </>
          }
          header={wbText.startUpload()}
          onClose={closeUpload}
        >
          {wbText.startUploadDescription()}
        </Dialog>
      )}
    </>
  );
}

export function WbRevert({
  hasUnSavedChanges,
  triggerRefresh,
  spreadSheetUpToDate,
}: {
  readonly hasUnSavedChanges: boolean;
  readonly triggerRefresh: () => void;
  readonly spreadSheetUpToDate: () => void;
}): JSX.Element {
  const [showRevert, openRevert, closeRevert] = useBooleanState();
  const handleRevert = () => {
    triggerRefresh();
    closeRevert();
    spreadSheetUpToDate();
  };
  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        className="wb-revert"
        onClick={openRevert}
        disabled={!hasUnSavedChanges}
      >
        {wbText.revert()}
      </Button.Small>
      {showRevert && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Danger onClick={handleRevert}>
                {wbText.revert()}
              </Button.Danger>
            </>
          }
          header={wbText.revertChanges()}
          onClose={closeRevert}
        >
          {wbText.revertChangesDescription()}
        </Dialog>
      )}
    </>
  );
}

export function WbSave({
  hasUnSavedChanges,
  save,
}: {
  readonly hasUnSavedChanges: boolean;
  readonly save: () => void;
}): JSX.Element {
  const [showProgressBar, openProgressBar, closeProgressBar] =
    useBooleanState();
  const handleSave = () => {
    openProgressBar();
    save();
    closeProgressBar();
  };
  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        className="wb-save"
        variant={className.saveButton}
        onClick={handleSave}
        disabled={!hasUnSavedChanges}
      >
        {commonText.save()}
      </Button.Small>
      {showProgressBar && (
        <Dialog
          buttons={undefined}
          header={wbText.saving()}
          onClose={closeProgressBar}
        >
          {loadingBar}
        </Dialog>
      )}
    </>
  );
}

/* eslint-disable functional/no-this-expression */
export class WbActionsReact {
  // eslint-disable-next-line functional/prefer-readonly-type
  public hasUnSavedChanges: boolean = false;

  public constructor(
    private readonly data: RA<RA<string | null>>,
    private readonly dataset: Dataset,
    private readonly mappings: WbMapping,
    private readonly noUploadPlan: DialogHandlers,
    private readonly uploadDialog: DialogHandlers,
    private readonly statusComponent: DialogHandlers,
    private readonly checkDeletedFail: (statusCode: number) => boolean,
    private readonly triggerRefresh: () => void,
    private readonly saveProgressBar: DialogHandlers,
    private refreshInitiatedBy: React.MutableRefObject<WbStatus | undefined>,
    private refreshInitiatorAborted: React.MutableRefObject<boolean>,
    private readonly operationCompleted: DialogHandlers,
    private readonly operationAborted: DialogHandlers,
    private readonly opMsg: any,
    private readonly validation: WbValidationReact,
    private readonly cells: WbCellMetaReact,
    private readonly hot: Handsontable,
    private readonly utils: WbUtils // change
  ) {}

  // BUG: disable the button if there is nothing to upload
  upload(mode: WbStatus): void {
    if ((this.mappings?.lines ?? []).length > 0) {
      if (mode === 'upload') {
        this.uploadDialog.open();
      } else this.startUpload(mode);
    } else {
      this.noUploadPlan.open();
    }
  }

  startUpload(mode: WbStatus): void {
    // this.validation.stopLiveValidation();
    // this.validation.updateValidationButton();
    ping(`/api/workbench/${mode}/${this.dataset.id}/`, {
      method: 'POST',
      expectedErrors: [Http.CONFLICT],
    })
      .then((statusCode): void => {
        this.checkDeletedFail(statusCode);
        this.checkConflictFail(statusCode);
      })
      .then(() => this.openStatus(mode));
  }

  openStatus(mode: WbStatus): void {
    this.refreshInitiatedBy.current = mode;
    this.statusComponent.open();
  }

  async save() {
    // Clear validation
    overwriteReadOnly(this.dataset, 'rowresults', null);
    // this.validation.stopLiveValidation();
    // this.validation.updateValidationButton();

    // Show saving progress bar
    this.saveProgressBar.open();

    // Send data
    return ping(`/api/workbench/rows/${this.dataset.id}/`, {
      method: 'PUT',
      body: this.data,
      expectedErrors: [Http.NO_CONTENT, Http.NOT_FOUND],
    })
      .then((status) => this.checkDeletedFail(status))
      .then(() => {
        this.spreadSheetUpToDate();
        this.cells.cellMeta = [];
        this.utils.searchCells({ key: 'SettingsChange' });
        this.hot?.render();
      })
      .finally(this.saveProgressBar.close);
  }

  // Check if AJAX failed because Data Set was modified by other session
  checkConflictFail(statusCode: number): boolean {
    if (statusCode === Http.CONFLICT)
      /*
       * Upload/Validation/Un-Upload has been initialized by another session
       * Need to reload the page to display the new state
       */
      this.triggerRefresh();
    return statusCode === Http.CONFLICT;
  }

  spreadSheetUpToDate(): void {
    if (!this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = false;
  }

  public operationCompletedMessage(cellCounts: WbCellCounts) {
    if (this.refreshInitiatedBy.current === undefined) return;

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

    // refactor to set this as a state or ref
    const messageToShow = messages[this.refreshInitiatedBy.current];
    this.opMsg(messageToShow);
    this.operationCompleted.open();
  }

  operationAbortedMessage(): void {
    if (
      this.refreshInitiatedBy.current === undefined ||
      this.refreshInitiatorAborted.current
    )
      return;

    this.operationAborted.open();

    // // set this in onClose
    // this.refreshInitiatedBy.current = undefined;
    // this.refreshInitiatorAborted.current = false;
  }

  spreadSheetChanged(): void {
    if (this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = true;
  }
}

/* eslint-enable functional/no-this-expression */

/* eslint-disable functional/no-this-expression */
export class WbActions {
  // eslint-disable-next-line functional/prefer-readonly-type
  private hasUnSavedChanges: boolean = false;

  // eslint-disable-next-line functional/prefer-readonly-type
  public status: (() => void) | undefined = undefined;

  public constructor(private readonly wbView: WbView) {}

  /*
   * Actions
   * aka Rollback
   */
  unupload(): void {
    const dialog = this.wbView.options.display(
      <RollbackConfirmation
        dataSetId={this.wbView.dataset.id}
        onClose={() => dialog()}
        onRollback={() => this.openStatus('unupload')}
      />
    );
  }

  // BUG: disable the button if there is nothing to upload
  upload(event: MouseEvent): void {
    const mode =
      (event.currentTarget as HTMLElement | null)?.classList.contains(
        'wb-upload'
      ) === true
        ? 'upload'
        : 'validate';
    if ((this.wbView.mappings?.lines ?? []).length > 0) {
      if (mode === 'upload') {
        const dialog = this.wbView.options.display(
          <Dialog
            buttons={
              <>
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
                <Button.Info
                  onClick={(): void => {
                    this.startUpload(mode);
                    dialog();
                  }}
                >
                  {wbText.upload()}
                </Button.Info>
              </>
            }
            header={wbText.startUpload()}
            onClose={(): void => dialog()}
          >
            {wbText.startUploadDescription()}
          </Dialog>
        );
      } else this.startUpload(mode);
    } else {
      const dialog = this.wbView.options.display(
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              <Link.Info
                href={`/specify/workbench/plan/${this.wbView.dataset.id}/`}
              >
                {commonText.create()}
              </Link.Info>
            </>
          }
          header={wbPlanText.noUploadPlan()}
          onClose={() => dialog()}
        >
          {wbPlanText.noUploadPlanDescription()}
        </Dialog>
      );
    }
  }

  startUpload(mode: WbStatus): void {
    this.wbView.validation.stopLiveValidation();
    this.wbView.validation.updateValidationButton();
    ping(`/api/workbench/${mode}/${this.wbView.dataset.id}/`, {
      method: 'POST',
      expectedErrors: [Http.CONFLICT],
    })
      .then((statusCode): void => {
        this.wbView.checkDeletedFail(statusCode);
        this.checkConflictFail(statusCode);
      })
      .then(() => this.openStatus(mode));
  }

  openStatus(mode: WbStatus): void {
    this.status = this.wbView.options.display(
      <WbStatusComponent
        dataset={{
          ...this.wbView.dataset,
          // Create initial status if it doesn't exist yet
          uploaderstatus: {
            uploaderstatus:
              this.wbView.dataset.uploaderstatus ??
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
          this.status?.();
          this.status = undefined;
          this.wbView.trigger('refresh', mode, wasAborted);
        }}
      />
    );
  }

  revertChanges(): void {
    const dialog = this.wbView.options.display(
      <Dialog
        buttons={
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            <Button.Danger onClick={() => this.wbView.trigger('refresh')}>
              {wbText.revert()}
            </Button.Danger>
          </>
        }
        header={wbText.revertChanges()}
        onClose={() => dialog()}
      >
        {wbText.revertChangesDescription()}
      </Dialog>
    );
  }

  async save() {
    // Clear validation
    overwriteReadOnly(this.wbView.dataset, 'rowresults', null);
    this.wbView.validation.stopLiveValidation();
    this.wbView.validation.updateValidationButton();

    // Show saving progress bar
    const dialog = this.wbView.options.display(
      <Dialog
        buttons={undefined}
        header={wbText.saving()}
        onClose={() => dialog()}
      >
        {loadingBar}
      </Dialog>
    );

    // Send data
    return ping(`/api/workbench/rows/${this.wbView.dataset.id}/`, {
      method: 'PUT',
      body: this.wbView.data,
      expectedErrors: [Http.NO_CONTENT, Http.NOT_FOUND],
    })
      .then((status) => this.wbView.checkDeletedFail(status))
      .then(() => {
        this.spreadSheetUpToDate();
        this.wbView.cells.cellMeta = [];
        this.wbView.wbUtils.searchCells({ key: 'SettingsChange' });
        this.wbView.hot?.render();
      })
      .finally(() => dialog());
  }

  // Check if AJAX failed because Data Set was modified by other session
  checkConflictFail(statusCode: number): boolean {
    if (statusCode === Http.CONFLICT)
      /*
       * Upload/Validation/Un-Upload has been initialized by another session
       * Need to reload the page to display the new state
       */
      this.wbView.trigger('reload');
    return statusCode === Http.CONFLICT;
  }

  spreadSheetUpToDate(): void {
    if (!this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = false;
    Array.from(
      this.wbView.el.querySelectorAll(
        '.wb-upload, .wb-validate, .wb-export-data-set, .wb-change-data-set-owner'
      ),
      (element) => {
        (element as HTMLButtonElement).disabled = false;
        element.setAttribute('title', '');
      }
    );
    this.wbView.el.querySelector('.wb-save')?.toggleAttribute('disabled', true);
    this.wbView.el
      .querySelector('.wb-revert')
      ?.toggleAttribute('disabled', true);
    this.wbView.options.onSetUnloadProtect(false);
  }

  public operationCompletedMessage(cellCounts: WbCellCounts): void {
    if (this.wbView.refreshInitiatedBy === undefined) return;

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

    const dialog = this.wbView.options.display(
      <Dialog
        buttons={
          <>
            {cellCounts.invalidCells === 0 &&
            this.wbView.refreshInitiatedBy === 'upload' ? (
              <CreateRecordSetButton
                dataSetId={this.wbView.dataset.id}
                dataSetName={this.wbView.dataset.name}
                small={false}
                onClose={() => dialog()}
              />
            ) : undefined}
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          </>
        }
        header={messages[this.wbView.refreshInitiatedBy].header}
        onClose={() => dialog()}
      >
        {messages[this.wbView.refreshInitiatedBy].message}
      </Dialog>
    );

    this.wbView.refreshInitiatedBy = undefined;
    this.wbView.refreshInitiatorAborted = false;
  }

  operationAbortedMessage(): void {
    if (
      this.wbView.refreshInitiatedBy === undefined ||
      this.wbView.refreshInitiatorAborted
    )
      return;

    const dialog = this.wbView.options.display(
      <Dialog
        buttons={commonText.close()}
        header={
          this.wbView.refreshInitiatedBy === 'validate'
            ? wbText.validationCanceled()
            : this.wbView.refreshInitiatedBy === 'unupload'
            ? wbText.rollbackCanceled()
            : wbText.uploadCanceled()
        }
        onClose={() => dialog()}
      >
        {this.wbView.refreshInitiatedBy === 'validate'
          ? wbText.validationCanceledDescription()
          : this.wbView.refreshInitiatedBy === 'unupload'
          ? wbText.rollbackCanceledDescription()
          : wbText.uploadCanceledDescription()}
      </Dialog>
    );
    this.wbView.refreshInitiatedBy = undefined;
    this.wbView.refreshInitiatorAborted = false;
  }

  spreadSheetChanged(): void {
    if (this.hasUnSavedChanges) return;
    this.hasUnSavedChanges = true;

    Array.from(
      this.wbView.el.querySelectorAll(
        '.wb-upload, .wb-validate, .wb-export-data-set, .wb-change-data-set-owner'
      ),
      (element) => {
        (element as HTMLButtonElement).disabled = true;
        element.setAttribute('title', wbText.unavailableWhileEditing());
      }
    );
    this.wbView.el
      .querySelector('.wb-save')
      ?.toggleAttribute('disabled', false);
    this.wbView.el
      .querySelector('.wb-revert')
      ?.toggleAttribute('disabled', false);
    const uploadView = this.wbView.el.querySelector('.wb-show-upload-view');
    uploadView?.toggleAttribute('disabled', true);
    uploadView?.setAttribute('title', wbText.wbUploadedUnavailable());
    this.wbView.options.onSetUnloadProtect(true);
  }
}

/* eslint-enable functional/no-this-expression */
