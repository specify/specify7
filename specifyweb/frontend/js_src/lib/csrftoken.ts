import { readCookie } from './cookies';

export const csrfToken = readCookie('csrftoken');
