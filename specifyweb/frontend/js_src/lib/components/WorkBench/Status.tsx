/**
 * Reports Data Set status using a modal dialog (uploading, validating, rolling
 * back, failure, success)
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Label } from '../Atoms/Form';
import { error } from '../Errors/assert';
import { softFail } from '../Errors/Crash';
import { useTitle } from '../Molecules/AppTitle';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { Dataset, Status } from '../WbPlanView/Wrapped';
import { RemainingLoadingTime } from './RemainingLoadingTime';

// How often to query back-end
const REFRESH_RATE = 2000;

export function WbStatus({
  dataset,
  onFinished: handleFinished,
}: {
  readonly dataset: Dataset;
  readonly onFinished: (wasAborted: boolean) => void;
}): JSX.Element {
  if (!dataset.uploaderstatus)
    throw new Error('Initial Wb Status object is not defined');

  const [status, setStatus] = React.useState<Status>(dataset.uploaderstatus);
  const [aborted, setAborted] = React.useState<boolean | 'failed' | 'pending'>(
    false
  );

  React.useEffect(() => {
    let destructorCalled = false;
    const fetchStatus = (): void =>
      void ajax<Status | null>(`/api/workbench/status/${dataset.id}/`, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'application/json' },
      })
        .then(({ data: status }) => {
          if (destructorCalled) return undefined;
          if (status === null)
            handleFinished(aborted === 'pending' || aborted === true);
          else {
            setStatus(status);
            globalThis.setTimeout(fetchStatus, REFRESH_RATE);
          }
          return undefined;
        })
        .catch(softFail);
    fetchStatus();
    return (): void => {
      destructorCalled = true;
    };
  }, [aborted, dataset.id]);

  const title = {
    validating: wbText.wbStatusValidation(),
    uploading: wbText.wbStatusUpload(),
    unuploading: wbText.wbStatusUnupload(),
  }[status.uploaderstatus.operation];

  // FEATURE: display upload progress in the title if tab is not focused
  useTitle(title);

  const mappedOperation = {
    validating: wbText.validation(),
    uploading: wbText.upload(),
    unuploading: wbText.rollback(),
  }[status.uploaderstatus.operation];

  const standardizedOperation = {
    validating: wbText.validating(),
    uploading: wbText.uploading(),
    unuploading: wbText.rollingBack(),
  }[status.uploaderstatus.operation];

  if (aborted === 'failed')
    return (
      <Dialog
        buttons={commonText.close()}
        header={title}
        onClose={(): void => setAborted(false)}
      >
        {wbText.wbStatusAbortFailed({ operationName: mappedOperation })}
      </Dialog>
    );

  let message;
  const current =
    typeof status?.taskinfo === 'object' ? status.taskinfo.current : 0;
  const total =
    typeof status?.taskinfo === 'object' ? status.taskinfo?.total : 1;

  if (aborted === 'pending') message = wbText.aborting();
  else if (status.taskstatus === 'PENDING')
    message = (
      <>
        {wbText.wbStatusPendingDescription({ operationName: mappedOperation })}
        <br />
        <br />
        {wbText.wbStatusPendingSecondDescription({
          operationName: mappedOperation,
        })}
      </>
    );
  else if (status.taskstatus === 'PROGRESS') {
    if (current === total)
      message =
        status.uploaderstatus.operation === 'uploading'
          ? wbText.updatingTrees()
          : wbText.wbStatusOperationNoProgress({
              operationName: mappedOperation,
            });
    else
      message = wbText.wbStatusOperationProgress({
        operationName: standardizedOperation,
        current,
        total,
      });
  }
  // FAILED
  else
    message = (
      <>
        {wbText.wbStatusError({ operationName: mappedOperation })}
        <pre>{JSON.stringify(status, null, 2)}</pre>
      </>
    );

  return (
    <Dialog
      buttons={
        aborted === false ? (
          <Button.Red
            onClick={(): void => {
              setAborted('pending');
              ajax<'not running' | 'ok'>(
                `/api/workbench/abort/${dataset.id}/`,
                { method: 'POST', headers: { Accept: 'application/json' } },
                {
                  expectedResponseCodes: [Http.UNAVAILABLE, Http.OK],
                  strict: false,
                }
              )
                .then(({ data, status }) =>
                  status === Http.OK && ['ok', 'not running'].includes(data)
                    ? setAborted(true)
                    : error('Invalid WbStatus response', { status, data })
                )
                .catch(() => setAborted('failed'));
            }}
          >
            {wbText.stop()}
          </Button.Red>
        ) : undefined
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={title}
      onClose={undefined}
    >
      <Label.Block aria-atomic aria-live="polite">
        {message}
        {status.taskstatus === 'PROGRESS' && (
          <Progress max={total} value={current} />
        )}
        <RemainingLoadingTime current={current} total={total} />
      </Label.Block>
    </Dialog>
  );
}
