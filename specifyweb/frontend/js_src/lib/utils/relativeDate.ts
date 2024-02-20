import { parseDate } from './parser/dayJsFixes';
import { mappedFind } from './utils';

export const today = 'today';

export const reRelativeDate = new RegExp(
  `${today}\\s*([+-])\\s*(\\d+)\\s*(second|minute|hour|day|week|month|year)`,
  'u'
);

/**
 * Try to parse a date that could be in any one of the 3 formatters
 */
export function parseAnyDate(rawDate: string): Date | undefined {
  const date = rawDate.toLowerCase().trim();
  return (
    mappedFind(['full', 'month-year', 'year'] as const, (precision) => {
      const parsed = parseDate(precision, date);
      return parsed.isValid() ? parsed : undefined;
    })?.toDate() ??
    parseRelativeDate(date) ??
    undefined
  );
}

/**
 * Parse a date like 'today + 2 days' or 'today - 4 weeks'
 */
function parseRelativeDate(value: string): Date | undefined {
  if (value === today) return new Date();

  const parsed = reRelativeDate.exec(value)?.slice(1);
  if (!Array.isArray(parsed)) return undefined;

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
