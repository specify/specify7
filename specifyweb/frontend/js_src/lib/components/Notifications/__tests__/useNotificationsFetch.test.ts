import { act, renderHook, waitFor } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { overrideAjax } from '../../../tests/ajax';
import { mockTime } from '../../../tests/helpers';
import { testTime } from '../../../tests/testTime';
import { formatDateForBackEnd } from '../../../utils/parser/dateFormat';
import { formatUrl } from '../../Router/queryString';
import { exportsForTests, useNotificationsFetch } from '../hooks';

const { INITIAL_INTERVAL, mergeAndSortNotifications, getSinceUrl } =
  exportsForTests;

test.skip('Verify notifications are fetched when isOpen is true', async () => {
  const freezeFetchPromise: MutableRefObject<Promise<void> | undefined> = {
    current: undefined,
  };
  const isOpen = true;

  const { result } = renderHook(() =>
    useNotificationsFetch({ freezeFetchPromise, isOpen })
  );

  expect(result.current.notifications).toBeUndefined();

  await act(async () => {
    await result.current.notifications;
  });

  expect(result.current.notifications).toBeUndefined();
});

test('Verify setNotifications function works', () => {
  const freezeFetchPromise: MutableRefObject<Promise<void> | undefined> = {
    current: undefined,
  };
  const isOpen = true;

  const { result } = renderHook(() =>
    useNotificationsFetch({ freezeFetchPromise, isOpen })
  );

  const newNotifications = [
    {
      messageId: '1',
      read: true,
      timestamp: '2023-09-18T12:00:00Z',
      type: 'notificationType1',
      payload: {
        key1: 'value1' as LocalizedString,
        key2: 'value2' as LocalizedString,
      },
    },
    {
      messageId: '2',
      read: false,
      timestamp: '2023-09-18T13:00:00Z',
      type: 'notificationType2',
      payload: {
        key1: 'value1' as LocalizedString,
        key2: 'value2' as LocalizedString,
      },
    },
  ];

  act(() => {
    result.current.setNotifications(newNotifications);
  });

  expect(result.current.notifications).toEqual(newNotifications);
});

test('Verify mergeAndSortNotifications correctly merges and sorts notifications', () => {
  const existingNotifications = [
    {
      messageId: '513',
      read: false,
      timestamp: '2023-09-19T15:53:40.003879',
      type: 'info',
      payload: {
        file: 'query_results_2023-09-19T15:53:39.985932.csv' as LocalizedString,
      },
    },
    {
      messageId: '510',
      read: true,
      timestamp: '2023-09-18T20:19:01.400515',
      type: 'warning',
      payload: { file: 'kui-dwca.zip' as LocalizedString },
    },
  ];

  const newNotifications = [
    {
      file: 'query_results_2023-09-18T16:05:06.101959.csv',
      message_id: '508',
      read: true,
      timestamp: '2023-09-18T16:05:06.126007',
      type: 'query-export-to-csv-complete',
    },
    {
      file: 'query_results_2023-09-18T16:06:18.351114.csv',
      message_id: '509',
      read: true,
      timestamp: '2023-09-18T16:06:18.372581',
      type: 'query-export-to-csv-complete',
    },
  ];

  const mergedAndSorted = mergeAndSortNotifications(
    existingNotifications,
    newNotifications
  );

  const expectedMergedAndSorted = [
    {
      messageId: '513',
      read: false,
      timestamp: '2023-09-19T15:53:40.003879',
      type: 'info',
      payload: {
        file: 'query_results_2023-09-19T15:53:39.985932.csv',
      },
    },
    {
      messageId: '510',
      read: true,
      timestamp: '2023-09-18T20:19:01.400515',
      type: 'warning',
      payload: { file: 'kui-dwca.zip' },
    },
    {
      messageId: '509',
      payload: { file: 'query_results_2023-09-18T16:06:18.351114.csv' },
      read: true,
      timestamp: '2023-09-18T16:06:18.372581',
      type: 'query-export-to-csv-complete',
    },
    {
      messageId: '508',
      payload: { file: 'query_results_2023-09-18T16:05:06.101959.csv' },
      read: true,
      timestamp: '2023-09-18T16:05:06.126007',
      type: 'query-export-to-csv-complete',
    },
  ];

  expect(mergedAndSorted).toEqual(expectedMergedAndSorted);
});

test('Verify getSinceUrl function returns the correct URL', () => {
  const date = new Date('2023-09-19T12:00:00');

  const url = getSinceUrl(date);

  const expectedUrl = '/notifications/messages/?since=2023-9-19+12%3A0%3A0';

  expect(url).toBe(expectedUrl);
});
describe('fetch notifications', () => {
  const freezeFetchPromise: MutableRefObject<Promise<void> | undefined> = {
    current: undefined,
  };
  const isOpen = true;

  mockTime();
  const firstFetchTime = new Date(testTime);

  overrideAjax(
    formatUrl(`/notifications/messages/`, {
      since: formatDateForBackEnd(firstFetchTime),
    }),
    [
      {
        message_id: 7,
        read: false,
        timestamp: '2023-09-19T01:22:00',
        type: 'query-export-to-csv-complete',
        file: 'query_results_2023-09-19T01:22:00.782784.csv',
      },
    ]
  );

  const secondFetchTime = new Date(testTime);
  secondFetchTime.setMilliseconds(
    secondFetchTime.getMilliseconds() + INITIAL_INTERVAL
  );

  overrideAjax(
    formatUrl(`/notifications/messages/`, {
      since: formatDateForBackEnd(secondFetchTime),
    }),
    [
      {
        message_id: 7,
        read: false,
        timestamp: '2023-09-19T01:22:00',
        type: 'query-export-to-csv-complete',
        file: 'query_results_2023-09-19T01:22:00.782784.csv',
      },
      {
        message_id: 8,
        read: true,
        timestamp: '2023-09-22T01:22:00',
        type: 'query-export-to-csv-complete',
        file: 'query_results_2023-05-19T01:22:00.782784.csv',
      },
    ]
  );

  test.skip('Url makes correct address with since param and response parsed correctly', async () => {
    const { result } = renderHook(() =>
      useNotificationsFetch({ freezeFetchPromise, isOpen })
    );

    await act(async () => {
      await waitFor(() => {
        expect(result.current.notifications).toEqual([
          {
            message_id: 7,
            read: false,
            timestamp: '2023-09-19T01:22:00',
            type: 'query-export-to-csv-complete',
            file: 'query_results_2023-09-19T01:22:00.782784.csv',
          },
          {
            message_id: 8,
            read: true,
            timestamp: '2023-09-22T01:22:00',
            type: 'query-export-to-csv-complete',
            file: 'query_results_2023-05-19T01:22:00.782784.csv',
          },
        ]);
      });
    });
  });
});
