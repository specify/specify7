import { act, within } from '@testing-library/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { mount } from '../../../tests/reactUtils';
import { ping } from '../../../utils/ajax/ping';
import { Toasts } from '../../Errors/Toasts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { Notifications } from '../Notifications';
import {
  getNotificationHeading,
  type GenericNotification,
} from '../NotificationRenderers';
import { useNotificationsFetch } from '../hooks';

jest.mock('../hooks');
jest.mock('../../../utils/ajax/ping');

const mockedUseNotificationsFetch = jest.mocked(useNotificationsFetch);
const mockedPing = jest.mocked(ping);

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
  mockedPing.mockResolvedValue(200);
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
  const kml = makeNotification(
    '3',
    'query-export-to-kml-complete',
    'query.kml'
  );
  notifications = [csv, dwca, kml];

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
  expect(
    view.getByRole('button', { name: /Query export to KML completed/i })
  ).toBeInTheDocument();
  await view.user.click(
    within(dwcaToast.parentElement ?? dwcaToast).getByRole('button', {
      name: 'Dismiss',
    })
  );
  expect(
    view.queryByRole('button', { name: /DwCA export completed/i })
  ).not.toBeInTheDocument();

  await view.user.click(csvToast);

  const dialog = view.getByRole('dialog');
  expect(dialog).toHaveTextContent('Query export to CSV completed.');
  expect(dialog).toHaveTextContent('DwCA export completed.');
  await view.user.click(
    within(dialog).getAllByRole('button', { name: 'Delete' })[2]!
  );
  expect(
    view.queryByRole('button', { name: /Query export to KML completed/i })
  ).not.toBeInTheDocument();
  expect(
    within(dialog).getAllByRole('link', { name: 'Download' })
  ).toHaveLength(3);
});
