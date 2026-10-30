import { Http } from '../../utils/ajax/definitions';
import type { IR, RA } from '../../utils/types';
import type { DictionaryUsages } from '../utils/scanUsages';
import { testLogging } from '../utils/testLogging';
import { checkComponents, localizationKinds } from '../utils/validateWeblate';

jest.mock('../utils/testLogging', () => ({
  testLogging: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const componentsUrl =
  'https://hosted.weblate.org/api/projects/specify-7/components/';
const autoTranslateUrl = 'https://hosted.weblate.org/api/addons/101/';
const cleanupUrl = 'https://hosted.weblate.org/api/addons/102/';
const staleUrl = 'https://hosted.weblate.org/api/addons/103/';
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalFetch = globalThis.fetch;
const originalToken = process.env.WEBLATE_API_TOKEN;

const settings = (name: string): IR<unknown> =>
  localizationKinds.userInterface.getComponentSettings(name);

const component = (name: string, addons: RA<string>): IR<unknown> => ({
  ...settings(name),
  addons,
  source_language: { code: 'en_US' },
  is_glossary: false,
});

const usages = (...names: RA<string>): DictionaryUsages =>
  Object.fromEntries(
    names.map((categoryName) => [categoryName, { categoryName, strings: {} }])
  );

const response = (
  body: unknown,
  status: number = Http.OK,
  statusText = 'OK'
): Response =>
  Object.assign(new Response(undefined, { status, statusText }), {
    statusText,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

const mockResponses = (responses: IR<Response>): void => {
  fetchMock.mockImplementation(async (url) => {
    const result = responses[url.toString()];
    if (result === undefined)
      throw new Error(`Unexpected Weblate request: ${url.toString()}`);
    return result;
  });
};

const validAddons = (): IR<Response> => {
  const addons = settings('test').addons as IR<IR<unknown>>;
  return {
    [autoTranslateUrl]: response({
      name: 'weblate.autotranslate.autotranslate',
      configuration: addons['weblate.autotranslate.autotranslate'],
    }),
    [cleanupUrl]: response({
      name: 'weblate.cleanup.generic',
      configuration: addons['weblate.cleanup.generic'],
    }),
  };
};

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  process.env.WEBLATE_API_TOKEN = 'test-token';
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.WEBLATE_API_TOKEN;
  else process.env.WEBLATE_API_TOKEN = originalToken;
});

test('valid addons match the expected configuration regardless of order', async () => {
  mockResponses({
    ...validAddons(),
    [componentsUrl]: response({
      results: [component('test', [cleanupUrl, autoTranslateUrl])],
      next: null,
    }),
  });

  await checkComponents(usages('test'), 'userInterface');

  expect(testLogging.error).not.toHaveBeenCalled();
  expect(testLogging.warn).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock).toHaveBeenCalledWith(autoTranslateUrl, {
    headers: { Authorization: 'Token test-token' },
  });
});

test('a deleted addon is reported without preventing component validation', async () => {
  mockResponses({
    ...validAddons(),
    [componentsUrl]: response({
      results: [component('test', [autoTranslateUrl, cleanupUrl, staleUrl])],
      next: null,
    }),
    [staleUrl]: response({ detail: 'Not found.' }, Http.NOT_FOUND, 'Not Found'),
  });

  await expect(
    checkComponents(usages('test'), 'userInterface')
  ).resolves.toBeUndefined();

  expect(testLogging.error).toHaveBeenCalledTimes(1);
  expect(testLogging.error).toHaveBeenCalledWith(
    `Weblate component "test" references addon "${staleUrl}", which ` +
      `no longer exists (404 Not Found). Remove or fix the stale addon ` +
      `reference in Weblate.`
  );
});

test('a stale addon does not prevent settings checks across component pages', async () => {
  const nextUrl = `${componentsUrl}?page=2`;
  mockResponses({
    ...validAddons(),
    [componentsUrl]: response({
      results: [
        {
          ...component('stale', [autoTranslateUrl, cleanupUrl, staleUrl]),
          license: 'unexpected',
        },
      ],
      next: nextUrl,
    }),
    [nextUrl]: response({
      results: [
        {
          ...component('valid', [autoTranslateUrl, cleanupUrl]),
          branch: 'unexpected',
        },
      ],
      next: null,
    }),
    [staleUrl]: response({}, Http.NOT_FOUND, 'Not Found'),
  });

  await checkComponents(usages('stale', 'valid'), 'userInterface');

  expect(testLogging.error).toHaveBeenCalledTimes(3);
  expect(testLogging.error).toHaveBeenCalledWith(
    expect.stringContaining(`component "stale" references addon "${staleUrl}"`)
  );
  expect(testLogging.error).toHaveBeenCalledWith(
    expect.stringContaining('"stale" component for "license" setting')
  );
  expect(testLogging.error).toHaveBeenCalledWith(
    expect.stringContaining('"valid" component for "branch" setting')
  );
});

test('missing expected addons still produce a configuration mismatch', async () => {
  mockResponses({
    ...validAddons(),
    [componentsUrl]: response({
      results: [component('test', [autoTranslateUrl, staleUrl])],
      next: null,
    }),
    [staleUrl]: response({}, Http.NOT_FOUND, 'Not Found'),
  });

  await checkComponents(usages('test'), 'userInterface');

  expect(testLogging.error).toHaveBeenCalledTimes(2);
  expect(testLogging.error).toHaveBeenCalledWith(
    `Weblate config for "test" component for "addons" setting ` +
      `does not match what is expected.\n` +
      `Expected: ${JSON.stringify(settings('test').addons)}\n` +
      `Received: ${JSON.stringify({
        'weblate.autotranslate.autotranslate': (
          settings('test').addons as IR<unknown>
        )['weblate.autotranslate.autotranslate'],
      })}`
  );
});

test('addon configuration mismatches are reported and unrelated addons ignored', async () => {
  const extraUrl = 'https://hosted.weblate.org/api/addons/104/';
  mockResponses({
    ...validAddons(),
    [componentsUrl]: response({
      results: [component('test', [cleanupUrl, extraUrl, autoTranslateUrl])],
      next: null,
    }),
    [autoTranslateUrl]: response({
      name: 'weblate.autotranslate.autotranslate',
      configuration: {},
    }),
    [extraUrl]: response({ name: 'unrelated.addon', configuration: {} }),
  });

  await checkComponents(usages('test'), 'userInterface');

  expect(testLogging.error).toHaveBeenCalledTimes(1);
  expect(testLogging.error).toHaveBeenCalledWith(
    `Weblate config for "test" component for "addons" setting ` +
      `does not match what is expected.\n` +
      `Expected: ${JSON.stringify(settings('test').addons)}\n` +
      `Received: ${JSON.stringify({
        'weblate.autotranslate.autotranslate': {},
        'weblate.cleanup.generic': {},
      })}`
  );
});

test.each([
  [Http.FORBIDDEN, 'Forbidden'],
  [Http.SERVER_ERROR, 'Internal Server Error'],
])('addon HTTP %s failures remain fatal', async (status, statusText) => {
  mockResponses({
    [componentsUrl]: response({
      results: [component('test', [autoTranslateUrl])],
      next: null,
    }),
    [autoTranslateUrl]: response({ detail: 'Failed' }, status, statusText),
  });

  await expect(
    checkComponents(usages('test'), 'userInterface')
  ).rejects.toThrow(
    `Weblate API request failed (${status} ${statusText}) for ` +
      `${autoTranslateUrl}: {"detail":"Failed"}`
  );
  expect(testLogging.error).not.toHaveBeenCalled();
});

test('a missing components endpoint remains fatal', async () => {
  mockResponses({
    [componentsUrl]: response({}, Http.NOT_FOUND, 'Not Found'),
  });

  await expect(
    checkComponents(usages('test'), 'userInterface')
  ).rejects.toThrow(
    `Weblate API request failed (404 Not Found) for ${componentsUrl}: {}`
  );
  expect(testLogging.error).not.toHaveBeenCalled();
});
