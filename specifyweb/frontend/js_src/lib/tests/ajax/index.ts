import fs from 'fs';
import path from 'path';

import type { AjaxResponseObject } from '../../ajax';
import { handleResponse, Http } from '../../ajax';
import { f } from '../../functools';
import type { RA } from '../../types';

/**
 * When process.env.NODE_ENV === 'test', intercept the AJAX requests
 *
 * @remarks
 * This doesn't know how to handle requests to third-party URLs and this will
 * only be able to handle requests for resources that are present in the
 * `./static` directory. Everything else would throw.
 *
 * This would also not be able to handle requests for XML resources, as Node.JS
 * environment does not have an XML parser.
 */
export async function interceptRequest<RESPONSE_TYPE>(
  url: string,
  expectedResponseCodes: RA<number>
): Promise<AjaxResponseObject<RESPONSE_TYPE>> {
  if (url.startsWith('https://stats.specifycloud.org/capture'))
    return formatResponse('', 'text/plain', expectedResponseCodes);

  const parsedUrl = path.parse(`./lib/tests/ajax/static${url}`);

  // Find a directory that matches the part name in the URL
  const files = await fs.promises.readdir(parsedUrl.dir, {
    withFileTypes: true,
  });

  const targetFile = files.find(
    (dirent) =>
      dirent.isFile() &&
      /*
       * Compare file name from the URL to a file in the found directory with
       * and without the file extension
       */
      (parsedUrl.base === dirent.name ||
        parsedUrl.base === splitFileName(dirent.name).fileName)
  )?.name;

  if (typeof targetFile === 'undefined')
    throw new Error(`No static source found for URL ${url}`);

  const file = await fs.promises.readFile(path.join(parsedUrl.dir, targetFile));
  // console.log(`[${getResponseCode(expectedResponseCodes)}] ${url}`);
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
  handleResponse({
    expectedResponseCodes,
    accept:
      extension === 'json'
        ? 'application/json'
        : extension === 'xml'
        ? 'application/xml'
        : 'text/plain',
    response: f.var(
      getResponseCode(expectedResponseCodes),
      (statusCode) =>
        new Response(statusCode === Http.NO_CONTENT ? undefined : '', {
          status: statusCode,
          statusText: undefined,
        })
    ),
    strict: true,
    text: response,
  });

const getResponseCode = (expectedResponseCodes: RA<number>): number =>
  expectedResponseCodes.find((code) =>
    f.includes([Http.OK, Http.NO_CONTENT, Http.CREATED], code)
  ) ?? expectedResponseCodes[0];
