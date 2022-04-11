/**
 * When process.env.NODE_ENV === 'test', intercept the following AJAX requests
 */

import fs from 'fs';
import path from 'path';

import type { AjaxResponseObject } from '../../ajax';
import { handleResponse, Http } from '../../ajax';

export async function interceptRequest<RESPONSE_TYPE>(
  url: string
): Promise<AjaxResponseObject<RESPONSE_TYPE>> {
  const parsedUrl = path.parse(`.${url}`);

  const files = await fs.promises.readdir(parsedUrl.dir, {
    withFileTypes: true,
  });

  const targetFile = files.find(
    (dirent) =>
      dirent.name === parsedUrl.base ||
      dirent.name === dirent.name.split('.').slice(0, -1).join('.')
  )?.name;

  if (typeof targetFile === 'undefined')
    throw new Error(`No static source found for URL ${url}`);

  const fileContent = await fs.promises
    .readFile(path.join(parsedUrl.dir, targetFile))
    .toString();

  return handleResponse({
    expectedResponseCodes: [Http.OK],
    accept: 'application/json',
    response: new Response('', {
      status: 200,
      statusText: undefined,
    }),
    strict: true,
    text: fileContent,
  });
}
