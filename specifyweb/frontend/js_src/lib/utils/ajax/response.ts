import { parseXml } from '../../components/AppResources/parseXml';
import { handleAjaxError } from '../../components/Errors/FormatError';
import type { RA, ValueOf } from '../types';
import { filterArray } from '../types';
import { Http, httpCodeToErrorMessage } from './definitions';
import type { AjaxErrorMode, AjaxResponseObject, MimeType } from './index';

/**
 * Handle network response (parse the data, handle possible errors)
 */
export function handleAjaxResponse<RESPONSE_TYPE = string>({
  expectedErrors,
  accept,
  response,
  errorMode,
  text,
  data,
}: {
  readonly expectedErrors: RA<number>;
  readonly accept: MimeType | undefined;
  readonly response: Response;
  readonly errorMode: AjaxErrorMode;
  readonly text: string;
  readonly data?: unknown;
}): AjaxResponseObject<RESPONSE_TYPE> {
  // BUG: silence all errors if the page begun reloading
  try {
    if (response.ok || expectedErrors.includes(response.status)) {
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
      } else if (response.ok && accept === 'text/xml') {
        const parsed = parseXml(text);
        if (typeof parsed === 'object')
          return {
            // Assuming that RESPONSE_TYPE extends Document
            data: parsed as unknown as RESPONSE_TYPE,
            response,
            status: response.status,
          };
        else
          throw {
            type: 'xmlParseFailure',
            statusText: `Failed parsing XML response: ${parsed}`,
            responseText: text,
          };
      } else if (response.ok && accept === 'application/octet-stream') {
        return {
          data: data as unknown as RESPONSE_TYPE,
          response,
          status: response.status,
        };
      } else
        return {
          // Assuming that RESPONSE_TYPE extends string
          data: text as unknown as RESPONSE_TYPE,
          response,
          status: response.status,
        };
    } else if (response.status === Http.FORBIDDEN)
      throw {
        type: 'permissionDenied',
        statusText: "You don't have a permission to do this action",
        responseText: text,
      };
    else {
      throw {
        type: 'invalidResponseCode',
        statusText: filterArray([
          `Invalid response code ${response.status}.`,
          httpCodeToErrorMessage[response.status as ValueOf<typeof Http>],
          'Response:',
        ]),
        responseText: text,
      };
    }
  } catch (error) {
    console.error(error);
    handleAjaxError(error, response, errorMode);
  }
}
