import { RA } from '../types';
import { parseXml } from '../../components/AppResources/codeMirrorLinters';
import { Http } from './helpers';
import { formatList } from '../../components/Atoms/Internationalization';
import { sortFunction } from '../utils';
import { f } from '../functools';
import { AjaxResponseObject, MimeType } from './index';
import { handleAjaxError } from '../../components/Errors/FormatError';

/**
 * Handle network response (parse the data, handle possible errors)
 */
export function handleAjaxResponse<RESPONSE_TYPE = string>({
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
  // BUG: silence all errors if the page begun reloading
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
      console.error('Invalid response', text);
      throw {
        type: 'invalidResponseCode',
        statusText: `Invalid response code ${response.status}. Expected ${
          expectedResponseCodes.length === 1 ? '' : 'one of'
        } ${formatList(
          Array.from(expectedResponseCodes)
            .sort(sortFunction(f.id))
            .map(f.toString)
        )}. Response:`,
        responseText: text,
      };
    }
  } catch (error) {
    console.error(error);
    handleAjaxError(error, response, strict);
  }
}
