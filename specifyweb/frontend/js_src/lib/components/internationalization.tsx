import React from 'react';

import { LANGUAGE } from '../localization/utils';
import type { RA } from '../types';

/* This is an incomplete definition. For complete, see MDN Docs */
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
        readonly dateStyle: 'full' | 'long' | 'medium' | 'short';
        readonly timeStyle: 'full' | 'long' | 'medium' | 'short';
      }
    );

    public format(value: Date): string;
  }
}

const longDate = new Intl.DateTimeFormat(LANGUAGE, {
  dateStyle: 'full',
  timeStyle: 'long',
});

export function DateElement({
  date,
  fallback = undefined,
}: {
  readonly date: string | undefined;
  readonly fallback?: React.ReactNode;
}): JSX.Element {
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date)))
    return <>{fallback}</>;
  const dateObject = new Date(date);
  return (
    <time
      dateTime={dateObject.toISOString()}
      title={longDate.format(dateObject)}
    >
      {getRelativeDate(dateObject)}
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
  day: datePartLocalizer.of('day'),
  month: datePartLocalizer.of('month'),
  year: datePartLocalizer.of('year'),
} as const;

const numberFormatter = new Intl.NumberFormat(LANGUAGE);
export const formatNumber = (number: number): string =>
  numberFormatter.format(number);

const MILLISECONDS = 1000;
const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;
const YEAR = 12 * MONTH;
const relativeDate = new Intl.RelativeTimeFormat(LANGUAGE, {
  numeric: 'auto',
  style: 'long',
});

export function getRelativeDate(date: Date): string {
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
