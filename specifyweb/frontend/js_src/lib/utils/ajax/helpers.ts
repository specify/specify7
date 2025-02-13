import { formatUrl } from '../../components/Router/queryString';
import { f } from '../functools';
import type { IR, R, RA } from '../types';
import { setDevelopmentGlobal } from '../types';

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

/**
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
  data: IR<Blob | RA<number | string> | boolean | number | string | undefined>
): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) =>
    value === undefined
      ? undefined
      : formData.append(
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

export const appResourceIds: R<number | undefined> = {};
setDevelopmentGlobal('_appResourceIds', appResourceIds);

/**
 * Keep track of IDs of fetched app resources. This powers the app resource
 * edit button in schema config
 */
export function extractAppResourceId(url: string, response: Response): void {
  const parsed = new URL(url, globalThis.location.origin);
  if (parsed.pathname === '/context/app.resource')
    appResourceIds[parsed.searchParams.get('name') ?? ''] = f.parseInt(
      response.headers.get('X-Record-ID') ?? undefined
    );
}

export const getAppResourceUrl = (
  name: string,
  quiet: 'quiet' | undefined = undefined,
  additionalDefault: boolean = false
): string => formatUrl('/context/app.resource', {
    name,
    quiet: quiet === 'quiet' ? '' : undefined,
    additionaldefault: additionalDefault ? 'true' : undefined
  });
