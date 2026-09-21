import React from 'react';
import * as Router from 'react-router-dom';
import { waitFor } from '@testing-library/react';

import { commonText } from '../../../localization/common';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { Http } from '../../../utils/ajax/definitions';
import { SetMenuContext } from '../MenuContext';
import {
  overrideAttachmentServerStatus,
  overrideAttachmentSettings,
} from '../../Attachments/attachments';
import { HeaderItems } from '..';

requireContext();

const mockReadUrl = '/mockAssetServer/fileget';

const testSettings = {
  collection: 'Test Collection',
  delete: '/mockAssetServer/filedelete',
  getmetadata: '/mockAssetServer/getmetadata',
  read: mockReadUrl,
  testkey: '/mockAssetServer/testkey',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  token_required_for_get: false,
  write: '/mockAssetServer/fileupload',
};

overrideAjax(mockReadUrl, '', { responseCode: Http.OK });
overrideAjax('/attachment_gw/health/', '', {
  responseCode: Http.NO_CONTENT,
});

function TestHeaderItems(): JSX.Element {
  return (
    <Router.MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <SetMenuContext.Provider value={jest.fn()}>
        <HeaderItems
          menuItems={[
            {
              name: 'attachments',
              title: commonText.search(),
              icon: <span data-testid="attachments-icon" />,
              url: '/specify/attachments/',
            },
            {
              name: 'search',
              title: commonText.search(),
              icon: <span data-testid="search-icon" />,
              url: '/specify/overlay/express-search/',
            },
          ]}
          isCollapsed={false}
          activeMenuItem={undefined}
        />
      </SetMenuContext.Provider>
    </Router.MemoryRouter>
  );
}

describe('HeaderItems', () => {
  // The immediate on-mount health check legitimately logs a status transition
  beforeEach(() => {
    overrideAttachmentSettings(testSettings);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    overrideAttachmentSettings(undefined);
    overrideAttachmentServerStatus('unknown');
    jest.restoreAllMocks();
  });

  test('disables attachments item when server is unavailable', async () => {
    overrideAttachmentServerStatus('unavailable');
    const { getByTestId } = mount(<TestHeaderItems />);

    await waitFor(() => {
      const attachmentsItem = getByTestId('attachments-icon').closest(
        'span[aria-disabled]'
      );
      expect(attachmentsItem).toHaveAttribute('aria-disabled', 'true');
      expect(attachmentsItem).toHaveClass('cursor-not-allowed');
      expect(attachmentsItem).toHaveClass('opacity-50');
    });
  });

  test('does not disable non-attachments items', async () => {
    overrideAttachmentServerStatus('unavailable');
    const { getByTestId } = mount(<TestHeaderItems />);

    await waitFor(() => {
      const searchItem = getByTestId('search-icon').closest('a');
      expect(searchItem).toBeEnabled();
      expect(searchItem).toHaveAttribute(
        'href',
        '/specify/overlay/express-search/'
      );
    });
  });

  test('renders disabled attachments item as non-interactive', async () => {
    overrideAttachmentServerStatus('unavailable');
    const { getByTestId } = mount(<TestHeaderItems />);

    await waitFor(() => {
      const attachmentsItem = getByTestId('attachments-icon').closest(
        'span[aria-disabled]'
      );
      expect(attachmentsItem).toBeInTheDocument();
      expect(attachmentsItem).not.toHaveAttribute('href');
    });
  });

  test('keeps attachments enabled when server is available', async () => {
    overrideAttachmentServerStatus('available');
    const { getByTestId } = mount(<TestHeaderItems />);

    await waitFor(() => {
      const attachmentsItem = getByTestId('attachments-icon').closest('a');
      expect(attachmentsItem).toBeEnabled();
      expect(attachmentsItem).toHaveAttribute('href', '/specify/attachments/');
    });
  });
});
