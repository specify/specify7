import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { notificationsText } from '../../localization/notifications';
import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames, LoadingScreen } from '../Molecules/Dialog';
import { MenuButton } from './index';
import type { GenericNotification } from './NotificationRenderers';
import { notificationRenderers } from './NotificationRenderers';

const INITIAL_INTERVAL = 5000;
const INTERVAL_MULTIPLIER = 1.1;

export function Notifications({
  isCollapsed,
}: {
  readonly isCollapsed: boolean;
}): JSX.Element {
  const [notifications, setNotifications] = React.useState<
    RA<GenericNotification> | undefined
  >(undefined);

  const notificationCount = notifications?.length;
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
              Omit<GenericNotification, 'messageId' | 'payload'> & {
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
                  payload: rest as IR<LocalizedString>,
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

  const unreadCount = notifications?.filter(({ read }) => !read).length ?? 0;
  const title =
    typeof notifications?.length === 'number'
      ? notificationsText.notificationsCount({
          count: notifications.length,
        })
      : notificationsText.notificationsLoading();
  return (
    <>
      <MenuButton
        icon={icons.bell}
        isActive={isOpen}
        isCollapsed={isCollapsed}
        props={{
          'aria-live': 'polite',
          className:
            unreadCount > 0 && !isOpen
              ? '[&:not(:hover)]:!text-brand-300 [&:not(:hover)]:dark:!text-brand-400'
              : undefined,
          disabled: notificationCount === 0,
        }}
        title={title}
        onClick={handleOpen}
      />
      {Array.isArray(notifications) ? (
        <Dialog
          buttons={commonText.close()}
          className={{
            container: `${dialogClassNames.narrowContainer} min-w-[50%]`,
            content: `${dialogClassNames.flexContent} gap-3 divide-y divide-gray-500`,
          }}
          header={notificationsText.notifications()}
          isOpen={isOpen}
          onClose={(): void => {
            handleClose();
            const hasUnread = notifications.some(({ read }) => !read);
            if (!hasUnread) return;
            setNotifications(
              notifications.map((notification) => ({
                ...notification,
                read: true,
              }))
            );
            freezeFetchPromise.current = ping(
              '/notifications/mark_read/',
              {
                method: 'POST',
                body: formData({
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  last_seen: notifications[0]!.timestamp,
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
          <p>{notificationsText.mostRecentNotificationsTop()}</p>
          {notifications.map((notification, index) => (
            <ErrorBoundary dismissible key={index}>
              <NotificationComponent
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
      ) : isOpen ? (
        <LoadingScreen />
      ) : undefined}
    </>
  );
}

function NotificationComponent({
  notification,
  onDelete: handleDelete,
}: {
  readonly notification: GenericNotification;
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
          title={commonText.delete()}
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
