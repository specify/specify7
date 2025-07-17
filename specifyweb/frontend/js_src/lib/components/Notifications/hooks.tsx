import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { ajax } from '../../utils/ajax';
import { fetchServerTime } from '../../utils/fetchServerTime';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { MINUTE, SECOND } from '../Atoms/timeUnits';
import { formatUrl } from '../Router/queryString';
import type { GenericNotification } from './NotificationRenderers';

const INITIAL_INTERVAL =
  process.env.NODE_ENV === 'development' ? MINUTE : 5 * SECOND;
const INTERVAL_MULTIPLIER = 1.1;

export function useNotificationsFetch({
  freezeFetchPromise,
  isOpen,
}: {
  readonly freezeFetchPromise: React.MutableRefObject<
    Promise<void> | undefined
  >;
  readonly isOpen: boolean;
}): {
  readonly notifications: RA<GenericNotification> | undefined;
  readonly setNotifications: React.Dispatch<
    React.SetStateAction<RA<GenericNotification> | undefined>
  >;
} {
  const [notifications, setNotifications] = React.useState<
    RA<GenericNotification> | undefined
  >(undefined);

  const lastFetchDateRef = React.useRef<Date | undefined>(undefined);
  const lastRawTimeRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    let pullInterval = INITIAL_INTERVAL;
    let timeout: NodeJS.Timeout | undefined = undefined;
    let destructorCalled = false;

    const doFetch = async (): Promise<void> => {
      let startFetchTimestamp: Date;
      let rawServerTime: string;

      try {
        const result = await fetchServerTime();
        startFetchTimestamp = result.date;
        rawServerTime = result.rawTime;
      } catch (error) {
        console.error('Error fetching server time, using local time', error);
        startFetchTimestamp = new Date();
        rawServerTime = startFetchTimestamp.toISOString();
      }

      // Use raw server time string for URL
      const baseUrl = `/notifications/messages/`;
      const url = lastRawTimeRef.current === undefined
        ? baseUrl
        : formatUrl(baseUrl, { since: formatDateForServer(lastRawTimeRef.current) });

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
          >(url, {
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
          })
        )
        .then(({ data: newNotifications }) => {
          if (destructorCalled) return;

          setNotifications((existingNotifications) =>
            mergeAndSortNotifications(existingNotifications, newNotifications)
          );

          lastFetchDateRef.current = startFetchTimestamp;
          lastRawTimeRef.current = rawServerTime;
          // Stop updating if tab is hidden
          timeout =
            document.visibilityState === 'hidden'
              ? undefined
              : globalThis.setTimeout(
                  () => {
                    void doFetch();
                  },
                  pullInterval
                );
        })
        .catch(console.error);
    };

    const handler = (): void => {
      if (timeout !== undefined) globalThis.clearTimeout(timeout);

      pullInterval = INITIAL_INTERVAL;
      if (document.visibilityState === 'visible') {
        doFetch();
      }
    };

    document.addEventListener('visibilitychange', handler);

    void doFetch();

    return (): void => {
      document.removeEventListener('visibilitychange', handler);
      destructorCalled = true;
      if (timeout !== undefined) globalThis.clearTimeout(timeout);
    };
  }, [isOpen]);

  return { notifications, setNotifications };
}

function mergeAndSortNotifications(
  existingNotifications: RA<GenericNotification> | undefined,
  newNotifications: RA<
    Omit<GenericNotification, 'messageId' | 'payload'> & {
      readonly message_id: string;
    }
  >
): RA<GenericNotification> {
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

  return [...(existingNotifications ?? []), ...filteredNewNotifications].sort(
    sortFunction(({ timestamp }) => new Date(timestamp).getTime(), true)
  );
}

// This function formats the date string to be used in the URL
function formatDateForServer(isoString: string): string {
  /*
   * This parses the ISO string and formats it so it can be used in the URL
   * All the Date object methods apply timezone conversion magic...
   */
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/); // Magic regex to match ISO date format
  if (!match) return isoString; // If the format is unexpected, return the original string. At least this won't crash.
  const [_, year, month, day, hours, minutes, seconds] = match;
  return `${year}-${Number.parseInt(month, 10)}-${Number.parseInt(day, 10)} ${hours}:${minutes}:${seconds}`;
}

export const exportsForTests = {
  INITIAL_INTERVAL,
  mergeAndSortNotifications,
};
