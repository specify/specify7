import React from 'react';

import ajax, { formData } from '../ajax';
import commonText from '../localization/common';
import type { IR, RA } from '../types';
import { Button, ButtonLikeLink, Link } from './basic';
import { formatNumber } from './internationalization';
import { JqueryDialog } from './modaldialog';

const INITIAL_INTERVAL = 5000;
const INTERVAL_MULTIPLIER = 1.1;

type Notification = {
  readonly messageId: string;
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
      window.clearTimeout(timeout);
      pullInterval = INITIAL_INTERVAL;
      if (document.visibilityState === 'visible') doFetch();
    };
    document.addEventListener('visibilitychange', handler);

    let timeout: number | undefined = undefined;

    function doFetch(): void {
      /*
       * Poll interval is scaled exponentially to
       * reduce requests if the tab is left open.
       */
      pullInterval *= INTERVAL_MULTIPLIER;

      void ajax<
        RA<
          Omit<Notification, 'payload' | 'messageId'> & {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            readonly message_id: string;
          }
        >
      >(
        `/notifications/messages/`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Accept: 'application/json' } },
        { strict: false }
      ).then(({ data: notifications }) => {
        if (destructorCalled) return undefined;
        setNotifications(
          notifications.map(
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ({ message_id, read, timestamp, type, ...rest }) => ({
              messageId: message_id,
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
        return undefined;
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
      <Button
        className={`${hasUnread ? 'bg-brand-300' : ''}`}
        disabled={notificationCount === 0}
        aria-live="polite"
        onClick={(): void => setIsOpen((isOpen) => !isOpen)}
        ref={buttonRef}
      >
        {commonText('notifications')(
          typeof notifications?.length === 'number'
            ? formatNumber(notifications.length)
            : '...'
        )}
      </Button>
      {typeof notifications !== 'undefined' && isOpen && (
        <JqueryDialog
          className="gap-y-2 flex flex-col -mt-1 divide-y divide-gray-400"
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
                void ajax(
                  '/notifications/mark_read/',
                  {
                    method: 'POST',
                    body: formData({
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      last_seen: notifications.slice(-1)[0].timestamp,
                    }),
                  },
                  { strict: false }
                );
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
        </JqueryDialog>
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
    <article className="flex flex-col pt-1">
      <header className="flex justify-between">
        <span className={notification.read ? undefined : 'bg-amber-100'}>
          <time dateTime={date.toISOString()}>{formatted}</time>
        </span>
        <ButtonLikeLink
          className="ui-icon ui-icon-trash"
          onClick={(): void => {
            void ajax(
              '/notifications/delete/',
              {
                method: 'POST',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                body: formData({ message_id: notification.messageId }),
              },
              { strict: false }
            );
            handleDelete();
          }}
        >
          {commonText('delete')}
        </ButtonLikeLink>
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
        <Link download href={`/static/depository/export_feed/${filename}`}>
          {filename}
        </Link>
      </>
    );
  },
  'update-feed-failed'(notification) {
    return (
      <>
        {commonText('updateFeedFailed')}{' '}
        <Link
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link>
      </>
    );
  },
  'dwca-export-complete'(notification) {
    return (
      <>
        {commonText('dwcaExportCompleted')}{' '}
        <Link download href={`/static/depository/${notification.payload.file}`}>
          {commonText('download')}
        </Link>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {commonText('dwcaExportFailed')}{' '}
        <Link
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link>
      </>
    );
  },
  'query-export-to-csv-complete'(notification) {
    return (
      <>
        {commonText('queryExportToCsvCompleted')}{' '}
        <Link download href={`/static/depository/${notification.payload.file}`}>
          {commonText('download')}
        </Link>
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {commonText('queryExportToKmlCompleted')}{' '}
        <Link download href={`/static/depository/${notification.payload.file}`}>
          {commonText('download')}
        </Link>
      </>
    );
  },
  'dataset-ownership-transferred'(notification) {
    return commonText('dataSetOwnershipTransferred')(
      <i>{notification.payload['previous-owner-name']}</i>,
      <Link
        href={`/specify/workbench/${notification.payload['dataset-id']}/`}
        className="intercept-navigation"
      >
        <i>{notification.payload['dataset-name']}</i>
      </Link>
    );
  },
  default(notification) {
    console.error(`Unknown notification type ${notification.type}`);
    console.warn(notification);
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};
