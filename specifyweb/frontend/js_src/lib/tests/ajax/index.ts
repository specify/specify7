import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, expect } from '@jest/globals';

import type { ajax, AjaxResponseObject } from '../../utils/ajax';
import { MimeType } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { handleAjaxResponse } from '../../utils/ajax/response';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';

type ResponseType = Document | IR<unknown> | RA<unknown> | string;

// eslint-disable-next-line functional/prefer-readonly-type
const overrides: {
  // eslint-disable-next-line functional/prefer-readonly-type
  [URL in string]?: {
    [METHOD in string]?: {
      readonly data: () => ResponseType;
      readonly responseCode: number | undefined;
      readonly body: unknown;
    };
  };
} = {};

/**
 * Overwrite the response to an ajax response for all fetch requests originating
 * from the current test block
 */
export function overrideAjax(
  url: string,
  response: ResponseType | (() => ResponseType),
  {
    responseCode,
    method = 'GET',
    body,
  }: {
    readonly responseCode?: number;
    readonly method?: string;
    readonly body?: unknown;
  } = {},
  allowOverride = false
): void {
  if (!url.startsWith('/'))
    throw new Error(
      '"overrideAjax" must be called with a URL that starts with /'
    );
  beforeAll(() => {
    overrides[url] ??= {};
    if (typeof overrides[url]![method] === 'object' && !allowOverride)
      throw new Error(
        /*
         * This prevent accidentally calling overrideAjax twice with the same
         * URL in the same scope
         */
        `Can\'t override ${url} [${method}] as there already is an override for that URL`
      );
    overrides[url]![method] = {
      data: typeof response === 'function' ? response : () => response,
      responseCode,
      body,
    };
  });
  afterAll(() => {
    overrides[url]![method] = undefined;
  });
}

/**
 * When process.env.NODE_ENV === 'test', this intercepts the AJAX requests
 *
 * @remarks
 * This doesn't know how to handle requests to third-party URLs and this will
 * only be able to handle requests for resources that are present in the
 * `./static` directory. Everything else would throw.
 *
 * This would also not be able to handle requests for XML resources, as Node.JS
 * environment does not have an XML parser.
 */
export async function ajaxMock<RESPONSE_TYPE>(
  url: string,
  {
    method: requestMethod = 'GET',
    body: requestBody,
    headers: { Accept: accept },
  }: Parameters<typeof ajax>[1],
  {
    expectedResponseCodes = [Http.OK],
  }: {
    readonly expectedResponseCodes?: RA<number>;
  } = {}
): Promise<AjaxResponseObject<RESPONSE_TYPE>> {
  if (url.startsWith('https://stats.specifycloud.org/capture'))
    return formatResponse('', accept, expectedResponseCodes);

  const parsedUrl = new URL(url, globalThis?.location.origin);
  const urlWithoutQuery = `${parsedUrl.origin}${parsedUrl.pathname}`;
  const overwrittenData =
    overrides[url]?.[requestMethod] ??
    overrides[urlWithoutQuery]?.[requestMethod];
  if (typeof overwrittenData !== 'undefined') {
    const { data, responseCode, body } = overwrittenData;
    if (body !== undefined) expect(requestBody).toEqual(body);
    const value = data();
    const resolvedValue =
      typeof value === 'object' ? JSON.stringify(value) : value;
    return formatResponse(
      resolvedValue,
      accept,
      typeof responseCode === 'number' ? [responseCode] : expectedResponseCodes
    );
  }

  const parsedPath = path.parse(`./lib/tests/ajax/static${url}`);

  // Find a directory that matches the part name in the URL
  const files = await fs.promises
    .readdir(parsedPath.dir, {
      withFileTypes: true,
    })
    .catch(() => []);

  const targetFile = files.find(
    (dirent) =>
      dirent.isFile() &&
      /*
       * Compare file name from the URL to a file in the found directory with
       * and without the file extension
       */
      (parsedPath.base === dirent.name ||
        parsedPath.base === splitFileName(dirent.name).fileName)
  )?.name;

  if (typeof targetFile === 'undefined')
    throw new Error(
      `No static source found for URL ${url} [${requestMethod}].\n` +
        `You can mock it by creating a file in ./lib/tests/ajax/static\n` +
        `Alternatively, you can add overrideAjax() to your test`
    );

  const file = await fs.promises.readFile(
    path.join(parsedPath.dir, targetFile)
  );
  return formatResponse(file.toString(), accept, expectedResponseCodes);
}

function splitFileName(fileName: string): {
  readonly fileName: string;
  readonly extension: string;
} {
  const parts = fileName.split('.');
  return {
    fileName: parts.slice(0, -1).join('.'),
    extension: parts.at(-1)!,
  };
}

const formatResponse = <RESPONSE_TYPE>(
  response: string,
  accept: MimeType | undefined,
  expectedResponseCodes: RA<number>
): AjaxResponseObject<RESPONSE_TYPE> =>
  handleAjaxResponse({
    expectedResponseCodes,
    accept,
    response: createResponse(expectedResponseCodes),
    strict: true,
    text: response,
  });

function createResponse(expectedResponseCodes: RA<number>): Response {
  const statusCode = getResponseCode(expectedResponseCodes);
  return new Response(statusCode === Http.NO_CONTENT ? undefined : '', {
    status: statusCode,
    statusText: undefined,
  });
}

const getResponseCode = (expectedResponseCodes: RA<number>): number =>
  expectedResponseCodes.find((code) =>
    f.includes([Http.OK, Http.NO_CONTENT, Http.CREATED], code)
  ) ?? expectedResponseCodes[0];
