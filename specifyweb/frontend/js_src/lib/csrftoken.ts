import { parseDjangoDump } from './components/splashscreen';
import { readCookie } from './cookies';

export const csrfToken =
  readCookie('csrftoken') ?? parseDjangoDump<string>('csrf-token');
