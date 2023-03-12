/**
 * Parse URL Query parameters
 */

import type { IR } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';

export function formatUrl(
  url: string,
  parameters: IR<string | number | undefined | null>,
  toLowerCase = true
): string {
  const urlObject = new URL(url, getUrl());
  urlObject.search = new URLSearchParams({
    ...Object.fromEntries(urlObject.searchParams),
    ...Object.fromEntries(
      Object.entries(
        toLowerCase ? keysToLowerCase(parameters) : parameters
      ).map(([key, value]) => [key, value?.toString() ?? ''])
    ),
  }).toString();
  // If received a URL without hostname, return a URL without hostname
  return url.startsWith('/')
    ? `${urlObject.pathname}${urlObject.search}${urlObject.hash}`
    : urlObject.toString();
}

const getUrl = (): string => globalThis.location?.href ?? 'http://localhost/';

/* Use "useSearchParam" instead of this whenever possible */
export const parseUrl = (url: string = getUrl()): IR<string> =>
  Object.fromEntries(new URL(url, getUrl()).searchParams);
