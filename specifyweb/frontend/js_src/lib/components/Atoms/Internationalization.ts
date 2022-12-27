/**
 * Various tools to help internationalize the application
 */

import { capitalize } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { LANGUAGE } from '../../localization/utils';
import type { RA } from '../../utils/types';

/* This is an incomplete definition. For complete, see MDN Docs */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Intl {
  class ListFormat {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        readonly type?: 'conjunction' | 'disjunction';
        readonly style?: 'long' | 'narrow' | 'short';
      }
    );

    public format(values: RA<string>): string;
  }

  class DisplayNames {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        readonly type:
          | 'calendar'
          | 'currency'
          | 'dateTimeField'
          | 'language'
          | 'region'
          | 'script';
      }
    );

    public of(code: string): string;
  }

  class NumberFormat {
    public constructor(locales?: RA<string> | string);

    public format(value: number): string;
  }

  class RelativeTimeFormat {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        readonly numeric: 'always' | 'auto';
        readonly style: 'long' | 'narrow' | 'short';
      }
    );

    public format(
      count: number,
      type: 'day' | 'hour' | 'minute' | 'month' | 'second' | 'week' | 'year'
    ): string;
  }

  class DateTimeFormat {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        readonly dateStyle?: 'full' | 'long' | 'medium' | 'short';
        readonly timeStyle?: 'full' | 'long' | 'medium' | 'short';
        readonly month?: 'long' | 'short';
      }
    );

    public format(value: Readonly<Date>): string;
  }

  class Collator {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        readonly sensitivity?: 'accent' | 'base' | 'case' | 'variant';
        readonly caseFirst?: 'lower' | 'upper' | false;
        readonly ignorePunctuation?: boolean;
      }
    );

    public compare(left: string, right: string): -1 | 0 | 1;
  }
}

function getMonthNames(monthFormat: 'long' | 'short'): RA<string> {
  const months = new Intl.DateTimeFormat(LANGUAGE, { month: monthFormat });
  return Array.from({ length: 12 }, (_, month) =>
    months.format(new Date(0, month, 2, 0, 0, 0))
  );
}

// Localized month names
export const months = getMonthNames('long');

const listFormatter = new Intl.ListFormat(LANGUAGE, {
  style: 'long',
  type: 'conjunction',
});
export const formatList = (list: RA<string>): string =>
  listFormatter.format(list);

const datePartLocalizer = new Intl.DisplayNames(LANGUAGE, {
  type: 'dateTimeField',
});
export const dateParts = {
  fullDate: commonText('fullDate'),
  day: capitalize(datePartLocalizer.of('day')),
  month: capitalize(datePartLocalizer.of('month')),
  year: capitalize(datePartLocalizer.of('year')),
} as const;

const numberFormatter = new Intl.NumberFormat(LANGUAGE);
export const formatNumber = (number: number): string =>
  numberFormatter.format(number);

/* eslint-disable @typescript-eslint/no-magic-numbers */
export const MILLISECONDS = 1000;
const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;
const YEAR = 12 * MONTH;
/* eslint-enable @typescript-eslint/no-magic-numbers */
const relativeDate = new Intl.RelativeTimeFormat(LANGUAGE, {
  numeric: 'auto',
  style: 'long',
});

/** Does not support future dates */
export function getRelativeDate(date: Readonly<Date>): string {
  const timePassed = Math.round((Date.now() - date.getTime()) / MILLISECONDS);
  if (timePassed < 0) {
    /*
     * This happens due to time zone conversion issues.
     * Need to fix that issue on the back-end first.
     * See: https://github.com/specify/specify7/issues/641
     * Adding support for future dates is not hard, but it would be weird to
     * create a data set and see its date of creation be 5 hours into the
     * future
     */
    // Throw new Error('Future dates are not supported');
    console.error('Future dates are not supported');
    return relativeDate.format(0, 'second');
  } else if (timePassed <= MINUTE)
    return relativeDate.format(-Math.round(timePassed / SECOND), 'second');
  else if (timePassed <= HOUR)
    return relativeDate.format(-Math.round(timePassed / MINUTE), 'minute');
  else if (timePassed <= DAY)
    return relativeDate.format(-Math.round(timePassed / HOUR), 'hour');
  else if (timePassed <= WEEK)
    return relativeDate.format(-Math.round(timePassed / DAY), 'day');
  else if (timePassed <= MONTH)
    return relativeDate.format(-Math.round(timePassed / WEEK), 'week');
  else if (timePassed <= YEAR)
    return relativeDate.format(-Math.round(timePassed / MONTH), 'month');
  else return relativeDate.format(-Math.round(timePassed / YEAR), 'year');
}

// eslint-disable-next-line @typescript-eslint/unbound-method
export const compareStrings = new Intl.Collator(
  globalThis.navigator?.language ?? 'en-us',
  {
    sensitivity: 'base',
    caseFirst: 'upper',
    ignorePunctuation: true,
  }
).compare;
