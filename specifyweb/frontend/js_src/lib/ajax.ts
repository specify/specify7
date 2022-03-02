import { UnhandledErrorView } from './components/errorboundary';
import { csrfToken } from './csrftoken';
import commonText from './localization/common';
import type { IR, PartialBy, RA } from './types';

// These HTTP methods do not require CSRF protection
export const csrfSafeMethod = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

// TODO: make back-end accept both formData and JSON
export function formData(data: IR<string | Blob>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

export function isExternalUrl(url: string): boolean {
  try {
    // Trying to parse a relative URL would throw an exception
    return new URL(url).origin !== window.location.origin;
  } catch {
    return false;
  }
}

export const Http = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  UNAVAILABLE: 503,
};

export type MimeType = 'application/json' | 'application/xml' | 'text/plain';

/**
 * Wraps native fetch in useful helpers
 * It is intended as a replacement for jQuery's ajax
 *
 * @remarks
 * Automatically adds CSRF token to non GET requests
 * Casts response to correct typescript type
 */
export const ajax = async <RESPONSE_TYPE = string>(
  url: string,
  {
    /*
     * Validates and parses response as JSON if 'Accept' header is 'application/json'
     * Validates and parses response as XML if 'Accept' header is 'application/xml'
     */
    headers: { Accept: accept, ...headers },
    ...options
  }: Omit<RequestInit, 'body' | 'headers'> & {
    /*
     * If object is passed to body, it is stringified and proper HTTP header is set
     * Can wrap request body object in formData() to encode body as form data
     */
    body?: string | RA<unknown> | IR<unknown> | FormData;
    headers: IR<string> & { Accept?: MimeType };
  },
  {
    expectedResponseCodes = [Http.OK],
    strict = true,
  }: {
    /*
     * Throw if returned response code is not what expected
     * If you want to manually handle some error, add that error code here
     */
    readonly expectedResponseCodes?: RA<number>;
    /*
     * If strict, spawn a modal error message dialog on crash
     * In either case, error messages are logged to the console
     */
    readonly strict?: boolean;
  } = {}
): Promise<{
  /*
   * Parsed response (parser is selected based on the value of options.headers.Accept:
   *   - application/json - json
   *   - application/xml - xml
   *   - else - string
   */
  readonly data: RESPONSE_TYPE;
  // One of expectedResponseCodes
  readonly status: number;
}> =>
  fetch(url, {
    ...options,
    body:
      typeof options.body === 'object' && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
    headers: {
      ...(typeof options.body === 'object' &&
      !(options.body instanceof FormData)
        ? {
            'Content-Type': 'application/json',
          }
        : {}),
      ...(csrfSafeMethod.has(options.method ?? 'GET') || isExternalUrl(url)
        ? {}
        : { 'X-CSRFToken': csrfToken! }),
      ...headers,
      ...(typeof accept === 'string' ? { Accept: accept } : {}),
    },
  })
    .then(async (response) => Promise.all([response, response.text()]))
    .then(([{ status, ok }, text]: [Response, string]) => {
      if (expectedResponseCodes.includes(status)) {
        if (ok && accept === 'application/json') {
          try {
            return { data: JSON.parse(text), status };
          } catch {
            console.error('Invalid response', text);
            throw new TypeError(`Failed parsing JSON response:\n${text}`);
          }
        } else if (ok && accept === 'application/xml') {
          try {
            return {
              data: new window.DOMParser().parseFromString(text, 'text/xml'),
              status,
            };
          } catch {
            console.error('Invalid response', text);
            throw new TypeError(`Failed parsing XML response:\n${text}`);
          }
        } else return { data: text, status };
      } else {
        console.error('Invalid response', text);
        throw new Error(
          `Invalid response code ${status}. Expected one of [${expectedResponseCodes.join(
            ', '
          )}]. Response:\n${text}`
        );
      }
    })
    .catch((error) => {
      const errorMessage = `Error occurred fetching from ${url}:\n${error.stack}`;
      console.error(errorMessage);
      const handleClose = (): void => void view?.remove();
      const view = strict
        ? new UnhandledErrorView({
            title: commonText('backEndErrorDialogTitle'),
            header: commonText('backEndErrorDialogHeader'),
            children: errorMessage,
            onClose: handleClose,
          }).render()
        : undefined;
      throw error;
    });

/**
 * A wrapper for "ajax" for when response data is not needed
 *
 * @returns Response code
 * @throws Rejects promise on errors
 */
export const ping = async (
  url: string,
  options?: PartialBy<Parameters<typeof ajax>[1], 'headers'>,
  additionalOptions?: Parameters<typeof ajax>[2]
): Promise<number> => {
  return ajax<never>(
    url,
    {
      ...options,
      headers: options?.headers ?? {},
    },
    additionalOptions
  ).then(({ status }) => status);
};
