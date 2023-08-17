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
import { commonText } from '../../localization/common';

const statusLocalization = {
  FAILED: mergingText.mergeFailed(),
  SUCCESS: mergingText.mergeSucceeded(),
  PENDING: mergingText.mergePending(),
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

  const percentage = Math.round((state.current / state.total) * 100);

  return (
    <Dialog
      buttons={
        state.status === 'SUCCESS' ? (
          <Button.Danger onClick={handleClose}>
            {commonText.close()}
          </Button.Danger>
        ) : (
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
        )
      }
      className={{ container: dialogClassNames.narrowContainer }}
      dimensionsKey="merging-progress"
      header={statusLocalization[state.status]}
      onClose={undefined}
    >
      <Label.Block aria-atomic aria-live="polite" className="gap-2">
        <div className="flex flex-col gap-2">
          {state.status === 'MERGING' && (
            <>
              <Progress max={state.total} value={state.current} />
              <p>{percentage}%</p>
            </>
          )}
        </div>
      </Label.Block>
    </Dialog>
  );
}
