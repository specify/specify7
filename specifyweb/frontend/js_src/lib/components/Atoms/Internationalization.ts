/**
 * Various tools to help internationalize the application
 */

import type { LocalizedString } from 'typesafe-i18n';

import { LANGUAGE } from '../../localization/utils/config';
import type { RA } from '../../utils/types';
import { capitalize } from '../../utils/utils';
import { DAY, HOUR, MINUTE, MONTH, SECOND, WEEK, YEAR } from './timeUnits';

/* This is an incomplete definition. For complete, see MDN Docs */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Intl {
  // eslint-disable-next-line functional/no-class
  class ListFormat {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        readonly type?: 'conjunction' | 'disjunction';
        readonly style?: 'long' | 'narrow' | 'short';
      }
    );

    public format(values: RA<LocalizedString>): LocalizedString;
  }

  // eslint-disable-next-line functional/no-class
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

    public of(code: string): LocalizedString;
  }

  // eslint-disable-next-line functional/no-class
  class NumberFormat {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        /*
         * Full list of possible units:
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#unit_2
         */
        readonly unit: 'byte';
        readonly notation:
          | 'compact'
          | 'engineering'
          | 'scientific'
          | 'standard';
        readonly unitDisplay: 'long' | 'narrow' | 'short';
        readonly style: 'currency' | 'decimal' | 'percent' | 'unit';
      }
    );

    public format(value: number): LocalizedString;
  }

  // eslint-disable-next-line functional/no-class
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
    ): LocalizedString;
  }

  // eslint-disable-next-line functional/no-class
  class DateTimeFormat {
    public constructor(
      locales?: RA<string> | string,
      options?: {
        readonly dateStyle?: 'full' | 'long' | 'medium' | 'short';
        readonly timeStyle?: 'full' | 'long' | 'medium' | 'short';
        readonly month?: 'long' | 'short';
      }
    );

    public format(value: Readonly<Date>): LocalizedString;
  }

  // eslint-disable-next-line functional/no-class
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

function getMonthNames(monthFormat: 'long' | 'short'): RA<LocalizedString> {
  const months = new Intl.DateTimeFormat(LANGUAGE, { month: monthFormat });
  return Array.from({ length: 12 }, (_, month) =>
    months.format(new Date(0, month, 2, 0, 0, 0))
  );
}

// Localized month names
export const months = getMonthNames('long');

const conjunctionFormatter = new Intl.ListFormat(LANGUAGE, {
  style: 'long',
  // REFACTOR: evaluate usages to use conjunction vs disjunction
  type: 'conjunction',
});
export const formatConjunction = (list: RA<LocalizedString>): LocalizedString =>
  conjunctionFormatter.format(list);

const disjunctionFormatter = new Intl.ListFormat(LANGUAGE, {
  style: 'long',
  type: 'disjunction',
});
export const formatDisjunction = (list: RA<LocalizedString>): LocalizedString =>
  disjunctionFormatter.format(list);

const datePartLocalizer = new Intl.DisplayNames(LANGUAGE, {
  type: 'dateTimeField',
});
export const dateParts = {
  day: capitalize(datePartLocalizer.of('day')),
  month: capitalize(datePartLocalizer.of('month')),
  year: capitalize(datePartLocalizer.of('year')),
} as const;

const numberFormatter = new Intl.NumberFormat(LANGUAGE);
export const formatNumber = (number: number): LocalizedString =>
  numberFormatter.format(number);

const relativeDate = new Intl.RelativeTimeFormat(LANGUAGE, {
  numeric: 'auto',
  style: 'long',
});

/** Does not support future dates */
export function getRelativeDate(date: Readonly<Date>): LocalizedString {
  const timePassed = Date.now() - date.getTime();
  if (timePassed < 0) {
    /*
     * This happens due to time zone conversion issues.
     * Need to fix that issue on the back-end first.
     * See: https://github.com/specify/specify7/issues/641
     * Adding support for future dates is not hard, but it would be weird to
     * create a data set and see its date of creation be 5 hours into the
     * future
     */
    // Throw new Error('Future dates are not supported'), removed console.log in issue #4051;
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

export const compareStrings = new Intl.Collator(
  globalThis.navigator?.language ?? 'en-us',
  {
    sensitivity: 'base',
    caseFirst: 'upper',
    ignorePunctuation: true,
  }
).compare;

const sizeFormatter = new Intl.NumberFormat(LANGUAGE, {
  unit: 'byte',
  notation: 'compact',
  unitDisplay: 'short',
  style: 'unit',
});

export const formatFileSize = (bytes: number): LocalizedString =>
  sizeFormatter.format(bytes);
