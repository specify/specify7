import React from 'react';
import { commonText } from '../../localization/common';

const indicatorTimeOut = 3000;

export function OnlineStatus(): JSX.Element {
  const [onlineStatus, setOnlineStatus] = React.useState<
    'online' | 'offline' | 'normal'
  >('normal');

  React.useEffect(() => {
    setTimeout(() => {
      setOnlineOpen(!onlineOpen);
    }, indicatorTimeOut);
  }, [onlineStatus]);

  const [onlineOpen, setOnlineOpen] = React.useState(true);

  React.useEffect(() => {
    function updateOnlineStatus() {
      const condition = navigator.onLine ? 'online' : 'offline';
      setOnlineStatus(condition);
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [onlineStatus]);

  return (
    <div className="absolute right-0 bottom-0">
      {onlineStatus === 'online' ? (
        <div
          className={`mr-2 flex items-center justify-end gap-2 ${
            onlineOpen ? '' : 'hidden'
          }`}
        >
          <span
            className="h-3 w-3 rounded-full bg-green-700"
            aria-hidden
          ></span>
          <p>{commonText.online()}</p>
        </div>
      ) : onlineStatus === 'offline' ? (
        <div className="mr-2 flex items-center justify-end gap-2">
          <span className="h-3 w-3 rounded-full bg-red-700" aria-hidden></span>
          <p>{commonText.offline()}</p>
        </div>
      ) : undefined}
    </div>
  );
}
