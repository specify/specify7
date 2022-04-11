import { handleAjaxError } from './components/errorboundary';
import { csrfToken } from './csrftoken';
import type { IR, PartialBy, RA } from './types';

const reIsAbsolute = /^(?:[a-z]+:)?\/\//i;
export const isRelativeUrl = (url: string): boolean =>
  reIsAbsolute.exec(url) === null;
export const isExternalUrl = (url: string): boolean =>
  // Relative url is not external. Passing a relative URL to new URL() throws
  ['blob:', 'data:'].some((scheme) => url.startsWith(scheme))
    ? true
    : isRelativeUrl(url)
    ? false
    : new URL(url).origin !== window.location.origin;

// These HTTP methods do not require CSRF protection
export const csrfSafeMethod = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

// TODO: add a central place for all API endpoint definitions

// TODO: make all back-end endpoints accept JSON
export function formData(data: IR<string | Blob>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

/* An enum of HTTP status codes back-end commonly returns */
export const Http = {
  // You may add others codes as needed
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  UNAVAILABLE: 503,
} as const;

export type MimeType = 'application/json' | 'application/xml' | 'text/plain';

export type AjaxResponseObject<RESPONSE_TYPE> = {
  /*
   * Parsed response (parser is selected based on the value of options.headers.Accept:
   *   - application/json - json
   *   - application/xml - xml
   *   - else - string
   */
  readonly data: RESPONSE_TYPE;
  readonly response: Response;
  // One of expectedResponseCodes
  readonly status: number;
};

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
    headers: { Accept: accept, ...headers },
    ...options
  }: Omit<RequestInit, 'body' | 'headers'> & {
    /*
     * If object is passed to body, it is stringified and proper HTTP header is set
     * Can wrap request body object in formData() to encode body as form data
     */
    body?: string | RA<unknown> | IR<unknown> | FormData;
    /*
     * Validates and parses response as JSON if 'Accept' header is 'application/json'
     * Validates and parses response as XML if 'Accept' header is 'application/xml'
     */
    headers: IR<string | undefined> & { Accept?: MimeType };
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
): Promise<AjaxResponseObject<RESPONSE_TYPE>> =>
  process.env.NODE_ENV === 'test'
    ? import('./tests/ajax').then(async ({ interceptRequest }) =>
        interceptRequest<RESPONSE_TYPE>(url)
      )
    : fetch(url, {
        ...options,
        body:
          typeof options.body === 'object' &&
          !(options.body instanceof FormData)
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
            : { 'X-CSRFToken': csrfToken }),
          ...headers,
          ...(typeof accept === 'string' ? { Accept: accept } : {}),
        },
      })
        .then(async (response) => Promise.all([response, response.text()]))
        .then(([response, text]: [Response, string]) =>
          handleResponse({
            expectedResponseCodes,
            accept,
            strict,
            response,
            text,
          })
        );

export function handleResponse<RESPONSE_TYPE = string>({
  expectedResponseCodes,
  accept,
  response,
  strict,
  text,
}: {
  readonly expectedResponseCodes: RA<number>;
  readonly accept: MimeType | undefined;
  readonly response: Response;
  readonly strict: boolean;
  readonly text: string;
}): AjaxResponseObject<RESPONSE_TYPE> {
  try {
    if (expectedResponseCodes.includes(response.status)) {
      if (response.ok && accept === 'application/json') {
        try {
          return { data: JSON.parse(text), response, status: response.status };
        } catch {
          throw {
            type: 'jsonParseFailure',
            statusText: 'Failed parsing JSON response:',
            responseText: text,
          };
        }
      } else if (response.ok && accept === 'application/xml') {
        try {
          return {
            data: new window.DOMParser().parseFromString(
              text,
              'text/xml'
            ) as unknown as RESPONSE_TYPE,
            response,
            status: response.status,
          };
        } catch {
          throw {
            type: 'xmlParseFailure',
            statusText: 'Failed parsing XML response:',
            responseText: text,
          };
        }
      } else
        return {
          data: text as unknown as RESPONSE_TYPE,
          response,
          status: response.status,
        };
    } else if (response.status === Http.FORBIDDEN) {
      throw {
        type: 'permissionDenied',
        statusText: "You don't have a permission to do this action",
        responseText: text,
      };
    } else {
      console.error('Invalid response', text);
      throw {
        type: 'invalidResponseCode',
        statusText: `Invalid response code ${
          response.status
        }. Expected one of [${expectedResponseCodes.join(', ')}]. Response:`,
        responseText: text,
      };
    }
  } catch (error) {
    handleAjaxError(error, response, strict);
  }
}

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
