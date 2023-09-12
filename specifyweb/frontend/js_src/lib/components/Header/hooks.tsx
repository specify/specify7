import type { LocalizedString } from 'typesafe-i18n';

import { ajax } from '../../utils/ajax';
import { formatDateForBackEnd } from '../../utils/parser/dateFormat';
import type { GetOrSet, IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { formatUrl } from '../Router/queryString';
import type { GenericNotification } from './NotificationRenderers';
import { INTERVAL_MULTIPLIER } from './Notifications';

export function useNotificationsFetch({
  pullInterval,
  freezeFetchPromise,
  destructorCalled,
  notifications: [_, setNotifications],
  lastFetchedTimestamp,
  timeout,
}: {
  readonly pullInterval: number;
  readonly freezeFetchPromise: React.MutableRefObject<
    Promise<void> | undefined
  >;
  readonly destructorCalled: boolean;
  readonly notifications: GetOrSet<RA<GenericNotification> | undefined>;
  readonly lastFetchedTimestamp: Date | undefined;
  readonly timeout: NodeJS.Timeout | undefined;
}): { readonly doFetch: (since?: Date) => void } {
  const doFetch = (since = new Date()): void => {
    const startFetchTimestamp = new Date();

    const url = formatUrl(`/notifications/messages/`, {
      since: formatDateForBackEnd(since),
    });

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
          url,

          {
            headers: { Accept: 'application/json' },
            /*
             * Don't show modal error dialog on errors. Several reasons why:
             *  - Request may fail if Django migrations weren't run
             *  - Request is initialized automatically, not by user, thus having
             *    an error dialog appear out of blue could be confusing/unexpected
             *  - Notifications is not a critical component, so if it fails, it
             *    shouldn't bring down entire application
             */
            errorMode: 'silent',
          }
        )
      )
      .then(({ data: newNotifications }) => {
        if (destructorCalled) return undefined;

        setNotifications((existingNotifications) => {
          const mappedNewNotifications = newNotifications.map(
            ({ message_id, read, timestamp, type, ...rest }) => ({
              messageId: message_id,
              read,
              timestamp,
              type,
              payload: rest as IR<LocalizedString>,
            })
          );

          const filteredNewNotifications = mappedNewNotifications.filter(
            (newNotification) =>
              !existingNotifications?.some(
                (existingNotification) =>
                  existingNotification.messageId === newNotification.messageId
              )
          );

          return [
            ...(existingNotifications ?? []),
            ...filteredNewNotifications,
          ].sort(
            sortFunction(({ timestamp }) => new Date(timestamp).getTime(), true)
          );
        });
        lastFetchedTimestamp = startFetchTimestamp;
        // Stop updating if tab is hidden
        timeout =
          document.visibilityState === 'hidden'
            ? undefined
            : globalThis.setTimeout(
                () => doFetch(lastFetchedTimestamp),
                pullInterval
              );
        return timeout;
      })
      .catch(console.error);
  };

  return { doFetch };
}
