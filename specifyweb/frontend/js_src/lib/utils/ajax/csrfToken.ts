/**
 * Needed by Django for securiy reasons
 *
 * See more: https://docs.djangoproject.com/en/4.0/ref/csrf/
 */

import { setDevelopmentGlobal as setDevelopmentGlobal } from '../types';
import { readCookie } from './cookies';

/**
 * Back-end passes initial data to front-end though templates as JSON in
 * <script> tags
 */
export const parseDjangoDump = <T>(id: string): T =>
  JSON.parse(globalThis.document?.getElementById(id)?.textContent ?? '[]');

export const csrfToken =
  readCookie('csrftoken') ?? parseDjangoDump<string>('csrf-token');

setDevelopmentGlobal('_csrf', csrfToken);
