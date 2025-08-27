/**
 * Prompt the user to confirm a database backup.
 * When confirmed, it redirects to the backup endpoint.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { backupText } from '../../localization/backup';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { notificationsText } from '../../localization/notifications';
import { ajax } from '../../utils/ajax';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';

type BackupInfo = {
  readonly exists: boolean;
  readonly url?: string;
  readonly filename?: string;
  readonly size?: number;
  readonly last_modified?: string;
};

export function BackupDatabaseOverlay(): JSX.Element | null {
  const handleClose = React.useContext(OverlayContext);
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [previous, setPrevious] = React.useState<BackupInfo>({ exists: false });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await ajax<BackupInfo>('/api/backup/previous/', {
          headers: { Accept: 'application/json' },
        });
        if (mounted) setPrevious(data);
      } catch {
        if (mounted) setError(String(backupText.checkPreviousFailed()));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const startNewBackup = async () => {
    try {
      const { data } = await ajax<{ readonly taskid: string }>(
        '/api/backup/start/',
        { method: 'POST', headers: { Accept: 'application/json' } }
      );
      navigate(`/specify/overlay/backup-status/${data.taskid}/`);
    } catch {
      setError(String(backupText.startFailed()));
    }
  };

  return (
    <Dialog
      buttons={
        <>
          {previous.exists && (
            <Button.Info
              onClick={() => {
                if (previous.url) window.location.href = previous.url;
              }}
            >
              {notificationsText.download()}
            </Button.Info>
          )}
          <span className="-ml-2 flex-1" />
          <Button.Info onClick={startNewBackup}>{commonText.new()}</Button.Info>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={headerText.backupDatabase()}
      icon={icons.database}
      onClose={handleClose}
    >
      {loading ? (
        <p>{commonText.loading()}</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : previous.exists ? (
        <p>
          {backupText.previousFound()} <b>{previous.filename}</b>{' '}
          {typeof previous.size === 'number'
            ? backupText.previousSizeMB({
                size: (previous.size / 1000 ** 2).toFixed(2),
              })
            : ''}
          <br />
          {previous.last_modified
            ? backupText.lastBackupOn({
                date: previous.last_modified.slice(0, 10),
              })
            : ''}
        </p>
      ) : (
        <p>{backupText.previousNone()}</p>
      )}
    </Dialog>
  );
}
