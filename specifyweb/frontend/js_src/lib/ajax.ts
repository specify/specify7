import { csrfSafeMethod, Http, isExternalUrl } from './ajaxUtils';
import { csrfToken } from './csrftoken';
import type { IR, RA } from './types';
import { handleAjaxResponse } from './ajaxResponse';

// REFACTOR: add a central place for all API endpoint definitions

// FEATURE: make all back-end endpoints accept JSON

export type MimeType = 'application/json' | 'application/xml' | 'text/plain';

export type AjaxResponseObject<RESPONSE_TYPE> = {
  /*
   * Parsed response
   * Parser is selected based on the value of options.headers.Accept:
   *   - application/json - json
   *   - application/xml - xml
   *   - else (i.e text/plain) - string
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
  /** These options are passed directly to fetch() */
  {
    headers: { Accept: accept, ...headers },
    ...options
  }: Omit<RequestInit, 'body' | 'headers'> & {
    /**
     * If object is passed to body, it is stringified and proper HTTP header is set
     * Can wrap request body object in formData() to encode body as form data
     */
    readonly body?: FormData | IR<unknown> | RA<unknown> | string;
    /**
     * Validates and parses response as JSON if 'Accept' header is 'application/json'
     * Validates and parses response as XML if 'Accept' header is 'application/xml'
     */
    readonly headers: IR<string | undefined> & { readonly Accept?: MimeType };
  },
  /** Ajax-specific options that are not passed to fetch() */
  {
    expectedResponseCodes = [Http.OK],
    strict = true,
  }: {
    /**
     * Throw if returned response code is not what expected
     * If you want to manually handle some error, add that error code here
     */
    readonly expectedResponseCodes?: RA<number>;
    /**
     * If strict, spawn a modal error message dialog on crash
     * In either case, error messages are logged to the console
     */
    readonly strict?: boolean;
  } = {}
): Promise<AjaxResponseObject<RESPONSE_TYPE>> =>
  /**
   * When running in a test environment, mock the calls rather than make
   * actual requests
   */
  // REFACTOR: replace this with a mcok
  process.env.NODE_ENV === 'test'
    ? import('./tests/ajax').then(({ ajaxMock }) =>
        ajaxMock(url, {}, { expectedResponseCodes })
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
        .then(([response, text]: readonly [Response, string]) =>
          handleAjaxResponse({
            expectedResponseCodes,
            accept,
            strict,
            response,
            text,
          })
        );
