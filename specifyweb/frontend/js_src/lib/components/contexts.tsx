import React from 'react';

import { error } from '../assert';
import type { RA } from '../types';
import { crash } from './errorboundary';
import { useBooleanState } from './hooks';
import { LoadingScreen } from './modaldialog';

export function Contexts({
  children,
}: {
  readonly children: JSX.Element;
}): JSX.Element {
  const holders = React.useRef<RA<number>>([]);
  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const handle = React.useCallback(
    async <T,>(promise: () => Promise<T>): Promise<T> => {
      const holderId = holders.current.length;
      holders.current = [...holders.current, holderId];
      handleLoading();
      return promise()
        .then((data) => {
          holders.current = holders.current.filter((item) => item !== holderId);
          if (holders.current.length === 0) handleLoaded();
          return data;
        })
        .catch((error: Error) => {
          crash(error);
          throw error;
        });
    },
    [handleLoading, handleLoaded]
  );
  return (
    <LoadingContext.Provider value={handle}>
      {isLoading && <LoadingScreen />}
      {children}
    </LoadingContext.Provider>
  );
}

const LoadingContext = React.createContext<
  <V>(promise: () => Promise<V>) => Promise<V>
>(() => error('Not defined'));
LoadingContext.displayName = 'LoadingContext';
