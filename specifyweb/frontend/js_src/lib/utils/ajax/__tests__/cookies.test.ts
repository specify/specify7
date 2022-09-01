import { mockTime } from '../../../tests/helpers';
import { createCookieString, readCookie } from '../cookies';

mockTime();

test('createCookieString', () =>
  expect(createCookieString('cookie-name', 'SOME_VALUE', 4)).toBe(
    'cookie-name=SOME_VALUE; expires=Sun, 04 Sep 2022 08:37:10 GMT; path=/'
  ));

test('can readCookie', () => {
  document.cookie = `cookie-name=SOME_VALUE; expires=Sat, 03 Sep 2022 18:20:20 GMT; path=/`;
  expect(readCookie('cookie-name')).toBe('SOME_VALUE');
});
