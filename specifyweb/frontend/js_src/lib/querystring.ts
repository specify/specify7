/**
 * Parse URL Query parameters
 */

import { keysToLowerCase } from './helpers';
import type { IR } from './types';

const href =
  typeof window === 'object' ? window.location.href : 'http://localhost/';
export function formatUrl(
  url: string,
  parameters: IR<string>,
  toLowerCase = true
): string {
  const urlObject = new URL(url, href);
  urlObject.search = new URLSearchParams({
    ...Object.fromEntries(urlObject.searchParams),
    ...(toLowerCase ? keysToLowerCase(parameters) : parameters),
  }).toString();
  // If received a URL without hostname, return a URL without hostname
  return url.startsWith('/')
    ? `${urlObject.pathname}${urlObject.search}${urlObject.hash}`
    : urlObject.toString();
}

export const parseUrl = (url: string = href): IR<string> =>
  Object.fromEntries(new URL(url, href).searchParams);
