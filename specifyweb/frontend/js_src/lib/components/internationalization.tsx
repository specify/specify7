/**
 * Various tools to help internationalize the application
 */

import React from 'react';

import { capitalize } from '../helpers';
import { commonText } from '../localization/common';
import { LANGUAGE } from '../localization/utils';
import type { RA } from '../types';

/* This is an incomplete definition. For complete, see MDN Docs */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Intl {
  class ListFormat {
    public constructor(
      locales?: string | RA<string>,
      options?: {
        readonly type?: 'conjunction' | 'disjunction';
        readonly style?: 'long' | 'short' | 'narrow';
      }
    );

    public format(values: RA<string>): string;
  }

  class DisplayNames {
    public constructor(
      locales?: string | RA<string>,
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
    public constructor(locales?: string | RA<string>);

    public format(value: number): string;
  }

  class RelativeTimeFormat {
    public constructor(
      locales?: string | RA<string>,
      options?: {
        readonly numeric: 'auto' | 'always';
        readonly style: 'long' | 'short' | 'narrow';
      }
    );

    public format(
      count: number,
      type: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
    ): string;
  }

  class DateTimeFormat {
    public constructor(
      locales?: string | RA<string>,
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
      locales?: string | RA<string>,
      options?: {
        readonly sensitivity?: 'base' | 'accent' | 'case' | 'variant';
        readonly caseFirst?: 'upper' | 'lower' | false;
        readonly ignorePunctuation?: boolean;
      }
    );

    public compare(left: string, right: string): -1 | 0 | 1;
  }
}

const longDate = new Intl.DateTimeFormat(LANGUAGE, {
  dateStyle: 'full',
  timeStyle: 'long',
});

function getMonthNames(monthFormat: 'long' | 'short'): RA<string> {
  const months = new Intl.DateTimeFormat(LANGUAGE, { month: monthFormat });
  return Array.from({ length: 12 }, (_, month) =>
    months.format(new Date(0, month, 2, 0, 0, 0))
  );
}

// Localized month names
export const months = getMonthNames('long');

export function DateElement({
  date,
  fallback = undefined,
  // If true, display full date by default and relative date as a tooltip
  flipDates = false,
}: {
  readonly date: string | undefined;
  readonly fallback?: React.ReactNode;
  readonly flipDates?: boolean;
}): JSX.Element {
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date)))
    return <>{fallback}</>;
  const dateObject = new Date(date);
  const relativeDate = getRelativeDate(dateObject);
  const fullDate = longDate.format(dateObject);
  const [children, title] = flipDates
    ? [fullDate, relativeDate]
    : [relativeDate, fullDate];
  return (
    <time dateTime={dateObject.toISOString()} title={title}>
      {children}
    </time>
  );
}

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
     * Need to fix that issue on the front-end first.
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

export const compareStrings = new Intl.Collator(
  typeof window === 'object' ? window.navigator.language : 'en-us',
  {
    sensitivity: 'base',
    caseFirst: 'upper',
    ignorePunctuation: true,
  }
).compare;
