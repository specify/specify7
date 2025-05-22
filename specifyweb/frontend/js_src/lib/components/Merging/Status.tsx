import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import type { RR } from '../../utils/types';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Label } from '../Atoms/Form';
import { dialogIcons } from '../Atoms/Icons';
import { SECOND } from '../Atoms/timeUnits';
import { LoadingContext } from '../Core/Contexts';
import { softFail } from '../Errors/Crash';
import { produceStackTrace } from '../Errors/stackTrace';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import type { MergingStatus, StatusState } from './types';
import { initialStatusState } from './types';

const statusLocalization: RR<MergingStatus, LocalizedString> = {
  MERGING: mergingText.merging(),
  ABORTED: mergingText.mergeFailed(),
  FAILED: mergingText.mergeFailed(),
  SUCCEEDED: mergingText.mergeSucceeded(),
};

export function MergeStatus({
  mergingId,
  handleClose,
}: {
  readonly mergingId: string;
  readonly handleClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<StatusState>(initialStatusState);

  const [errorMessage, setErrorMessage] = React.useState<string>('');

  React.useEffect(() => {
    let destructorCalled = false;
    const fetchStatus = () =>
      void ajax<{
        readonly taskstatus: MergingStatus;
        readonly taskprogress: {
          readonly total: number;
          readonly current: number;
        };
        readonly taskid: string;
        readonly response: string;
      }>(`/api/specify/merge/status/${mergingId}/`, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'application/json' },
      })
        .then(
          ({
            data: {
              taskstatus: taskStatus,
              taskprogress: taskProgress,
              response: errorMessage,
            },
          }) => {
            setState({
              status: taskStatus,
              total: taskProgress.total,
              current: taskProgress.current,
            });
            if (!destructorCalled)
              globalThis.setTimeout(fetchStatus, 2 * SECOND);
            if (taskStatus === 'FAILED') {
              setErrorMessage(errorMessage);
            }
            return undefined;
          }
        )
        .catch(softFail);
    fetchStatus();
    return (): void => {
      destructorCalled = true;
    };
  }, [mergingId]);

  const loading = React.useContext(LoadingContext);

  const percentage = Math.round((state.current / state.total) * 100);

  return (
    <Dialog
      buttons={
        state.status === 'FAILED' ? (
          <>
            <Button.Info
              onClick={(): void =>
                void downloadFile(
                  `Merging ${mergingId} Crash Report - ${new Date().toJSON()}.txt`,
                  produceStackTrace(errorMessage)
                )
              }
            >
              {commonText.downloadErrorMessage()}
            </Button.Info>
            <span className="-ml-4 flex-1" />
            <Button.Danger onClick={handleClose}>
              {commonText.close()}
            </Button.Danger>
          </>
        ) : state.status === 'MERGING' ? (
          <Button.Danger
            onClick={(): void =>
              loading(
                ping(`/api/specify/merge/abort/${mergingId}/`, {
                  method: 'POST',
                })
                  .then(handleClose)
                  .catch(softFail)
              )
            }
          >
            {commonText.cancel()}
          </Button.Danger>
        ) : (
          <Button.Info onClick={handleClose}>{commonText.close()}</Button.Info>
        )
      }
      className={{ container: dialogClassNames.narrowContainer }}
      dimensionsKey="merging-progress"
      header={statusLocalization[state.status]}
      icon={
        state.status === 'SUCCEEDED' ? dialogIcons.success : dialogIcons.error
      }
      onClose={undefined}
    >
      <Label.Block aria-atomic aria-live="polite" className="gap-2">
        <div className="flex flex-col gap-2">
          {state.status === 'MERGING' && (
            <>
              <Progress max={state.total} value={state.current} />
              {percentage < 100 && <p>{`${percentage}%`}</p>}
            </>
          )}
        </div>
      </Label.Block>
      {state.status === 'FAILED' ? (
        <p>{mergingText.mergingWentWrong()}</p>
      ) : null}
    </Dialog>
  );
}
