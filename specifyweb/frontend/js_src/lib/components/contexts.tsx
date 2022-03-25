import React from 'react';
import Modal from 'react-modal';

import { error } from '../assert';
import type { RA } from '../types';
import { crash, ErrorBoundary } from './errorboundary';
import { useBooleanState } from './hooks';
import { LoadingScreen } from './modaldialog';

export function Contexts({
  children,
}: {
  readonly children: JSX.Element;
}): JSX.Element {
  React.useEffect(() => Modal.setAppElement('#root'), []);

  const holders = React.useRef<RA<number>>([]);
  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const handle = React.useCallback(
    (promise: Promise<unknown>): void => {
      const holderId = holders.current.length;
      console.log('Begun loading', holderId);
      holders.current = [...holders.current, holderId];
      handleLoading();
      promise
        .catch((error: Error) => {
          crash(error);
          throw error;
        })
        .finally(() => {
          holders.current = holders.current.filter((item) => item !== holderId);
          if (holders.current.length === 0) handleLoaded();
          console.log('Finished loading', holderId);
        });
    },
    [handleLoading, handleLoaded]
  );
  return (
    <ErrorBoundary>
      <LoadingContext.Provider value={handle}>
        <LoadingScreen isLoading={isLoading} />
        {children}
      </LoadingContext.Provider>
    </ErrorBoundary>
  );
}

export const LoadingContext = React.createContext<
  (promise: Promise<unknown>) => void
>(() => error('Not defined'));
LoadingContext.displayName = 'LoadingContext';
