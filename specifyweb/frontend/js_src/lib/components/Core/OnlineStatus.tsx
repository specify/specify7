import React from 'react';

export function OnlineStatus(): [string, boolean] {
  const [onlineStatus, setOnlineStatus] = React.useState<'online' | 'offline'>(
    'online'
  );
  React.useEffect(() => {
    setTimeout(() => {
      setOnlineOpen(!onlineOpen);
    }, 3000);
  }, [onlineStatus === 'online']);

  const [onlineOpen, setOnlineOpen] = React.useState(true);

  React.useEffect(() => {
    function updateOnlineStatus() {
      const condition = navigator.onLine ? 'online' : 'offline';
      setOnlineStatus(condition);
    }

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [onlineStatus]);
  return [onlineStatus, onlineOpen];
}
