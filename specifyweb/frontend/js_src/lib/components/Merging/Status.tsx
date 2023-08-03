import React from 'react';
import { MergeStatus, StatusState, initialStatusState } from './types';
import { ajax } from '../../utils/ajax';
import { MILLISECONDS } from '../Atoms/timeUnits';
import { softFail } from '../Errors/Crash';
import { LoadingContext } from '../Core/Contexts';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { ping } from '../../utils/ajax/ping';
import { mergingText } from '../../localization/merging';
import { Label } from '../Atoms/Form';
import { Progress } from '../Atoms';
import { RemainingLoadingTime } from '../WorkBench/RemainingLoadingTime';

const statusLocalization = {
  FAILED: mergingText.failed(),
  SUCCESS: mergingText.success(),
  PENDING: mergingText.pending(),
  MERGING: mergingText.merging(),
};

export function Status({
  mergingId,
  handleClose,
}: {
  readonly mergingId: string;
  readonly handleClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<StatusState>(initialStatusState);

  React.useEffect(() => {
    let destructorCalled = false;
    const fetchStatus = () =>
      void ajax<{
        readonly taskstatus: MergeStatus;
        readonly taskprogress: {
          readonly total: number;
          readonly current: number;
        };
        readonly taskid: string;
      }>(`/api/specify/merge/status/${mergingId}/`, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'application/json' },
      })
        .then(
          ({
            data: { taskstatus: taskStatus, taskprogress: taskProgress },
          }) => {
            setState({
              status: taskStatus,
              total: taskProgress.total,
              current: taskProgress.current,
            });
            if (!destructorCalled)
              globalThis.setTimeout(fetchStatus, 2 * MILLISECONDS);
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

  return (
    <Dialog
      buttons={
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
          {mergingText.abort()}
        </Button.Danger>
      }
      className={{ container: dialogClassNames.narrowContainer }}
      dimensionsKey="merging-progress"
      header={mergingText.mergeRecords()}
      onClose={undefined}
    >
      <Label.Block aria-atomic aria-live="polite" className="gap-2">
        <div className="flex gap-2">
          {statusLocalization[state.status]}
          {state.status === 'MERGING' && (
            <p>
              {state.current}
              {'/'}
              {state.total}
            </p>
          )}
        </div>
        {state.status === 'MERGING' && (
          <>
            <Progress max={state.total} value={state.current} />
            <RemainingLoadingTime current={state.current} total={state.total} />
          </>
        )}
      </Label.Block>
    </Dialog>
  );
}
