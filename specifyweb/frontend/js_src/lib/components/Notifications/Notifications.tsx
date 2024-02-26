import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { notificationsText } from '../../localization/notifications';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { MenuButton } from '../Header/index';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames, LoadingScreen } from '../Molecules/Dialog';
import { useNotificationsFetch } from './hooks';
import type { GenericNotification } from './NotificationRenderers';
import { notificationRenderers } from './NotificationRenderers';

export function Notifications({
  isCollapsed,
}: {
  readonly isCollapsed: boolean;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const freezeFetchPromise = React.useRef<Promise<void> | undefined>(undefined);

  const { notifications, setNotifications } = useNotificationsFetch({
    freezeFetchPromise,
    isOpen,
  });

  const notificationCount = notifications?.length;

  // Close the dialog when all notifications get dismissed
  React.useEffect(() => {
    if (notificationCount === 0) handleClose();
  }, [notificationCount, handleClose]);

  const unreadCount = notifications?.filter(({ read }) => !read).length ?? 0;
  const title =
    typeof notifications?.length === 'number'
      ? notificationsText.notificationsCount({
          count: notifications.length,
        })
      : notificationsText.notificationsLoading();

  function handleClearAll() {
    if (notifications === undefined) return;
    const message_ids = notifications.map(({ messageId }) => messageId);

    ping('/notifications/delete_all/', {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      body: formData({ message_ids }),
      errorMode: 'dismissible',
    }).then(() => {
      // After the notifications are deleted on the server, clear them from the local state
      setNotifications([]);
    });
  }

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
          buttons={
            <>
              {notifications.length > 1 && (
                <Button.Secondary onClick={handleClearAll}>
                  {commonText.clearAll()}
                </Button.Secondary>
              )}
              <span className="-ml-2 flex-1" />
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            </>
          }
          className={{
            container: `${dialogClassNames.narrowContainer} min-w-[50%]`,
            content: `${dialogClassNames.flexContent} gap-3 divide-y divide-gray-500`,
          }}
          header={notificationsText.notifications()}
          icon={icons.bell}
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
            freezeFetchPromise.current = ping('/notifications/mark_read/', {
              method: 'POST',
              body: formData({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                last_seen: notifications[0]!.timestamp,
              }),
              errorMode: 'dismissible',
            }).then(() => undefined);
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
              ping('/notifications/delete/', {
                method: 'POST',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                body: formData({ message_id: notification.messageId }),
                errorMode: 'dismissible',
              }).then(f.void)
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
