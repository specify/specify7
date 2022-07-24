/**
 * Needed by Django for securiy reasons
 *
 * See more: https://docs.djangoproject.com/en/4.0/ref/csrf/
 */

import { readCookie } from './cookies';

/**
 * Back-end passes initial data to front-end though templates as JSON in
 * <script> tags
 */
export const parseDjangoDump = <T>(id: string): T =>
  JSON.parse(globalThis.document?.getElementById(id)?.textContent ?? '[]');

export const csrfToken =
  readCookie('csrftoken') ?? parseDjangoDump<string>('csrf-token');

if (process.env.NODE_ENV !== 'production')
  // @ts-expect-error Exposing token as global when in development
  globalThis._csrf = csrfToken;
