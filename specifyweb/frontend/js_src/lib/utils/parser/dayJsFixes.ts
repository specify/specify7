import type { PartialDatePrecision } from '../../components/FormPlugins/useDatePrecision';
import { dayjs } from '../dayJs';
import { f } from '../functools';
import { databaseDateFormat } from './dateConfig';
import { fullDateFormat, monthFormat } from './dateFormat';

/**
 * Parse date using the current formatters, while working arround day.js bugs
 * REFACTOR: migrate from day.js to date-fns
 */
export function parseDate(
  precision: PartialDatePrecision,
  value: string
): ReturnType<typeof dayjs> {
  return (
    fixDayJsBugs(precision, value) ??
    dayjs(
      value,
      /*
       * The date would be in the first format if browser supports
       * input[type="date"] or input[type="month"]
       * The date would be in the second format if browser does not support
       * those inputs, or on date paste
       */
      precision === 'full'
        ? [databaseDateFormat, fullDateFormat()]
        : [
            ...(precision === 'year' ? ['YYYY'] : []),
            'YYYY-MM',
            monthFormat(),
            fullDateFormat(),
          ],
      true
    )
  );
}

/**
 * Several bugs have been discovered in day.js in the process of testing
 * Specify 7. The bugs are present in the latest stable version as of this
 * writing (1.11.4).
 * Day.js 2.0 is currently in beta. Need to wait for 2.0 to get released or
 * migrate to date-fns.
 */
function fixDayJsBugs(
  precision: PartialDatePrecision,
  value: string
): ReturnType<typeof dayjs> | undefined {
  if (precision === 'month-year') return unsafeParseMonthYear(value);
  else if (precision === 'full') return unsafeParseFullDate(value);
  else return undefined;
}

/**
 * An ugly workaround for a bug in day.js where any date in the MM/YYYY format is
 * parsed as an invalid date.
 */
function unsafeParseMonthYear(
  value: string
): ReturnType<typeof dayjs> | undefined {
  const parsed = /(\d{2})\D(\d{4})/u.exec(value)?.slice(1);
  if (parsed === undefined) return undefined;
  const [month, year] = parsed.map(f.unary(Number.parseInt));
  return dayjs(new Date(year, month - 1));
}

/**
 * An ugly workaround for a bug in day.js where any date in the DD/MM/YYY format
 * is parsed as an invalid date.
 */
function unsafeParseFullDate(
  value: string
): ReturnType<typeof dayjs> | undefined {
  if (fullDateFormat().toUpperCase() !== 'DD/MM/YYYY') return;
  const parsed = /(\d{2})\D(\d{2})\D(\d{4})/u.exec(value)?.slice(1);
  if (parsed === undefined) return undefined;
  const [day, month, year] = parsed.map(f.unary(Number.parseInt));
  return dayjs(new Date(year, month - 1, day));
}
