/**
 * Provide contexts used by other components
 */

import React from 'react';
import Modal from 'react-modal';

import { error } from '../assert';
import { replaceItem } from '../helpers';
import { commonText } from '../localization/common';
import type { RA } from '../types';
import { crash, ErrorBoundary } from './errorboundary';
import { useBooleanState } from './hooks';
import { Dialog, dialogClassNames, loadingBar } from './modaldialog';

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

  // Loading Context
  const holders = React.useRef<RA<number>>([]);

  const [isLoading, handleLoading, handleLoaded] = useBooleanState();

  const handle = React.useCallback(
    (promise: Promise<unknown>): void => {
      const holderId = holders.current.length;
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
        });
    },
    [handleLoading, handleLoaded]
  );
  legacyContext = handle;

  // Error Context
  const [errors, setErrors] = React.useState<RA<JSX.Element | undefined>>([]);

  const handleError = React.useCallback(
    (error: (props: { readonly onClose: () => void }) => JSX.Element) =>
      setErrors((errors) => [
        ...errors,
        <React.Fragment key={errors.length}>
          {error({
            onClose: () =>
              setErrors((newErrors) =>
                replaceItem(newErrors, errors.length, undefined)
              ),
          })}
        </React.Fragment>,
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
        <LoadingContext.Provider value={handle} key="loadingContext">
          <Dialog
            isOpen={isLoading}
            header={commonText('loading')}
            className={{ container: dialogClassNames.narrowContainer }}
            buttons={undefined}
            onClose={undefined}
          >
            {loadingBar}
          </Dialog>
          {children}
        </LoadingContext.Provider>
      </ErrorContext.Provider>
    </ErrorBoundary>
  );
}

/**
 * Display a modal loading dialog while promise is resolving.
 * Also, catch and handle erros if promise is rejected.
 * If multiple promises are resolving at the same time, the dialog is
 * visible until all promises are resolved.
 */
export const LoadingContext = React.createContext<
  (promise: Promise<unknown>) => void
>(() => error('Not defined'));
LoadingContext.displayName = 'LoadingContext';

/**
 * Display a modal error message dialog
 */
export const ErrorContext = React.createContext<
  (error: (props: { readonly onClose: () => void }) => JSX.Element) => void
>(() => error('Not defined'));
ErrorContext.displayName = 'ErrorContext';

export type FormMeta = {
  // Undefined if form does not have a printOnSave button
  readonly printOnSave: undefined | boolean;
  // Whether user tried to submit a form. This causes deferred save blockers
  // to appear
  readonly triedToSubmit: boolean;
};

export const FormContext = React.createContext<
  Readonly<
    [
      meta: FormMeta,
      setMeta:
        | ((newState: FormMeta | ((oldMeta: FormMeta) => FormMeta)) => void)
        | undefined
    ]
  >
>([
  {
    printOnSave: false,
    triedToSubmit: false,
  },
  undefined,
]);
FormContext.displayName = 'FormContext';
