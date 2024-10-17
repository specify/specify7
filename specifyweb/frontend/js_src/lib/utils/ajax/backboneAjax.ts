import { Backbone } from '../../components/DataModel/backbone';
import { promiseToXhr } from '../../components/DataModel/resourceApi';
import { formatUrl } from '../../components/Router/queryString';
import { f } from '../functools';
import type { RA, ValueOf } from '../types';
import { defined } from '../types';
import { Http } from './definitions';
import type { AjaxErrorMode, AjaxMethod } from './index';
import { ajax } from './index';

let expectedErrors: RA<ValueOf<typeof Http>> | undefined = undefined;
let requestCallback: ((status: number) => void) | undefined;
let errorMessageMode: AjaxErrorMode | undefined;

/**
 * Since arguments can't be passed directly to the Backbone.ajax call, this
 * allows to partially intercept the call
 */
export function hijackBackboneAjax<T>(
  expectedErrorCodes: RA<ValueOf<typeof Http>>,
  callback: () => T,
  successCallback?: (status: number) => void,
  errorMode: AjaxErrorMode = 'visible'
): T {
  expectedErrors = expectedErrorCodes;
  requestCallback = successCallback;
  errorMessageMode = errorMode;
  const value = callback();
  requestCallback = undefined;
  expectedErrors = undefined;
  errorMessageMode = undefined;
  return value;
}

/**
 * Makes Backbone use fetch() API instead of JQuery so that all errors
 * can be handled consistently in a single place
 */
Backbone.ajax = function (request): JQueryXHR {
  if (request === undefined) throw new Error('Undefined Request');
  const url = defined(
    request.url,
    'Unable to make a Backbone.ajax call as URL is undefined'
  );
  const requestCallbackCopy = requestCallback;
  return promiseToXhr(
    ajax(
      request.type === 'GET' && typeof request.data === 'object'
        ? formatUrl(url, request.data ?? {})
        : url,
      {
        method: request.type as AjaxMethod,
        headers: {
          Accept: request.type === 'DELETE' ? 'text/plain' : 'application/json',
          'Content-Type':
            typeof request.contentType === 'string'
              ? request.contentType
              : undefined,
        },
        body: request.type === 'GET' ? undefined : request.data,
        expectedErrors,
        errorMode: errorMessageMode,
      }
    )
      .then(({ data, status }) => {
        requestCallbackCopy?.(status);
        if (f.includes([Http.CONFLICT, Http.NOT_FOUND], status)) throw new Error(data);
        else if (typeof request.success === 'function')
          request.success(data, 'success', undefined as never);
      })
      .catch((error) => {
        typeof request.error === 'function'
          ? request.error(error, 'error', undefined as never)
          : undefined;
        throw error;
      })
  );
};
