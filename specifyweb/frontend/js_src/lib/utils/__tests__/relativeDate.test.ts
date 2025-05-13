import { mockTime } from '../../tests/helpers';
import { testTime } from '../../tests/testTime';
import { parseAnyDate, today } from '../relativeDate';

mockTime();

describe('parseAnyDate', () => {
  test('empty case', () => expect(parseAnyDate('')).toBeUndefined());
  test('invalid case', () => expect(parseAnyDate('var')).toBeUndefined());
  test('absolute date', () =>
    expect(parseAnyDate(testTime.toJSON())).toEqual(testTime));
  test(today, () => expect(parseAnyDate('today')).toEqual(testTime));
  test(`${today} - 2 secondsss`, () => {
    /*
     * Even though the date changes every time the test is run, this test
     * is checking for a difference in seconds within relative dates, which
     * doesn't change
     */
    const target = new Date();
    target.setSeconds(target.getSeconds() - 2);

    expect(parseAnyDate(`${today} - 2 secondsss`)).toEqual(target);
  });
  test(` ${today}   +   5  minutes  `, () => {
    const target = new Date();
    target.setMinutes(target.getMinutes() + 5);

    expect(parseAnyDate(` ${today}   +   5  minutes  `)).toEqual(target);
  });
  test('TODAY - 10 DAYS', () => {
    const target = new Date();
    target.setDate(target.getDate() - 10);

    expect(parseAnyDate('TODAY - 10 DAYS')).toEqual(target);
  });
  test(`${today}+7weeks`, () => {
    const target = new Date();
    target.setDate(target.getDate() + 7 * 7);

    expect(parseAnyDate(`${today}+7weeks`)).toEqual(target);
  });
  test(`${today} -7 month`, () => {
    const target = new Date();
    target.setMonth(target.getMonth() - 7);

    expect(parseAnyDate(`${today} -7 month`)).toEqual(target);
  });
  test(`${today} + 2 years`, () => {
    const target = new Date();
    target.setFullYear(target.getFullYear() + 2);

    expect(parseAnyDate(`${today} + 2 years`)).toEqual(target);
  });
  test('2022-06-09T00:04:18.232Z', () =>
    expect(parseAnyDate('2022-06-09T00:04:18.232Z')?.getTime()).toEqual(
      new Date('2022-06-09T00:04:18.232Z').getTime()
    ));
});
