import React from 'react';

import { LANGUAGE } from '../../localization/utils/config';
import { getRelativeDate } from '../Atoms/Internationalization';

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
  const [relativeDate, setRelativeDate] = React.useState<string | undefined>(
    date ? getRelativeDate(new Date(date)) : undefined
  );

  React.useEffect(() => {
    let intervalValue;
    let interval: NodeJS.Timeout | undefined;

    if (date) {
      interval = setInterval(() => {
        const dateObject = new Date(date);
        const now = new Date();
        const timeDifference = now.getTime() - dateObject.getTime();

        if (timeDifference < 60000) intervalValue = 5000;
        else if (timeDifference < 360000) intervalValue = 60000;
        else intervalValue = 36000000;

        setRelativeDate(getRelativeDate(new Date(date)));
      }, intervalValue);
    }

    return () => {
      clearInterval(interval);
    };
  }, [date]);

  if (typeof date !== 'string' || Number.isNaN(Date.parse(date)))
    return <>{fallback}</>;

  const dateObject = new Date(date);
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
