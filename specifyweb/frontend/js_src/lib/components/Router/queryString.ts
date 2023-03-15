/**
 * Parse URL Query parameters
 */

import type { Path } from '@remix-run/router';
import { resolvePath } from '@remix-run/router';

import type { IR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';

export function formatUrl(
  url: string,
  parameters: IR<number | string | null | undefined>,
  toLowerCase = true
): string {
  const urlObject = new URL(url, getUrl());
  urlObject.search = new URLSearchParams({
    ...Object.fromEntries(urlObject.searchParams),
    ...Object.fromEntries(
      filterArray(
        Object.entries(
          toLowerCase ? keysToLowerCase(parameters) : parameters
        ).map(([key, value]) =>
          value === undefined || value === null
            ? undefined
            : [key, value.toString()]
        )
      )
    ),
  }).toString();
  // If received a URL without hostname, return a URL without hostname
  return url.startsWith('/') ? locationToUrl(urlObject) : urlObject.toString();
}

export const locationToUrl = (location: Path): string =>
  `${location.pathname}${location.search}${location.hash}`;

const getUrl = (): string => globalThis.location?.href ?? 'http://localhost/';

/* Use "useSearchParam" instead of this whenever possible */
export const parseUrl = (url: string = getUrl()): IR<string> =>
  Object.fromEntries(new URL(url, getUrl()).searchParams);

export function resolveRelative(
  relativePath: string,
  currentUrl = getUrl()
): string {
  const bareUrl = new URL(currentUrl).pathname;
  const url = resolvePath(relativePath, bareUrl);
  const query = new URL(relativePath, currentUrl);
  const search = {
    ...parseUrl(currentUrl),
    ...Object.fromEntries(query.searchParams),
  };
  const queryString = new URLSearchParams(search).toString();
  const fullUrl = {
    pathname: url.pathname,
    search: queryString.length === 0 ? '' : `?${queryString}`,
    hash: url.hash,
  };
  return locationToUrl(fullUrl);
}
