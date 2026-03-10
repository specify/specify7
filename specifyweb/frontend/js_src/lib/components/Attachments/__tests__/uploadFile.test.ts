import { overrideAjax } from '../../../tests/ajax';
import attachmentSettings from '../../../tests/ajax/static/context/attachment_settings.json';
import { requireContext } from '../../../tests/helpers';
import { Http } from '../../../utils/ajax/definitions';
import { uploadFile } from '../attachments';

requireContext();

describe('uploadFile', () => {
  type EventName = 'abort' | 'error' | 'readystatechange' | 'timeout';
  type MockXhr = {
    readonly open: jest.Mock;
    readonly send: jest.Mock;
    readonly addEventListener: jest.Mock;
    readonly removeEventListener: jest.Mock;
    readonly upload: {
      readonly addEventListener: jest.Mock;
    };
    readyState: number;
    status: number;
    responseText: string;
    timeout: number;
  };

  let nextEvent: EventName = 'readystatechange';
  let xhrMock: MockXhr;

  const makeXhrMock = (): MockXhr => {
    const listeners: Partial<Record<EventName, () => void>> = {};

    return {
      open: jest.fn(),
      send: jest.fn((..._args: unknown[]) => listeners[nextEvent]?.()),
      addEventListener: jest.fn((eventName: EventName, callback: () => void) => {
        listeners[eventName] = callback;
      }),
      removeEventListener: jest.fn(
        (eventName: EventName, callback: () => void) => {
          if (listeners[eventName] === callback) listeners[eventName] = undefined;
        }
      ),
      upload: {
        addEventListener: jest.fn(),
      },
      readyState: 4,
      status: Http.OK,
      responseText: '',
      timeout: 0,
    };
  };

  let previousImplementation: typeof window.XMLHttpRequest;
  let previousTelemetry: typeof globalThis.performance.getEntries;

  beforeEach(() => {
    previousImplementation = window.XMLHttpRequest;
    previousTelemetry = globalThis.performance.getEntries;
    xhrMock = makeXhrMock();

    nextEvent = 'readystatechange';

    // @ts-expect-error
    jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    globalThis.performance.getEntries = () => [];
  });

  afterEach(() => {
    window.XMLHttpRequest = previousImplementation;
    globalThis.performance.getEntries = previousTelemetry;
  });

  const testFileName = 'textFile.txt';
  const testToken = 'testToken';
  const testAttachmentLocation = 'testLocation';
  const testFile = new File(['Some Text Contents'], testFileName, {
    type: 'text/plain',
  });

  overrideAjax(
    `/attachment_gw/get_upload_params/`,
    [{ token: testToken, attachmentLocation: testAttachmentLocation }],
    { method: 'POST' }
  );

  test('sends request correctly', async () => {
    const onProgress = jest.fn();

    const attachment = await uploadFile({
      file: testFile,
      handleProgress: onProgress,
    });

    expect(xhrMock.open).toHaveBeenCalledTimes(1);
    expect(xhrMock.open).toHaveBeenLastCalledWith(
      'POST',
      attachmentSettings.write
    );
    expect(xhrMock.timeout).toBe(30 * 60 * 1000);

    expect(xhrMock.send).toHaveBeenCalledTimes(1);
    const formData = xhrMock.send.mock.calls.at(-1)?.[0] as FormData;

    expect(formData.get('token')).toBe(testToken);
    expect(formData.get('store')).toBe(testAttachmentLocation);
    expect(formData.get('type')).toBe('O');
    expect(formData.get('coll')).toBe(attachmentSettings.collection);
    expect(formData.get('file')).toBe(testFile);

    expect(attachment?.get('attachmentLocation')).toBe(testAttachmentLocation);
    expect(attachment?.get('mimeType')).toBe('text/plain');
    expect(attachment?.get('origFilename')).toBe(testFileName);
    expect(attachment?.get('title')).toBe(testFileName);
  });

  test('sends request correctly (override spec)', async () => {
    const newToken = 'newTestToken';
    const newLocation = 'newTestLocation';

    const onProgress = jest.fn();

    const attachment = await uploadFile({
      file: testFile,
      handleProgress: onProgress,
      uploadAttachmentSpec: {
        token: newToken,
        attachmentLocation: newLocation,
      },
    });

    expect(xhrMock.open).toHaveBeenCalledTimes(1);
    expect(xhrMock.open).toHaveBeenLastCalledWith(
      'POST',
      attachmentSettings.write
    );

    expect(xhrMock.send).toHaveBeenCalledTimes(1);
    const formData = xhrMock.send.mock.calls.at(-1)?.[0] as FormData;

    expect(formData.get('token')).toBe(newToken);
    expect(formData.get('store')).toBe(newLocation);
    expect(formData.get('type')).toBe('O');
    expect(formData.get('coll')).toBe(attachmentSettings.collection);
    expect(formData.get('file')).toBe(testFile);

    expect(attachment?.get('attachmentLocation')).toBe(newLocation);
    expect(attachment?.get('mimeType')).toBe('text/plain');
    expect(attachment?.get('origFilename')).toBe(testFileName);
    expect(attachment?.get('title')).toBe(testFileName);
  });

  test('fails when upload request times out', async () => {
    nextEvent = 'timeout';
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(uploadFile({ file: testFile })).rejects.toThrow(
      'Invalid response code 0.'
    );
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
