/**
 * Reports Data Set status using a modal dialog (uploading, validating, rolling
 * back, failure, success)
 */

import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import { ajax, Http } from '../ajax';
import { commonText } from '../localization/common';
import { wbText } from '../localization/workbench';
import { Button, Label, Progress } from './basic';
import { useTitle } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import type { Dataset, Status } from './wbplanview';
import { error } from '../assert';
import { softFail } from './errorboundary';

// How often to query back-end
const REFRESH_RATE = 2000;

type MainState = State<
  'MainState',
  {
    status: Status;
    aborted: boolean | 'pending' | 'failed';
  }
>;

type States = MainState;

type RefreshStatusAction = Action<'RefreshStatusAction', { status: Status }>;

type AbortAction = Action<
  'AbortAction',
  { aborted: boolean | 'pending' | 'failed' }
>;

type Actions = RefreshStatusAction | AbortAction;

const reducer = generateReducer<States, Actions>({
  RefreshStatusAction: ({ state, action }) => ({
    ...state,
    status: action.status,
  }),
  AbortAction: ({ state, action }) => ({
    ...state,
    aborted: action.aborted,
  }),
});

export function WbStatus({
  dataset,
  onFinished: handleFinished,
}: {
  readonly dataset: Dataset;
  readonly onFinished: (wasAborted: boolean) => void;
}): JSX.Element {
  if (!dataset.uploaderstatus)
    throw new Error('Initial Wb Status object is not defined');

  const [state, dispatch] = React.useReducer(reducer, {
    type: 'MainState',
    status: dataset.uploaderstatus,
    aborted: false,
  });

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
            handleFinished(
              state.aborted === 'pending' || state.aborted === true
            );
          else {
            dispatch({ type: 'RefreshStatusAction', status });
            globalThis.setTimeout(fetchStatus, REFRESH_RATE);
          }
          return undefined;
        })
        .catch(softFail);
    fetchStatus();
    return (): void => {
      destructorCalled = true;
    };
  }, [state.aborted, dataset.id]);

  const title = {
    validating: wbText('wbStatusValidationDialogTitle'),
    uploading: wbText('wbStatusUploadDialogTitle'),
    unuploading: wbText('wbStatusUnuploadDialogTitle'),
  }[state.status.uploaderstatus.operation];

  // FEATURE: display upload progress in the title if tab is not focused
  useTitle(title);

  const mappedOperation = {
    validating: wbText('validation'),
    uploading: wbText('upload'),
    unuploading: wbText('rollback'),
  }[state.status.uploaderstatus.operation];

  const standartalizedOperation = {
    validating: wbText('validating'),
    uploading: wbText('uploading'),
    unuploading: wbText('rollingBack'),
  }[state.status.uploaderstatus.operation];

  if (state.aborted === 'failed')
    return (
      <Dialog
        header={title}
        onClose={(): void => dispatch({ type: 'AbortAction', aborted: false })}
        buttons={commonText('close')}
      >
        {wbText('wbStatusAbortFailed', mappedOperation)}
      </Dialog>
    );

  let message;
  const current =
    typeof state.status?.taskinfo === 'object'
      ? state.status.taskinfo.current
      : 0;
  const total =
    typeof state.status?.taskinfo === 'object'
      ? state.status.taskinfo?.total
      : 1;

  if (state.aborted === 'pending') message = wbText('aborting');
  else if (state.status.taskstatus === 'PENDING')
    message = wbText('wbStatusPendingDialogText', mappedOperation);
  else if (state.status.taskstatus === 'PROGRESS') {
    if (current === total)
      message =
        state.status.uploaderstatus.operation === 'uploading'
          ? wbText('updatingTrees')
          : wbText('wbStatusOperationNoProgress', mappedOperation);
    else
      message = wbText(
        'wbStatusOperationProgress',
        standartalizedOperation,
        current,
        total
      );
  }
  // FAILED
  else
    message = (
      <>
        {wbText('wbStatusErrorDialogText', mappedOperation)}
        <pre>{JSON.stringify(state.status, null, 2)}</pre>
      </>
    );

  return (
    <Dialog
      header={title}
      buttons={
        state.aborted === false ? (
          <Button.Red
            onClick={(): void => {
              dispatch({
                type: 'AbortAction',
                aborted: 'pending',
              });
              ajax<'ok' | 'not running'>(
                `/api/workbench/abort/${dataset.id}/`,
                { method: 'POST', headers: { Accept: 'application/json' } },
                {
                  expectedResponseCodes: [Http.UNAVAILABLE, Http.OK],
                  strict: false,
                }
              )
                .then(({ data, status }) =>
                  status === Http.OK && ['ok', 'not running'].includes(data)
                    ? dispatch({
                        type: 'AbortAction',
                        aborted: true,
                      })
                    : error('Invalid response')
                )
                .catch(() => {
                  dispatch({
                    type: 'AbortAction',
                    aborted: 'failed',
                  });
                });
            }}
          >
            {commonText('stop')}
          </Button.Red>
        ) : undefined
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      onClose={undefined}
    >
      <Label.Generic aria-live="polite" aria-atomic={true}>
        {message}
        {state.status.taskstatus === 'PROGRESS' && (
          <Progress value={current} max={total} />
        )}
      </Label.Generic>
    </Dialog>
  );
}
