import React from 'react';

import { commonText } from '../../localization/common';
import { formatTime } from '../../utils/utils';

const minRowsToLoad = 15;

export function RemainingLoadingTime({
  total,
  current,
}: {
  readonly total: number;
  readonly current: number;
}): JSX.Element | null {
  const startTime = React.useRef(Date.now());
  const [remainingTime, setRemainingTime] = React.useState<number | undefined>(
    undefined
  );

  // Calculate the remaining time
  React.useEffect(() => {
    if (current > minRowsToLoad) {
      const interval = setInterval(() => {
        const timeElapsed = Date.now() - startTime.current;
        const percentCompleted = (total - current) / current;
        const estimatedSeconds = (percentCompleted * timeElapsed) / 1000;
        const remainingSeconds = Math.round(estimatedSeconds);
        setRemainingTime(remainingSeconds);
        if (current >= total) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setRemainingTime(undefined);
    }
    return undefined;
  }, [total, current]);

  return remainingTime === undefined ? null : (
    <p>
      {commonText.colonLine({
        label: commonText.timeRemaining(),
        value: formatTime(remainingTime),
      })}
    </p>
  );
}
