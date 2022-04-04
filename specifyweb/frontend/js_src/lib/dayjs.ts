import dayJs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

/*
 * Day.js is a drop-in replacement for deprecated moment.js
 * It is much smaller in size, has TypeScript definitions and is actively
 * maintained
 */

dayJs.extend(advancedFormat);

export function getDateInputValue(date: Date): string {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
}

export const dayjs = dayJs;
