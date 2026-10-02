import { act, within } from '@testing-library/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { mount } from '../../../tests/reactUtils';
import { Toasts } from '../../Errors/Toasts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { Notifications } from '../Notifications';
import {
  getNotificationHeading,
  type GenericNotification,
} from '../NotificationRenderers';
import { useNotificationsFetch } from '../hooks';

jest.mock('../hooks');

const mockedUseNotificationsFetch = jest.mocked(useNotificationsFetch);

const makeNotification = (
  messageId: string,
  type: string,
  file: string
): GenericNotification => ({
  messageId,
  read: false,
  timestamp: `2023-09-19T01:22:0${messageId}`,
  type,
  payload: { file: file as LocalizedString },
});

test('unknown notification types use the generic heading', () => {
  expect(getNotificationHeading(makeNotification('1', '__proto__', ''))).toBe(
    'Notifications'
  );
});

test('new notification toasts open the dialog with current notifications', async () => {
  let notifications: readonly GenericNotification[] = [];
  let handleIncoming:
    | ((notifications: readonly GenericNotification[]) => void)
    | undefined;

  mockedUseNotificationsFetch.mockImplementation(({ onNewNotifications }) => {
    handleIncoming = onNewNotifications;
    return {
      notifications,
      setNotifications: jest.fn(),
    };
  });

  const view = mount(
    <UnloadProtectsContext.Provider value={[]}>
      <Toasts>
        <Notifications isCollapsed />
      </Toasts>
    </UnloadProtectsContext.Provider>
  );
  const dwca = makeNotification('1', 'dwca-export-complete', 'export.zip');
  const csv = makeNotification(
    '2',
    'query-export-to-csv-complete',
    'query.csv'
  );
  notifications = [csv, dwca];

  act(() => {
    handleIncoming?.(notifications);
    view.rerender(
      <UnloadProtectsContext.Provider value={[]}>
        <Toasts>
          <Notifications isCollapsed />
        </Toasts>
      </UnloadProtectsContext.Provider>
    );
  });

  const csvToast = view.getByRole('button', {
    name: /Query export to CSV completed/i,
  });
  expect(csvToast).toHaveAttribute('aria-live', 'polite');
  expect(csvToast.parentElement).toHaveClass(
    'bg-gray-200',
    'hover:bg-gray-300',
    'dark:bg-neutral-800'
  );
  expect(csvToast).toHaveClass(
    '!text-black',
    'hover:!text-black',
    'dark:!text-gray-100',
    'dark:hover:!text-gray-100'
  );
  expect(csvToast.querySelector('svg')?.parentElement).toHaveClass(
    'text-green-600',
    'dark:text-green-400'
  );
  const dwcaToast = view.getByRole('button', {
    name: /DwCA export completed/i,
  });
  await view.user.click(
    within(dwcaToast.parentElement ?? dwcaToast).getByRole('button', {
      name: 'Dismiss',
    })
  );
  expect(dwcaToast).not.toBeInTheDocument();

  await view.user.click(csvToast);

  const dialog = view.getByRole('dialog');
  expect(dialog).toHaveTextContent('Query export to CSV completed.');
  expect(dialog).toHaveTextContent('DwCA export completed.');
  expect(
    within(dialog).getAllByRole('link', { name: 'Download' })
  ).toHaveLength(2);
});
