/**
 * CookieStore API is better suited for this, but it requires HTTPs and is
 * asynchronous
 */

const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_DURATION = 90;

export function createCookie(
  name: string,
  value: string,
  days: number = DEFAULT_DURATION
): void {
  document.cookie = Object.entries({
    [name]: value,
    expires: new Date(Date.now() + days * DAY).toUTCString(),
    path: '/',
  })
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

export function readCookie(name: string): string | undefined {
  if (typeof document !== 'undefined' && document.cookie)
    for (const cookie of document.cookie.split(';')) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(`${name}=`))
        return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  return undefined;
}

export const eraseCookie = (name: string): void => createCookie(name, '', -1);
