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
import type { WbCellCounts } from './CellMeta';
import { RollbackConfirmation } from './Components';
import { CreateRecordSetButton } from './RecordSet';
import { WbStatus as WbStatusComponent } from './Status';
import type { WbStatus, WbView } from './WbView';

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
                <Button.Blue
                  onClick={(): void => {
                    this.startUpload(mode);
                    dialog();
                  }}
                >
                  {wbText.upload()}
                </Button.Blue>
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
              <Link.Blue
                href={`/specify/workbench/plan/${this.wbView.dataset.id}/`}
              >
                {commonText.create()}
              </Link.Blue>
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
    ping(
      `/api/workbench/${mode}/${this.wbView.dataset.id}/`,
      {
        method: 'POST',
      },
      { expectedResponseCodes: [Http.OK, Http.NOT_FOUND, Http.CONFLICT] }
    )
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
        onFinished={(wasAborted) => {
          this.status?.();
          this.status = undefined;
          this.wbView.trigger('refresh', mode, wasAborted);
        }}
      />
    );
  }

  revertChanges() {
    const dialog = this.wbView.options.display(
      <Dialog
        buttons={
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            <Button.Red onClick={() => this.wbView.trigger('refresh')}>
              {wbText.revert()}
            </Button.Red>
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
    return ping(
      `/api/workbench/rows/${this.wbView.dataset.id}/`,
      {
        method: 'PUT',
        body: this.wbView.data,
      },
      { expectedResponseCodes: [Http.NO_CONTENT, Http.NOT_FOUND] }
    )
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
