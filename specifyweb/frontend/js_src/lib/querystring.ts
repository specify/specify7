/**
 * Parse URL Query parameters
 */

import { keysToLowerCase } from './datamodelutils';
import type { IR } from './types';

export function formatUrl(
  url: string,
  parameters: IR<string>,
  toLowerCase = true
): string {
  const urlObject = new URL(url, window.location.href);
  urlObject.search = new URLSearchParams({
    ...Object.fromEntries(urlObject.searchParams),
    ...(toLowerCase ? keysToLowerCase(parameters) : parameters),
  }).toString();
  // If received a URL without hostname, return a URL without hostname
  return url.startsWith('/')
    ? `${urlObject.pathname}${urlObject.search}${urlObject.hash}`
    : urlObject.toString();
}

export const parseUrl = (url: string = window.location.href): IR<string> =>
  Object.fromEntries(new URL(url, window.location.href).searchParams);
