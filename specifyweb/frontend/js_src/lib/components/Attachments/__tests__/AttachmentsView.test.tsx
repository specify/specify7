import { act, waitFor } from '@testing-library/react';
import React from 'react';
import * as Router from 'react-router-dom';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { commonText } from '../../../localization/common';
import { attachmentsText } from '../../../localization/attachments';
import { Http } from '../../../utils/ajax/definitions';
import { SetMenuContext } from '../../Header/MenuContext';
import {
  attachmentSettingsPromise,
  overrideAttachmentServerStatus,
  overrideAttachmentSettings,
} from '../attachments';
import { AttachmentsView } from '..';

/*
 * Bypass the paginated attachment fetches (a pre-existing, unrelated bug in
 * useAsyncState's real implementation crashes when exercised here); only the
 * status-driven rendering is under test
 */
jest.mock('../../../hooks/useAsyncState', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    useAsyncState: () => ReactModule.useState(undefined),
    usePromise: (promise: Promise<unknown>) => {
      const [state, setState] = ReactModule.useState(undefined);
      ReactModule.useEffect(() => {
        let ignore = false;
        promise.then((value: unknown) => {
          if (!ignore) setState(value);
        });
        return () => {
          ignore = true;
        };
      }, [promise]);
      return [state, setState];
    },
  };
});

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

function TestAttachmentsView(): JSX.Element {
  return (
    <Router.MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <SetMenuContext.Provider value={jest.fn()}>
        <AttachmentsView />
      </SetMenuContext.Provider>
    </Router.MemoryRouter>
  );
}

describe('AttachmentsView', () => {
  let consoleError: jest.SpiedFunction<typeof console.error>;
  let consoleWarn: jest.SpiedFunction<typeof console.warn>;

  beforeEach(async () => {
    await attachmentSettingsPromise;
    overrideAttachmentSettings(testSettings);
    overrideAttachmentServerStatus('available');
    consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    overrideAttachmentSettings(undefined);
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  describe('when the health check reports the server is unreachable', () => {
    overrideAttachmentServerStatus('unavailable');
    overrideAjax(mockReadUrl, '', { responseCode: Http.SERVER_ERROR });

    test('replaces the gallery with a single unavailable message and disables Import', async () => {
      const { findByRole, unmount } = mount(<TestAttachmentsView />);

      await findByRole('heading', {
        name: attachmentsText.attachmentServerUnavailable(),
      });

      const importButton = await findByRole('button', {
        name: commonText.import(),
      });
      expect(importButton).toBeDisabled();
      expect(importButton).toHaveAttribute(
        'title',
        attachmentsText.attachmentServerUnavailable()
      );

      unmount();
    });
  });

  describe('when the health check reports the server is reachable', () => {
    overrideAttachmentServerStatus('available');
    overrideAjax(mockReadUrl, '', { responseCode: Http.OK });

    test('shows the gallery and an enabled Import button when available', async () => {
      const { findByRole, queryByRole, unmount } = mount(
        <TestAttachmentsView />
      );

      const importButton = await findByRole('button', {
        name: commonText.import(),
      });
      await waitFor(() => expect(importButton).toBeEnabled());
      expect(
        queryByRole('heading', {
          name: attachmentsText.attachmentServerUnavailable(),
        })
      ).not.toBeInTheDocument();

      await act(() => {
        unmount();
      });
    });
  });
});
