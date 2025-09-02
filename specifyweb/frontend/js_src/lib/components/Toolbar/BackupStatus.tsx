import React from 'react';
import { useParams } from 'react-router-dom';

import { backupText } from '../../localization/backup';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { notificationsText } from '../../localization/notifications';
import { ajax } from '../../utils/ajax';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { dialogIcons } from '../Atoms/Icons';
import { SECOND } from '../Atoms/timeUnits';
import { loadingGif } from '../Molecules';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';

type TaskStatus = 'FAILED' | 'RUNNING' | 'SUCCEEDED';

export function BackupStatus({
  taskId,
  onClose: handleClose,
}: {
  readonly taskId: string;
  readonly onClose: () => void;
}): JSX.Element {
  const [status, setStatus] = React.useState<TaskStatus>('RUNNING');
  const [total, setTotal] = React.useState(1);
  const [current, setCurrent] = React.useState(0);
  const [traceback, setTraceback] = React.useState<string | null>(null);
  const percentage = Math.round((current / total) * 100);

  React.useEffect(() => {
    let stop = false;
    const tick = () =>
      void ajax<{
        readonly taskstatus: TaskStatus;
        readonly taskprogress: {
          readonly total: number;
          readonly current: number;
        };
        readonly response?: string;
      }>(`/api/backup/status/${taskId}/`, {
        headers: { Accept: 'application/json' } as any,
      })
        .then(({ data }) => {
          setStatus(data.taskstatus);
          setTotal(Math.max(1, data.taskprogress.total));
          setCurrent(data.taskprogress.current);
          setTraceback(data.response ?? null);
          if (!stop && data.taskstatus === 'RUNNING')
            globalThis.setTimeout(tick, 2 * SECOND);
        })
        .catch(() => {
          if (!stop) globalThis.setTimeout(tick, 2 * SECOND);
        });
    tick();
    return () => {
      stop = true;
    };
  }, [taskId]);

  const isFinalizing = status === 'RUNNING' && percentage >= 100;

  return (
    <Dialog
      buttons={
        status === 'SUCCEEDED' ? (
          <div className="flex gap-2">
            <Button.Info
              onClick={() => {
                window.location.href = `/api/backup/download/${taskId}/`;
              }}
            >
              {notificationsText.download()}
            </Button.Info>
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          </div>
        ) : (
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        )
      }
      className={{ container: dialogClassNames.narrowContainer }}
      dimensionsKey="backup-progress"
      header={headerText.backupDatabase()}
      icon={status === 'SUCCEEDED' ? dialogIcons.success : dialogIcons.error}
      onClose={handleClose}
    >
      {status === 'FAILED' ? (
        <div className="flex flex-col gap-2">
          <p className="text-red-600">{backupText.failed()}</p>
          {traceback && (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">
              {traceback}
            </pre>
          )}
        </div>
      ) : status === 'SUCCEEDED' ? (
        <div className="flex flex-col gap-2">
          <p>{backupText.completed()}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {isFinalizing ? (
            <div className="flex items-center gap-2">
              {loadingGif}
              <span>{backupText.compressing()}</span>
            </div>
          ) : (
            <>
              <Progress max={total} value={current} />
              <p>{`${percentage}%`}</p>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}

export function BackupStatusOverlay(): JSX.Element | null {
  const { taskId } = useParams<{ readonly taskId: string }>();
  const handleClose = React.useContext(OverlayContext);
  if (!taskId) return null;
  return <BackupStatus taskId={taskId} onClose={handleClose} />;
}
