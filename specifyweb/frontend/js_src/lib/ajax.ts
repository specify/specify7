import csrfToken from './csrftoken';
import { UnhandledErrorView } from './errorview';
import type { IR, RA } from './types';

// These HTTP methods do not require CSRF protection
export const csrfSafeMethod = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export function formData(data: IR<string>): FormData {
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

export const HTTP = {
  OK: 200,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAVAILABLE: 503,
};

/**
 * Allows throwing errors from expressions, rather than statements
 */
export function error(message: string): never {
  throw new Error(message);
}

/**
 * Wraps native fetch in useful helpers
 * It is intended as a replacement for jQuery's ajax
 *
 * @remarks
 * Automatically adds CSRF token to non GET requests
 * Validates response as JSON if JSON is expected in the response
 * Casts response to the correct typescript type
 * Logs error messages to the console
 * If object is passed to body, it is stringified and proper HTTP header is set
 */
export default async function ajax<RESPONSE_TYPE = string>(
  url: string,
  options: Omit<RequestInit, 'body' | 'headers'> & {
    body?: string | IR<unknown> | FormData;
    headers?: IR<string>;
  } = {},
  {
    expectedResponseCodes = [HTTP.OK],
    strict = true,
  }: {
    /*
     * Throw if returned response code is not what expected
     * If you want to manually handle some error, add that error code here
     */
    readonly expectedResponseCodes?: RA<number>;
    // If strict, spawn a modal error message dialog on crash
    readonly strict?: boolean;
  } = {}
): Promise<{
  /*
   * Parsed response (parser is selected based the value of options.headers.Accept:
   *   - application/json - json
   *   - application/xml - xml
   *   - else - string
   */
  readonly data: RESPONSE_TYPE;
  // One of expectedResponseCodes
  readonly status: number;
}> {
  return fetch(url, {
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
      ...options.headers,
    },
  })
    .then(async (response) => Promise.all([response, response.text()]))
    .then(([{ status, ok }, text]: [Response, string]) => {
      if (expectedResponseCodes.includes(status)) {
        if (ok && options.headers?.Accept === 'application/json') {
          try {
            return { data: JSON.parse(text), status };
          } catch {
            console.error('Invalid response', text);
            throw new TypeError(`Failed parsing JSON response:\n${text}`);
          }
        } else if (ok && options.headers?.Accept === 'application/xml') {
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
      const errorMessage = `Error occurred fetching from ${url}:\n${error.toString()}`;
      console.error(errorMessage);
      if (strict) new UnhandledErrorView({ response: errorMessage }).render();
      throw error;
    });
}
