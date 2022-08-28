import { IR, RA } from '../types';

// These HTTP methods do not require CSRF protection
export const csrfSafeMethod = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

/* An enum of HTTP status codes back-end commonly returns */
export const Http = {
  // You may add others codes as needed
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  UNAVAILABLE: 503,
} as const;

export const isExternalUrl = (url: string): boolean =>
  /*
   * Blob URLs may point to the same origin, but should be treated as external
   * by the navigator
   */
  url.startsWith('blob:') ||
  new URL(url, globalThis.location.origin).origin !==
    globalThis.location.origin;

// Make sure the given URL is from current origin and give back the relative path
export function toRelativeUrl(url: string): string | undefined {
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
