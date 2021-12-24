import { IR, RA } from './components/wbplanview';
import csrfToken from './csrftoken';

export function formData(data: IR<string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
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
export default async function ajax<RESPONSE_TYPE>(
  url: string,
  options: Omit<RequestInit, 'body'> & {
    body?: string | IR<unknown> | FormData;
  } = {},
  {
    expectedResponseCodes = [200],
    expectsJson = true,
  }: {
    // Throw if returned response code is not what expected
    readonly expectedResponseCodes?: RA<number>;
    // Parse JSON response
    readonly expectsJson?: boolean;
  } = {}
): Promise<{ readonly data: RESPONSE_TYPE; readonly status: number }> {
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
      ...(options.method === 'GET' ? {} : { 'X-CSRFToken': csrfToken! }),
      ...options.headers,
    },
  })
    .then((response) =>
      Promise.all<number, string>([response.status, response.text()])
    )
    .then(([status, text]) => {
      if (expectedResponseCodes.includes(status)) {
        if (expectsJson) {
          try {
            return { data: JSON.parse(text), status };
          } catch (error) {
            console.error('Invalid response', text);
            throw new Error('Failed parsing JSON response');
          }
        } else return { data: text, status };
      } else {
        console.error('Invalid response', text);
        throw new Error(
          `Invalid response code ${status}. Expected one of [${expectedResponseCodes.join(
            ', '
          )}]`
        );
      }
    })
    .catch((error) => {
      console.error(
        `Error occurred fetching from ${url}:\n${error.toString()}`
      );
      throw error;
    });
}
