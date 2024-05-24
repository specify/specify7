import React from 'react';

import { LANGUAGE } from '../../localization/utils/config';
import { getRelativeDate } from '../Atoms/Internationalization';
import { HOUR, MINUTE, SECOND } from '../Atoms/timeUnits';

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
  return <DateElementSafe date={date} flipDates={flipDates} />;
}

function DateElementSafe({
  date,
  flipDates = false,
}: {
  readonly date: string;
  readonly flipDates?: boolean;
}): JSX.Element {
  const [relativeDate, setRelativeDate] = React.useState<string>(
    getRelativeDate(new Date(date))
  );

  const dateObject = new Date(date);
  React.useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    function updateRelativeDate(): void {
      if (date) {
        const now = new Date();
        const timeDifference = Math.abs(now.getTime() - dateObject.getTime());

        let timeoutValue = 0;

        if (timeDifference < MINUTE) timeoutValue = SECOND;
        else if (timeDifference < HOUR) timeoutValue = MINUTE;
        else timeoutValue = HOUR;

        setRelativeDate(getRelativeDate(new Date(date)));

        timeout = setTimeout(updateRelativeDate, timeoutValue);
      }
    }

    updateRelativeDate();

    return () => {
      clearTimeout(timeout);
    };
  }, [date]);

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
