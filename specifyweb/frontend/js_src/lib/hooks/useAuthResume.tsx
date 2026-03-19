import React from 'react';

import type { AuthResumeSnapshot } from '../utils/authResume';
import {
  saveCurrentAuthResume,
  setAuthResumeProvider,
} from '../utils/authResume';

export function useAuthResume(
  getSnapshot: () => AuthResumeSnapshot | undefined
): void {
  const getSnapshotRef = React.useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;

  React.useEffect(
    () => setAuthResumeProvider(() => getSnapshotRef.current()),
    []
  );

  React.useEffect(() => {
    const handlePersist = (): void => saveCurrentAuthResume();

    globalThis.addEventListener('beforeunload', handlePersist);
    globalThis.addEventListener('pagehide', handlePersist);

    return () => {
      globalThis.removeEventListener('beforeunload', handlePersist);
      globalThis.removeEventListener('pagehide', handlePersist);
    };
  }, []);
}
