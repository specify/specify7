import React from 'react';

import { getRelativeDate } from '../Atoms/Internationalization';
import { LANGUAGE } from '../../localization/utils/config';

const longDate = new Intl.DateTimeFormat(LANGUAGE, {
  dateStyle: 'full',
  timeStyle: 'long',
});

export function DateElement({
  date,
  // REFACTOR: get rid of this prop
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
