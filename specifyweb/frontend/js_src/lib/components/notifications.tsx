import React from 'react';

import { ajax, formData, ping } from '../ajax';
import { f } from '../functools';
import { commonText } from '../localization/common';
import type { IR, RA } from '../types';
import { Button, className, Link } from './basic';
import { useBooleanState } from './hooks';
import { icons } from './icons';
import { DateElement, formatNumber } from './internationalization';
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

  const notificationCount = notifications?.length ?? 0;
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  const deletingPromise = React.useRef<Promise<void> | undefined>(undefined);

  // Close the dialog when all notifications get dismissed
  React.useEffect(() => {
    if (notificationCount === 0) handleClose();
  }, [notificationCount, handleClose]);

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
       * Poll interval is scaled exponentially to reduce requests if the tab is
       * left open.
       */
      pullInterval *= INTERVAL_MULTIPLIER;

      // Don't fetch while a message is being deleted
      (deletingPromise.current ?? Promise.resolve())
        .then(async () =>
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
            /*
             * Don't show modal error dialog on errors. Several reasons why:
             *  - Request may fail if Django migrations weren't run
             *  - Request is initialized automatically, not by user, thus having
             *    an error dialog appear out of blue could be confusing/unexpected
             *  - Notifications is not a critical component, so if it fails, it
             *    shouldn't bring down entire application
             */
            { strict: false }
          )
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
      <Button.Small
        className={`${hasUnread ? 'bg-brand-300 dark:bg-brand-400' : ''}`}
        disabled={notificationCount === 0}
        aria-live="polite"
        onClick={handleToggle}
        forwardRef={buttonRef}
      >
        {commonText(
          'notifications',
          typeof notifications?.length === 'number'
            ? formatNumber(notifications.length)
            : '...'
        )}
      </Button.Small>
      {Array.isArray(notifications) && (
        <Dialog
          isOpen={isOpen}
          header={commonText('notificationsDialogTitle')}
          onClose={(): void => {
            handleClose();
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
            content: `${dialogClassNames.flexContent} gap-y-3 divide-y divide-gray-500`,
          }}
        >
          {notifications.map((notification, index) => (
            <NotificationComponent
              key={index}
              notification={notification}
              onDelete={(promise): void => {
                deletingPromise.current = promise;
                setNotifications(
                  notifications.filter((item) => item !== notification)
                );
              }}
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
  readonly onDelete: (promise: Promise<void>) => void;
}): JSX.Element {
  return (
    <article className="flex gap-2 pt-2">
      <span
        className={
          notification.read
            ? undefined
            : 'w-3 h-3 mt-1.5 bg-blue-500 rounded-full'
        }
      />
      <div className="flex flex-col gap-2">
        <p>
          {
            // TODO: close the dialog when link is clicked
            (
              notificationRenderers[notification.type] ??
              notificationRenderers.default
            )(notification)
          }
        </p>
        <span className="text-gray-500">
          <DateElement date={notification.timestamp} />
        </span>
      </div>
      <Button.Small
        variant={className.redButton}
        title={commonText('delete')}
        aria-label={commonText('delete')}
        onClick={(): void =>
          handleDelete(
            ping(
              '/notifications/delete/',
              {
                method: 'POST',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                body: formData({ message_id: notification.messageId }),
              },
              { strict: false }
            ).then(f.void)
          )
        }
      >
        {icons.x}
      </Button.Small>
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
    return commonText(
      'dataSetOwnershipTransferred',
      <i>{notification.payload['previous-owner-name']}</i>,
      <Link.Default
        href={`/specify/workbench/${notification.payload['dataset-id']}/`}
      >
        <i>{notification.payload['dataset-name']}</i>
      </Link.Default>
    );
  },
  default(notification) {
    console.error('Unknown notification type', { notification });
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};
