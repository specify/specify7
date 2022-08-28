import fs from 'node:fs';
import path from 'node:path';

import type { AjaxResponseObject } from '../../utils/ajax';
import { handleAjaxResponse } from '../../utils/ajax/response';
import { Http } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';

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
  _options: unknown,
  {
    expectedResponseCodes = [Http.OK],
  }: {
    readonly expectedResponseCodes?: RA<number>;
  } = {}
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
    throw new Error(
      `No static source found for URL ${url}.
      You can mock it by creating a file in ./lib/tests/ajax/static`
    );

  const file = await fs.promises.readFile(path.join(parsedUrl.dir, targetFile));
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
