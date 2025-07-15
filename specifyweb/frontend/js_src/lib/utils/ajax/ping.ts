import type { PartialBy } from '../types';
import type { AjaxProps } from './index';
import { ajax } from './index';

/**
 * A wrapper for "ajax" for when response data is not needed
 *
 * @returns Response code
 * @throws Rejects promise on errors
 */
export const ping = async (
  url: string,
  options?: PartialBy<AjaxProps, 'headers'>
): Promise<number> =>
  ajax<never>(url, {
    ...options,
    headers: options?.headers ?? {},
  }).then(({ status }) => status);
