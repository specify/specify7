import { act, renderHook, waitFor } from '@testing-library/react';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { Http } from '../../../utils/ajax/definitions';
import {
  attachmentSettingsPromise,
  overrideAttachmentServerStatus,
  overrideAttachmentSettings,
  reportAttachmentServerFailure,
  useAttachmentServerStatus,
} from '../attachments';

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

// Silences (and lets tests assert on) the connection-loss/restoration logging
let consoleError: jest.SpiedFunction<typeof console.error>;
let consoleWarn: jest.SpiedFunction<typeof console.warn>;

beforeEach(async () => {
  await attachmentSettingsPromise;
  overrideAttachmentSettings(testSettings);
  overrideAttachmentServerStatus('available');
  consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  overrideAttachmentSettings(undefined);
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

describe('reportAttachmentServerFailure', () => {
  describe('when a health check confirms the server is reachable', () => {
    overrideAjax(mockReadUrl, '', { responseCode: Http.OK });

    test('a single caller error does not mark the server unavailable', async () => {
      const { result, unmount } = renderHook(() => useAttachmentServerStatus());
      expect(result.current).toBe('available');

      act(() => reportAttachmentServerFailure());

      await waitFor(() => expect(result.current).toBe('available'));
      unmount();
    });
  });

  describe('when a health check confirms the server is unreachable', () => {
    overrideAjax(mockReadUrl, '', { responseCode: Http.SERVER_ERROR });

    test('marks the server unavailable', async () => {
      const { result, unmount } = renderHook(() => useAttachmentServerStatus());
      expect(result.current).toBe('available');

      act(() => reportAttachmentServerFailure());

      await waitFor(() => expect(result.current).toBe('unavailable'));
      unmount();
    });
  });

  test('does nothing when no settings are configured', () => {
    overrideAttachmentSettings(undefined);
    expect(() => reportAttachmentServerFailure()).not.toThrow();
  });
});

describe('connection loss/restoration logging', () => {
  overrideAjax(mockReadUrl, '', { responseCode: Http.SERVER_ERROR });

  test('logs connection loss exactly once, and only once further failures are reported', async () => {
    const { result, unmount } = renderHook(() => useAttachmentServerStatus());
    expect(result.current).toBe('available');

    act(() => reportAttachmentServerFailure());
    await waitFor(() => expect(result.current).toBe('unavailable'));

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleWarn).not.toHaveBeenCalled();

    act(() => reportAttachmentServerFailure());
    await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));

    unmount();
  });
});

describe('useAttachmentServerStatus polling', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('keeps the shared interval running until the last subscriber unmounts', () => {
    const first = renderHook(() => useAttachmentServerStatus());
    const second = renderHook(() => useAttachmentServerStatus());

    expect(jest.getTimerCount()).toBe(1);

    first.unmount();
    expect(jest.getTimerCount()).toBe(1);

    second.unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
