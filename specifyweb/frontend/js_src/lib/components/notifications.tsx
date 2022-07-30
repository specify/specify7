import React from 'react';

import { ajax, formData, ping } from '../ajax';
import { f } from '../functools';
import { sortFunction } from '../helpers';
import { commonText } from '../localization/common';
import type { IR, RA } from '../types';
import { Button, Link } from './basic';
import { ErrorBoundary } from './errorboundary';
import { useBooleanState } from './hooks';
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
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const freezeFetchPromise = React.useRef<Promise<void> | undefined>(undefined);

  // Close the dialog when all notifications get dismissed
  React.useEffect(() => {
    if (notificationCount === 0) handleClose();
  }, [notificationCount, handleClose]);

  React.useEffect(() => {
    let pullInterval = INITIAL_INTERVAL;
    const handler = (): void => {
      if (timeout !== undefined) globalThis.clearTimeout(timeout);
      pullInterval = INITIAL_INTERVAL;
      if (document.visibilityState === 'visible') doFetch();
    };
    document.addEventListener('visibilitychange', handler);

    let timeout: NodeJS.Timeout | undefined = undefined;

    function doFetch(): void {
      /*
       * Poll interval is scaled exponentially to reduce requests if the tab is
       * left open.
       */
      pullInterval *= INTERVAL_MULTIPLIER;

      // Don't fetch while a message is being deleted or marked as read
      (freezeFetchPromise.current ?? Promise.resolve())
        .then(async () =>
          ajax<
            RA<
              Omit<Notification, 'messageId' | 'payload'> & {
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
            notifications
              .map(
                // eslint-disable-next-line @typescript-eslint/naming-convention
                ({ message_id, read, timestamp, type, ...rest }) => ({
                  messageId: message_id,
                  read,
                  timestamp,
                  type,
                  payload: rest as IR<string>,
                })
              )
              // Make most recent notification first
              .sort(
                sortFunction(
                  ({ timestamp }) => new Date(timestamp).getTime(),
                  true
                )
              )
          );
          // Stop updating if tab is hidden
          timeout =
            document.visibilityState === 'hidden'
              ? undefined
              : globalThis.setTimeout(doFetch, pullInterval);
          return undefined;
        })
        .catch(console.error);
    }

    doFetch();

    let destructorCalled = false;
    return (): void => {
      document.removeEventListener('visibilitychange', handler);
      destructorCalled = true;
      if (timeout !== undefined) globalThis.clearTimeout(timeout);
    };
  }, [isOpen]);

  const hasUnread = notifications?.some(({ read }) => !read) ?? false;
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <Button.Small
        aria-live="polite"
        className={`${hasUnread ? 'bg-brand-300 dark:bg-brand-400' : ''}`}
        disabled={notificationCount === 0}
        forwardRef={buttonRef}
        onClick={handleOpen}
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
          buttons={commonText('close')}
          className={{
            container: `${dialogClassNames.narrowContainer} min-w-[50%]`,
            content: `${dialogClassNames.flexContent} gap-3 divide-y divide-gray-500`,
          }}
          header={commonText('notificationsDialogTitle')}
          isOpen={isOpen}
          onClose={(): void => {
            handleClose();
            setNotifications(
              notifications.map((notification) => ({
                ...notification,
                read: true,
              }))
            );
            if (notifications.length > 0)
              freezeFetchPromise.current = ping(
                '/notifications/mark_read/',
                {
                  method: 'POST',
                  body: formData({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_seen: notifications.at(-1)!.timestamp,
                  }),
                },
                { strict: false }
              ).then(() => undefined);
          }}
        >
          {/*
           * This message was needed due to date creation for all dates being
           * makes as "now" due to this bug:
           * https://github.com/specify/specify7/issues/641
           * After it is fixed, this message can be removed
           */}
          <p>{commonText('mostRecentNotificationsTop')}</p>
          {notifications.map((notification, index) => (
            <ErrorBoundary dismissable>
              <NotificationComponent
                key={index}
                notification={notification}
                onDelete={(promise): void => {
                  freezeFetchPromise.current = promise;
                  setNotifications(
                    notifications.filter((item) => item !== notification)
                  );
                }}
              />
            </ErrorBoundary>
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
    <article className="flex flex-col gap-2 pt-2">
      <div className="flex gap-2">
        {!notification.read && (
          <span className="mt-1.5 h-3 w-3 rounded-full bg-blue-500" />
        )}
        <span className="text-gray-500">
          <DateElement date={notification.timestamp} />
        </span>
        <span className="-ml-2 flex-1" />
        <Button.Icon
          icon="x"
          title={commonText('delete')}
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
        />
      </div>
      <div className="flex flex-col gap-2">
        {
          /*
           * BUG: when clicking on a dataset link in dataset transferred
           *   notification, the dialog does not close. Need to fix that. But,
           *   the dialog should still remain open when clicking on a new tab
           *   link
           */
          (
            notificationRenderers[notification.type] ??
            notificationRenderers.default
          )(notification)
        }
      </div>
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
        {commonText('feedItemUpdated')}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/export_feed/${filename}`}
        >
          {filename}
        </Link.Green>
      </>
    );
  },
  'update-feed-failed'(notification) {
    return (
      <>
        {commonText('updateFeedFailed')}
        <Link.Green
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link.Green>
      </>
    );
  },
  'dwca-export-complete'(notification) {
    return (
      <>
        {commonText('dwcaExportCompleted')}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Green>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {commonText('dwcaExportFailed')}
        <Link.Green
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link.Green>
      </>
    );
  },
  'query-export-to-csv-complete'(notification) {
    return (
      <>
        {commonText('queryExportToCsvCompleted')}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Green>
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {commonText('queryExportToKmlCompleted')}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Green>
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
