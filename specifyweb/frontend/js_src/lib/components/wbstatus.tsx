import $ from 'jquery';
import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import commonText from '../localization/common';
import wbText from '../localization/workbench';
import { ModalDialog, ProgressBar } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { Dataset, Status } from './wbplanview';

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

function WbStatus({ dataset, onFinished: handleFinished }: Props): JSX.Element {
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
      void $.get(`/api/workbench/status/${dataset.id}/`).done(
        (status: Status | null) => {
          if (destructorCalled) return;
          if (status === null)
            handleFinished(
              state.aborted === 'pending' || state.aborted === true
            );
          else {
            dispatch({ type: 'RefreshStatusAction', status });
            setTimeout(fetchStatus, REFRESH_RATE);
          }
        }
      );
    fetchStatus();
    return (): void => {
      destructorCalled = true;
    };
  }, [state.aborted, dataset.id, handleFinished]);

  const title = {
    validating: wbText('wbStatusValidationDialogTitle'),
    uploading: wbText('wbStatusUploadDialogTitle'),
    unuploading: wbText('wbStatusUnuploadDialogTitle'),
  }[state.status.uploaderstatus.operation];

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
      <ModalDialog
        properties={{
          title,
          close: (): void => dispatch({ type: 'AbortAction', aborted: false }),
        }}
      >
        {wbText('wbStatusAbortFailed')(mappedOperation)}
      </ModalDialog>
    );

  let message;
  const current =
    typeof state.status?.taskinfo === 'object'
      ? state.status.taskinfo.current
      : false;
  const total =
    typeof state.status?.taskinfo === 'object'
      ? state.status.taskinfo?.total
      : 1;

  if (state.aborted === 'pending') message = wbText('aborting');
  else if (state.status.taskstatus === 'PENDING')
    message = wbText('wbStatusPendingDialogMessage')(mappedOperation);
  else if (state.status.taskstatus === 'PROGRESS') {
    if (current === total)
      message =
        state.status.uploaderstatus.operation === 'uploading'
          ? wbText('updatingTrees')
          : wbText('wbStatusOperationNoProgress')(mappedOperation);
    else
      message = wbText('wbStatusOperationProgress')(
        standartalizedOperation,
        current || 0,
        total
      );
  } else
    message = wbText('wbStatusErrorDialogMessage')(
      // FAILED
      mappedOperation,
      JSON.stringify(state.status)
    );

  return (
    <ModalDialog
      properties={{
        title,
        dialogClass: 'ui-dialog-no-close',
        buttons:
          state.aborted === false
            ? [
                {
                  text: commonText('stop'),
                  click: (): void => {
                    dispatch({
                      type: 'AbortAction',
                      aborted: 'pending',
                    });
                    $.post(`/api/workbench/abort/${dataset.id}/`)
                      .done(() =>
                        dispatch({
                          type: 'AbortAction',
                          aborted: true,
                        })
                      )
                      .fail((jqXHR) => {
                        if (jqXHR.status !== 503) return;
                        // @ts-expect-error
                        jqXHR.errorHandled = true;
                        dispatch({
                          type: 'AbortAction',
                          aborted: 'failed',
                        });
                      });
                  },
                },
              ]
            : [],
      }}
    >
      <div aria-live="polite">
        {message}
        {state.status.taskstatus === 'PROGRESS' && (
          <ProgressBar current={current} total={total} />
        )}
      </div>
    </ModalDialog>
  );
}

type Props = {
  readonly dataset: Dataset;
  readonly onFinished: (wasAborted: boolean) => void;
};

export default createBackboneView<Props>({
  moduleName: 'WbStatus',
  className: 'wb-status',
  component: WbStatus,
});
