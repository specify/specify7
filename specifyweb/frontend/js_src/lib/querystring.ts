import type { IR } from './types';

const toAbsoluteUrl = (url: string): string =>
  url.startsWith('/') ? `${window.location.origin}/${url}` : url;

export function format(url: string, parameters: IR<string>): string {
  const urlObject = new URL(toAbsoluteUrl(url));
  urlObject.search = new URLSearchParams({
    ...Object.fromEntries(urlObject.searchParams),
    ...parameters,
  }).toString();
  return urlObject.toString();
}

export const parse = (url: string = window.location.href): IR<string> =>
  Object.fromEntries(new URL(toAbsoluteUrl(url)).searchParams);
