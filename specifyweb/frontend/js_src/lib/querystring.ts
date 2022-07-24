/**
 * Parse URL Query parameters
 */

import { keysToLowerCase } from './helpers';
import type { IR } from './types';

export function formatUrl(
  url: string,
  parameters: IR<string>,
  toLowerCase = true
): string {
  const urlObject = new URL(url, getUrl());
  urlObject.search = new URLSearchParams({
    ...Object.fromEntries(urlObject.searchParams),
    ...(toLowerCase ? keysToLowerCase(parameters) : parameters),
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
