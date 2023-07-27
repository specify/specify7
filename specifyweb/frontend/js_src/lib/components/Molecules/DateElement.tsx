import React from 'react';

import { LANGUAGE } from '../../localization/utils/config';
import { getRelativeDate } from '../Atoms/Internationalization';
import { HOUR, MILLISECONDS, MINUTE } from '../Atoms/timeUnits';

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
    let intervalValue = 0;
    let interval: NodeJS.Timeout | undefined;

    if (date) {
      interval = setInterval(() => {
        const dateObject = new Date(date);
        const now = new Date();
        const timeDifference = now.getTime() - dateObject.getTime();

        if (timeDifference < 60 * MILLISECONDS)
          intervalValue = 5 * MILLISECONDS;
        else if (timeDifference < 6 * MINUTE) intervalValue = MINUTE;
        else intervalValue = HOUR;

        setRelativeDate(getRelativeDate(new Date(date)));
      }, intervalValue);
    }

    return () => {
      clearInterval(interval);
    };
  }, [date]);

  // React.useEffect(() => {
  //   let timeout: NodeJS.Timeout | undefined;

  //   function updateRelativeDate() {
  //     if (date) {
  //       const dateObject = new Date(date);
  //       const now = new Date();
  //       const timeDifference = now.getTime() - dateObject.getTime();

  //       let timeoutValue = 0;

  //       if (timeDifference < 60 * MILLISECONDS) timeoutValue = 5 * MILLISECONDS;
  //       else if (timeDifference < 6 * MINUTE) timeoutValue = MINUTE;
  //       else timeoutValue = HOUR;

  //       setRelativeDate(getRelativeDate(new Date(date)));

  //       timeout = setTimeout(updateRelativeDate, timeoutValue);
  //     }
  //   }

  //   updateRelativeDate();

  //   return () => {
  //     clearTimeout(timeout);
  //   };
  // }, [date]);

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
