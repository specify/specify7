import { theories } from '../../tests/utils';
import { getDateInputValue } from '../dayJs';

/**
 * If this test fails, see https://stackoverflow.com/a/56482581/8584605
 */
test('tests should use UTC time zone', () =>
  expect(new Date().getTimezoneOffset()).toBe(0));

theories(getDateInputValue, [
  { in: [new Date('2022-08-31T02:02:53.363Z')], out: '2022-08-31' },
]);
