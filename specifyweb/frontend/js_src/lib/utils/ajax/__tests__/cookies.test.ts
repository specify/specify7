import { createCookieString, readCookie } from '../cookies';

test('createCookieString', () => {
  Date.now = () => 1661883620145;
  expect(createCookieString('cookie-name', 'SOME_VALUE', 4)).toBe(
    'cookie-name=SOME_VALUE; expires=Sat, 03 Sep 2022 18:20:20 GMT; path=/'
  );
});

test('can readCookie', () => {
  document.cookie = `cookie-name=SOME_VALUE; expires=Sat, 03 Sep 2022 18:20:20 GMT; path=/`;
  expect(readCookie('cookie-name')).toBe('SOME_VALUE');
});
