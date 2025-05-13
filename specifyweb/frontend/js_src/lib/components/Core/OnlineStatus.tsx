import React from 'react';

import { mainText } from '../../localization/main';

const indicatorTimeOut = 3000;

export function OnlineStatus(): JSX.Element | null {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  // Display online status for a few seconds only
  const [showOnlineStatus, setShowOnlineStatus] = React.useState(false);

  React.useEffect(() => {
    function handleOnline(): void {
      setIsOnline(true);
      setShowOnlineStatus(true);

      setTimeout(() => setShowOnlineStatus(false), indicatorTimeOut);
    }

    function handleOffline(): void {
      setIsOnline(false);
      setShowOnlineStatus(false);
    }

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    return () => {
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline ? (
    showOnlineStatus ? (
      <div className={className}>
        <span aria-hidden className="h-3 w-3 rounded-full bg-green-700" />
        <p>{mainText.online()}</p>
      </div>
    ) : null
  ) : (
    <div className={className}>
      <span aria-hidden className="h-3 w-3 rounded-full bg-red-700" />
      <p>{mainText.offline()}</p>
    </div>
  );
}

const className = 'absolute bottom-0 right-0 z-50 flex items-center gap-2 p-1';
