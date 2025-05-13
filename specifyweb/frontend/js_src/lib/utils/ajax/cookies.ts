/**
 * CookieStore API is better suited for this, but it requires HTTPs and is
 * asynchronous
 */
import { DAY } from '../../components/Atoms/timeUnits';

const DEFAULT_DURATION = 90;

export const createCookieString = (
  name: string,
  value: string,
  days: number
): string =>
  Object.entries({
    [name]: value,
    expires: new Date(Date.now() + days * DAY).toUTCString(),
    path: '/',
  })
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

export function createCookie(
  name: string,
  value: string,
  days: number = DEFAULT_DURATION
): void {
  document.cookie = createCookieString(name, value, days);
}

export function readCookie(name: string): string | undefined {
  if (typeof document === 'object' && document.cookie)
    for (const cookie of document.cookie.split(';')) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(`${name}=`))
        return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  return undefined;
}
