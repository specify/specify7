import { act, renderHook } from '@testing-library/react';
import { MutableRefObject } from 'react';
import { useNotificationsFetch } from '../hooks';

test('Verify notifications are fetched when isOpen is true', async () => {
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

  expect(result.current.notifications).toEqual(undefined);
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
        key1: 'value1',
        key2: 'value2',
      },
    },
    {
      messageId: '2',
      read: false,
      timestamp: '2023-09-18T13:00:00Z',
      type: 'notificationType2',
      payload: {
        key1: 'value1',
        key2: 'value2',
      },
    },
  ];

  act(() => {
    result.current.setNotifications(newNotifications);
  });

  expect(result.current.notifications).toEqual(newNotifications);
});
