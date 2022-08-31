import { parseDate } from '../components/FormPlugins/PartialDateUi';
import { f } from './functools';
import { mappedFind } from './utils';

const reParse =
  /today\s*([+-])\s*(\d+)\s*(second|minute|hour|day|week|month|year)/u;

/**
 * Parse a date like 'today + 2 days' or 'today - 4 weeks'
 */
export function parseRelativeDate(value: string): Date | undefined {
  if (value === 'today') return new Date();

  const parsed = reParse.exec(value.toLowerCase())?.slice(1);
  if (Array.isArray(parsed)) {
    const [direction, size, type] = parsed;
    const number = (direction === '-' ? -1 : 1) * Number.parseInt(size);
    const date = new Date();
    if (type === 'second') date.setSeconds(date.getSeconds() + number);
    else if (type === 'minute') date.setMinutes(date.getMinutes() + number);
    else if (type === 'hour') date.setHours(date.getHours() + number);
    else if (type === 'day') date.setDate(date.getDate() + number);
    else if (type === 'week') date.setDate(date.getDate() + number * 7);
    else if (type === 'month') date.setMonth(date.getMonth() + number);
    else if (type === 'year') date.setFullYear(date.getFullYear() + number);
    return date;
  }
  return (
    mappedFind(['full', 'month-year', 'year'] as const, (precision) =>
      f.var(parseDate(precision, value), (parsed) =>
        parsed.isValid() ? parsed : undefined
      )
    )?.toDate() ?? undefined
  );
}
