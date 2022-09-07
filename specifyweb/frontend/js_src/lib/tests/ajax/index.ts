import fs from 'node:fs';
import path from 'node:path';

import type { ajax, AjaxResponseObject } from '../../utils/ajax';
import { Http } from '../../utils/ajax/helpers';
import { handleAjaxResponse } from '../../utils/ajax/response';
import { f } from '../../utils/functools';
import type { IR, R, RA } from '../../utils/types';

const overwrites: R<
  | {
      readonly data: Document | IR<unknown> | RA<unknown> | string;
      readonly responseCode: number | undefined;
      readonly method: string | undefined;
      readonly body: unknown;
    }
  | undefined
> = {};

/**
 * Overwrite the response to an ajax response for all fetch requests originating
 * from the current test block
 */
export function overwriteAjax(
  url: string,
  response: Document | IR<unknown> | RA<unknown> | string,
  {
    responseCode,
    method,
    body,
  }: {
    readonly responseCode?: number;
    readonly method?: string;
    readonly body?: unknown;
  } = {}
): void {
  beforeAll(() => {
    overwrites[url] = {
      data: response,
      responseCode,
      method,
      body,
    };
  });
  afterAll(() => {
    overwrites[url] = undefined;
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
  { method: requestMethod, body: requestBody }: Parameters<typeof ajax>[1],
  {
    expectedResponseCodes = [Http.OK],
  }: {
    readonly expectedResponseCodes?: RA<number>;
  } = {}
): Promise<AjaxResponseObject<RESPONSE_TYPE>> {
  if (url.startsWith('https://stats.specifycloud.org/capture'))
    return formatResponse('', 'text/plain', expectedResponseCodes);

  const parsedUrl = new URL(url, globalThis?.location.origin);
  const urlWithoutQuery = `${parsedUrl.origin}${parsedUrl.pathname}`;
  const overwrittenData = overwrites[url] ?? overwrites[urlWithoutQuery];
  if (typeof overwrittenData !== 'undefined') {
    const { data, responseCode, method, body } = overwrittenData;
    const response = createResponse(expectedResponseCodes);
    if (body !== undefined) expect(requestBody).toEqual(body);
    if (method === undefined || method === requestMethod)
      return {
        data: data as RESPONSE_TYPE,
        response,
        status: responseCode ?? response.status,
      };
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
      `No static source found for URL ${url}.\n` +
        `You can mock it by creating a file in ./lib/tests/ajax/static\n` +
        `Alternatively, you can add overwriteAjax() to your test`
    );

  const file = await fs.promises.readFile(
    path.join(parsedPath.dir, targetFile)
  );
  return formatResponse(
    file.toString(),
    splitFileName(targetFile).extension,
    expectedResponseCodes
  );
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
  extension: string,
  expectedResponseCodes: RA<number>
): AjaxResponseObject<RESPONSE_TYPE> =>
  handleAjaxResponse({
    expectedResponseCodes,
    accept:
      extension === 'json'
        ? 'application/json'
        : extension === 'xml'
        ? 'text/xml'
        : 'text/plain',
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
