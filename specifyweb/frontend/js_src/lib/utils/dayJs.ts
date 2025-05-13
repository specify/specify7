import dayJs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';

/*
 * Day.js is a drop-in replacement for deprecated moment.js
 * It is much smaller in size, has TypeScript definitions and is actively
 * maintained
 */

dayJs.extend(advancedFormat);

export function getDateInputValue(date: Date): string | undefined {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  // "toJSON" returns undefined if received invalid date
  return local.toJSON()?.slice(0, 10);
}

export { default as dayjs } from 'dayjs';
