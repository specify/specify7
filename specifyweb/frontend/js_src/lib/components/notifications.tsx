import '../../css/notifications.css';

import React from 'react';

import ajax, { formData } from '../ajax';
import commonText from '../localization/common';
import { ModalDialog } from './modaldialog';
import type { IR, RA } from './wbplanview';

const INITIAL_INTERVAL = 5000;
const INTERVAL_MULTIPLIER = 1.1;

type Notification = {
  readonly message_id: string;
  readonly read: boolean;
  readonly timestamp: string;
  readonly type: string;
  readonly payload: IR<string>;
};

export default function Notifications(): JSX.Element {
  const [notifications, setNotifications] = React.useState<
    RA<Notification> | undefined
  >(undefined);

  // Close the dialog when all notifications get dismissed
  const notificationCount = notifications?.length ?? 0;
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (notificationCount === 0) setIsOpen(false);
  }, [notificationCount]);

  React.useEffect(() => {
    let pullInterval = INITIAL_INTERVAL;
    const handler = (): void => {
      pullInterval = INITIAL_INTERVAL;
      window.clearTimeout(timeout);
      doFetch();
    };
    document.addEventListener('visibilitychange', handler);

    let timeout: number | undefined = undefined;
    function doFetch(): void {
      /*
       * Poll interval is scaled exponentially to
       * reduce requests if the tab is left open.
       */
      pullInterval *= INTERVAL_MULTIPLIER;

      fetch(`/notifications/messages/`)
        .then<RA<Omit<Notification, 'payload'>>>(async (response) =>
          response.json()
        )
        .then((notifications) => {
          if (destructorCalled) return;
          setNotifications(
            notifications.map(
              ({ message_id, read, timestamp, type, ...rest }) => ({
                message_id,
                read,
                timestamp,
                type,
                payload: rest as IR<string>,
              })
            )
          );
          // Stop updating if tab is hidden
          timeout =
            document.visibilityState === 'hidden'
              ? undefined
              : window.setTimeout(doFetch, pullInterval);
        })
        .catch(() => {
          /* Ignore */
        });
    }

    doFetch();

    let destructorCalled = false;
    return (): void => {
      document.removeEventListener('visibilitychange', handler);
      destructorCalled = true;
      window.clearTimeout(timeout);
    };
  }, [isOpen]);

  const hasUnread = notifications?.some(({ read }) => !read) ?? false;
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <button
        id="site-notifications"
        className={`magic-button ${hasUnread ? 'unread-notifications' : ''}`}
        disabled={notificationCount === 0}
        aria-live="polite"
        type="button"
        onClick={(): void => setIsOpen((isOpen) => !isOpen)}
        ref={buttonRef}
      >
        {commonText('notifications')(notifications?.length ?? '...')}
      </button>
      {typeof notifications !== 'undefined' && isOpen && (
        <ModalDialog
          className="notifications-container"
          properties={{
            title: commonText('notificationsDialogTitle'),
            maxHeight: 400,
            position: {
              my: 'center top',
              at: 'center bottom',
              of: buttonRef.current,
            },
            buttons: [],
            close: (): void => {
              setIsOpen(false);
              setNotifications(
                notifications.map((notification) => ({
                  ...notification,
                  read: true,
                }))
              );
              if (notifications.length > 0)
                void ajax('/notifications/mark_read/', {
                  method: 'POST',
                  body: formData({
                    last_seen: notifications.slice(-1)[0].timestamp,
                  }),
                });
            },
          }}
        >
          {notifications.map((notification, index) => (
            <NotificationComponent
              key={index}
              notification={notification}
              onDelete={(): void =>
                setNotifications(
                  notifications.filter((item) => item !== notification)
                )
              }
            />
          ))}
        </ModalDialog>
      )}
    </>
  );
}

function NotificationComponent({
  notification,
  onDelete: handleDelete,
}: {
  readonly notification: Notification;
  readonly onDelete: () => void;
}): JSX.Element {
  const date = new Date(notification.timestamp);
  const formatted = new Intl.DateTimeFormat([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
  return (
    <article className={notification.read ? 'unread-notification' : undefined}>
      <header>
        <time dateTime={date.toISOString()}>{formatted}</time>
        <button
          className="ui-icon ui-icon-trash fake-link"
          type="button"
          onClick={(): void => {
            void ajax('/notifications/delete/', {
              method: 'POST',
              body: formData({ message_id: notification.message_id }),
            });
            handleDelete();
          }}
        >
          {commonText('delete')}
        </button>
      </header>
      <p>
        {(
          notificationRenderers[notification.type] ??
          notificationRenderers.default
        )(notification)}
      </p>
    </article>
  );
}

const notificationRenderers: IR<
  (notification: Notification) => React.ReactNode
> = {
  'feed-item-updated'(notification) {
    const filename = notification.payload.file;
    return (
      <>
        {commonText('feedItemUpdated')}{' '}
        <a download href={`/static/depository/export_feed/${filename}`}>
          {filename}
        </a>
      </>
    );
  },
  'update-feed-failed'(notification) {
    return (
      <>
        {commonText('updateFeedFailed')}{' '}
        <a
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </a>
      </>
    );
  },
  'dwca-export-complete'(notification) {
    return (
      <>
        {commonText('dwcaExportCompleted')}{' '}
        <a download href={`/static/depository/${notification.payload.file}`}>
          {commonText('download')}
        </a>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {commonText('dwcaExportFailed')}{' '}
        <a
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </a>
      </>
    );
  },
  'query-export-to-csv-complete'(notification) {
    return (
      <>
        {commonText('queryExportToCsvCompleted')}{' '}
        <a download href={`/static/depository/${notification.payload.file}`}>
          {commonText('download')}
        </a>
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {commonText('queryExportToKmlCompleted')}{' '}
        <a download href={`/static/depository/${notification.payload.file}`}>
          {commonText('download')}
        </a>
      </>
    );
  },
  'dataset-ownership-transferred'(notification) {
    return commonText('dataSetOwnershipTransferred')(
      <i>{notification.payload['previous-owner-name']}</i>,
      <a href={`/specify/workbench/${notification.payload['dataset-id']}/`}>
        <i>{notification.payload['dataset-name']}</i>
      </a>
    );
  },
  default(notification) {
    console.error(`Unknown notification type ${notification.type}`);
    console.warn(notification);
    return <pre>{JSON.stringify(notification, null, 4)}</pre>;
  },
};
