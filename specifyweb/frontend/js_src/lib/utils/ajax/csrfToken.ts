/**
 * Needed by Django for securiy reasons
 *
 * See more: https://docs.djangoproject.com/en/4.0/ref/csrf/
 */

import { f } from '../functools';
import { setDevelopmentGlobal } from '../types';
import { readCookie } from './cookies';

/**
 * Back-end passes initial data to front-end though templates as JSON in
 * <script> tags
 */
export function parseDjangoDump<T>(id: string): T | undefined {
  const value =
    globalThis.document?.getElementById(id)?.textContent ?? undefined;
  return f.maybe(value, JSON.parse);
}

export const csrfToken =
  readCookie('csrftoken') ?? parseDjangoDump<string>('csrf-token') ?? '';

setDevelopmentGlobal('_csrf', csrfToken);
