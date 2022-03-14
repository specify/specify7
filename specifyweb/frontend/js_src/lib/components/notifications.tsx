import React from 'react';

import { ajax, formData, ping } from '../ajax';
import commonText from '../localization/common';
import type { IR, RA } from '../types';
import { Button, Link } from './basic';
import { formatNumber } from './internationalization';
import { Dialog, dialogClassNames } from './modaldialog';

const INITIAL_INTERVAL = 5000;
const INTERVAL_MULTIPLIER = 1.1;

type Notification = {
  readonly messageId: string;
  readonly read: boolean;
  readonly timestamp: string;
  readonly type: string;
  readonly payload: IR<string>;
};

export function Notifications(): JSX.Element {
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

      ajax<
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
      )
        .then(({ data: notifications }) => {
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
        })
        .catch(console.error);
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
      <Button.Simple
        className={`${hasUnread ? 'bg-brand-300 dark:bg-brand-400' : ''}`}
        disabled={notificationCount === 0}
        aria-live="polite"
        onClick={(): void => setIsOpen((isOpen) => !isOpen)}
        forwardRef={buttonRef}
      >
        {commonText('notifications')(
          typeof notifications?.length === 'number'
            ? formatNumber(notifications.length)
            : '...'
        )}
      </Button.Simple>
      {Array.isArray(notifications) && (
        <Dialog
          isOpen={isOpen}
          header={commonText('notificationsDialogTitle')}
          onClose={(): void => {
            setIsOpen(false);
            setNotifications(
              notifications.map((notification) => ({
                ...notification,
                read: true,
              }))
            );
            if (notifications.length > 0)
              void ping(
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
          }}
          buttons={commonText('close')}
          className={{
            container: dialogClassNames.narrowContainer,
            content: `${dialogClassNames.flexContent} gap-y-3 -mt-1 divide-y divide-gray-400`,
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
        </Dialog>
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
    <article className="flex flex-col pt-2">
      <header className="flex justify-between">
        <span
          className={
            notification.read
              ? undefined
              : 'bg-amber-100 dark:bg-amber-900 rounded'
          }
        >
          <time dateTime={date.toISOString()}>{formatted}</time>
        </span>
        <Button.Icon
          icon="trash"
          title={commonText('delete')}
          aria-label={commonText('delete')}
          onClick={(): void => {
            void ping(
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
        />
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
        <Link.Default
          download
          href={`/static/depository/export_feed/${filename}`}
        >
          {filename}
        </Link.Default>
      </>
    );
  },
  'update-feed-failed'(notification) {
    return (
      <>
        {commonText('updateFeedFailed')}{' '}
        <Link.Default
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link.Default>
      </>
    );
  },
  'dwca-export-complete'(notification) {
    return (
      <>
        {commonText('dwcaExportCompleted')}{' '}
        <Link.Default
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Default>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {commonText('dwcaExportFailed')}{' '}
        <Link.Default
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link.Default>
      </>
    );
  },
  'query-export-to-csv-complete'(notification) {
    return (
      <>
        {commonText('queryExportToCsvCompleted')}{' '}
        <Link.Default
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Default>
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {commonText('queryExportToKmlCompleted')}{' '}
        <Link.Default
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Default>
      </>
    );
  },
  'dataset-ownership-transferred'(notification) {
    return commonText('dataSetOwnershipTransferred')(
      <i>{notification.payload['previous-owner-name']}</i>,
      <Link.Default
        href={`/specify/workbench/${notification.payload['dataset-id']}/`}
      >
        <i>{notification.payload['dataset-name']}</i>
      </Link.Default>
    );
  },
  default(notification) {
    console.error(`Unknown notification type ${notification.type}`);
    console.warn(notification);
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};
