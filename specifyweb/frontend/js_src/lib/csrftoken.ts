/**
 * Needed by Django for securiy reasons
 *
 * See more: https://docs.djangoproject.com/en/4.0/ref/csrf/
 */

import { parseDjangoDump } from './components/splashscreen';
import { readCookie } from './cookies';

export const csrfToken =
  readCookie('csrftoken') ?? parseDjangoDump<string>('csrf-token');

if (process.env.NODE_ENV !== 'production')
  // @ts-expect-error Exposing token as global when in development
  globalThis._csrf = csrfToken;
