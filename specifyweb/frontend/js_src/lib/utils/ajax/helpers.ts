import type { IR, RA } from '../types';

// These HTTP methods do not require CSRF protection
export const csrfSafeMethod = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export const isExternalUrl = (url: string): boolean =>
  /*
   * Blob URLs may point to the same origin, but should be treated as external
   * by the navigator
   */
  url.startsWith('blob:') ||
  new URL(url, globalThis.location.origin).origin !==
    globalThis.location.origin;

/*
 * Make sure the given URL is from current origin and give it back without
 * domain name
 */
export function toLocalUrl(url: string): string | undefined {
  const parsed = new URL(url, globalThis.location.origin);
  return parsed.origin === globalThis.location.origin
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : undefined;
}

/**
 * Convert JSON object to FormData.
 * Some endpoints accept form data rather than stringified JSON.
 * Just wrap your JS object in a call to formData() before passing it as a
 * "body" to ajax()
 */
export function formData(
  data: IR<Blob | RA<number | string> | boolean | number | string>
): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) =>
    formData.append(
      key,
      Array.isArray(value)
        ? JSON.stringify(value)
        : typeof value === 'number'
        ? value.toString()
        : typeof value === 'boolean'
        ? value.toString()
        : value
    )
  );
  return formData;
}
