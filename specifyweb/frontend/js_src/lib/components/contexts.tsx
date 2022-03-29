import React from 'react';
import Modal from 'react-modal';

import { error } from '../assert';
import { replaceItem } from '../helpers';
import type { RA } from '../types';
import { crash, ErrorBoundary } from './errorboundary';
import { useBooleanState } from './hooks';
import { LoadingScreen } from './modaldialog';

let setError: (
  error: (props: { readonly onClose: () => void }) => JSX.Element
) => void;
export const displayError: typeof setError = (error) => setError(error);

/*
 * For usage in non-react components only
 * TODO: remove this once everything is using react
 */
let legacyContext: (promise: Promise<unknown>) => void;
export const legacyLoadingContext = (promise: Promise<unknown>) =>
  legacyContext(promise);

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
      holders.current = [...holders.current, holderId];
      handleLoading();
      if (process.env.NODE_ENV !== 'production')
        console.log('Loading screen', { promise, holders });
      promise
        .catch((error: Error) => {
          crash(error);
          throw error;
        })
        .finally(() => {
          holders.current = holders.current.filter((item) => item !== holderId);
          if (holders.current.length === 0) handleLoaded();
        });
    },
    [handleLoading, handleLoaded]
  );
  legacyContext = handle;

  const [errors, setErrors] = React.useState<RA<JSX.Element | undefined>>([]);

  const handleError = React.useCallback(
    (error: (props: { readonly onClose: () => void }) => JSX.Element) =>
      setErrors((errors) => [
        ...errors,
        error({
          onClose: () =>
            setErrors((newErrors) =>
              replaceItem(newErrors, errors.length, undefined)
            ),
        }),
      ]),
    []
  );
  React.useEffect(() => {
    setError = handleError;
  }, [handleError]);

  return (
    <ErrorBoundary>
      <ErrorContext.Provider value={handleError}>
        {errors}
        <LoadingContext.Provider value={handle}>
          <LoadingScreen isLoading={isLoading} />
          {children}
        </LoadingContext.Provider>
      </ErrorContext.Provider>
    </ErrorBoundary>
  );
}

export const LoadingContext = React.createContext<
  (promise: Promise<unknown>) => void
>(() => error('Not defined'));
LoadingContext.displayName = 'LoadingContext';

export const ErrorContext = React.createContext<
  (error: (props: { readonly onClose: () => void }) => JSX.Element) => void
>(() => error('Not defined'));
ErrorContext.displayName = 'ErrorContext';
