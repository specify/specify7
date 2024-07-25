import type { IR, R, RA } from '../types';
import { setDevelopmentGlobal } from '../types';
import { csrfToken } from './csrfToken';
import { Http } from './definitions';
import { csrfSafeMethod, extractAppResourceId, isExternalUrl } from './helpers';
import { handleAjaxResponse } from './response';

// FEATURE: make all back-end endpoints accept JSON

export type MimeType = 'application/json' | 'text/plain' | 'text/xml';

export type AjaxResponseObject<RESPONSE_TYPE> = {
  /*
   * Parsed response
   * Parser is selected based on the value of options.headers.Accept:
   *   - application/json - json
   *   - text/xml - xml
   *   - else (i.e text/plain) - string
   */
  readonly data: RESPONSE_TYPE;
  readonly response: Response;
  // One of expectedErrors
  readonly status: number;
};

export type AjaxErrorMode = 'dismissible' | 'silent' | 'visible';

/**
 * If making a GET request to a URL before previous request resolved, return
 * the previous promise rather then make a new request.
 */
const pendingRequests: R<Promise<unknown> | undefined> = {};

export type AjaxMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

/**
 * These methods usually don't modify data, so if they fail it is not a big
 * deal. If on the other than POST, PUT, DELETE, or PATCH request fails, it
 * may cause data loss or data corruption
 */
const safeMethods: ReadonlySet<AjaxMethod> = new Set([
  'OPTIONS',
  'GET',
  'HEAD',
]);

export type AjaxProps = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  readonly method?: AjaxMethod;
  /**
   * If object is passed to body, it is stringified and proper HTTP header is set
   * Can wrap request body object in formData() to encode body as form data
   */
  readonly body?: FormData | IR<unknown> | RA<unknown> | string;
  /**
   * Validates and parses response as JSON if 'Accept' header is 'application/json'
   * Validates and parses response as XML if 'Accept' header is 'text/xml'
   */
  readonly headers: IR<string | undefined> & { readonly Accept?: MimeType };
  // REFACTOR: consider including ok,no_response,created by default
  /**
   * Throw if returned response code is an error, and is not on this list.
   * If you want to manually handle some error, add the HTTP code to this list
   */
  readonly expectedErrors?: RA<number>;
  /**
   * If 'visible', spawn a modal error message dialog on crash
   * If 'silent', don't show the error dialog
   * If 'dismissible', show the error dialog, but allow closing it
   */
  readonly errorMode?: AjaxErrorMode;
};

/**
 * All front-end network requests should go through this utility.
 *
 * Wraps native fetch in useful helpers:
 * - Automatically adds CSRF token to non GET requests
 * - Casts response to correct typescript type
 * - Parses JSON and XML responses
 * - Handlers errors (including permission errors)
 * - Helps with request mocking in tests
 */
export async function ajax<RESPONSE_TYPE = string>(
  url: string,
  /** These options are passed directly to fetch() */
  {
    headers: { Accept: accept, ...headers },
    method = 'GET',
    /** Ajax-specific options that are not passed to fetch() */
    expectedErrors = [],
    errorMode = safeMethods.has(method) ? 'dismissible' : 'visible',
    ...options
  }: AjaxProps
): Promise<AjaxResponseObject<RESPONSE_TYPE>> {
  /**
   * When running in a test environment, mock the calls rather than make
   * actual requests
   */
  // REFACTOR: replace this with a mock
  if (process.env.NODE_ENV === 'test') {
    const { ajaxMock } = await import('../../tests/ajax');
    return ajaxMock(url, {
      headers: { Accept: accept, ...headers },
      method,
      expectedErrors,
      errorMode,
      ...options,
    });
  }
  if (method === 'GET' && typeof pendingRequests[url] === 'object')
    return pendingRequests[url] as Promise<AjaxResponseObject<RESPONSE_TYPE>>;
  pendingRequests[url] = fetch(url, {
    ...options,
    method,
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
      ...(csrfSafeMethod.has(method) || isExternalUrl(url)
        ? {}
        : { 'X-CSRFToken': csrfToken }),
      ...headers,
      ...(typeof accept === 'string' ? { Accept: accept } : {}),
    },
  })
    .then(async (response) => Promise.all([response, response.text()]))
    .then(
      ([response, text]: readonly [Response, string]) => {
        extractAppResourceId(url, response);
        return handleAjaxResponse<RESPONSE_TYPE>({
          expectedErrors,
          accept,
          errorMode,
          response,
          text,
        });
      },
      // This happens when request is aborted (i.e, page is restarting)
      (error) => {
        console.error(error);
        const response = new Response(undefined, {
          status: Http.MISDIRECTED,
        });
        Object.defineProperty(response, 'url', { value: url });
        return handleAjaxResponse({
          expectedErrors,
          accept,
          errorMode,
          response,
          text: error.toString(),
        });
      }
    )
    .finally(() => {
      pendingRequests[url] = undefined;
    });

  return pendingRequests[url] as Promise<AjaxResponseObject<RESPONSE_TYPE>>;
}

setDevelopmentGlobal('_ajax', ajax);
