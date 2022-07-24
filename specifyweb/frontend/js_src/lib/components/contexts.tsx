import React from 'react';

import { error } from '../assert';
import { commonText } from '../localization/common';
import type { RA } from '../types';
import { GetOrSet } from '../types';
import { crash, ErrorBoundary } from './errorboundary';
import { useBooleanState } from './hooks';
import {
  Dialog,
  dialogClassNames,
  loadingBar,
  LoadingScreen,
} from './modaldialog';

let setError: (
  error: (props: { readonly onClose: () => void }) => JSX.Element
) => void;
/*
 * BUG: this is hacky, and it happened at least 2 times that setError was
 *   undefined. Come up with a cleaner solution
 */
export const displayError: typeof setError = (error) => setError(error);

/*
 * For usage in non-react components only
 * REFACTOR: remove this once everything is using react
 */
let legacyContext: (promise: Promise<unknown>) => void;
export const legacyLoadingContext = (promise: Promise<unknown>) =>
  legacyContext(promise);

/**
 * Provide contexts used by other components
 *
 * It is best practice to use context as little as possible, as they make
 * components more dependent on their parents.
 *
 * Thus, contexts were used only when necessary, and defined as higher up
 * the tree as possible, so that code refactoring does not lead to a
 * situation where context is accessed before it is defined.
 *
 * Defining contexts very high also allows the top ErrorBoundary to have
 * access to them.
 */
export function Contexts({
  children,
}: {
  readonly children: JSX.Element | RA<JSX.Element>;
}): JSX.Element {
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
  const [errors, setErrors] = React.useState<RA<JSX.Element>>([]);
  const handleError = React.useCallback(
    (error: (props: { readonly onClose: () => void }) => JSX.Element) =>
      setErrors((errors) => {
        const newError = (
          <React.Fragment key={errors.length}>
            {error({
              onClose: () =>
                setErrors((newErrors) =>
                  newErrors.filter((error) => error !== newError)
                ),
            })}
          </React.Fragment>
        );
        return [...errors, newError];
      }),
    []
  );
  React.useEffect(() => {
    setError = handleError;
  }, [handleError]);

  // eslint-disable-next-line react/hook-use-state
  const getSetProtects = React.useState<RA<string>>([]);

  return (
    <UnloadProtectsContext.Provider value={getSetProtects}>
      <ErrorBoundary>
        <ErrorContext.Provider value={handleError}>
          {errors}
          <LoadingContext.Provider key="loadingContext" value={handle}>
            <Dialog
              buttons={undefined}
              className={{ container: dialogClassNames.narrowContainer }}
              header={commonText('loading')}
              isOpen={isLoading}
              onClose={undefined}
            >
              {loadingBar}
            </Dialog>
            <React.Suspense fallback={<LoadingScreen />}>
              {children}
            </React.Suspense>
          </LoadingContext.Provider>
        </ErrorContext.Provider>
      </ErrorBoundary>
    </UnloadProtectsContext.Provider>
  );
}

/**
 * Display a modal loading dialog while promise is resolving.
 * Also, catch and handle erros if promise is rejected.
 * If multiple promises are resolving at the same time, the dialog is
 * visible until all promises are resolved.
 * This prevents having more than one loading dialog visible at the same time.
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

export const UnloadProtectsContext = React.createContext<
  GetOrSet<RA<string>> | undefined
>(undefined);
UnloadProtectsContext.displayName = 'UnloadProtectsContext';

export type FormMeta = {
  /*
   * Whether user tried to submit a form. This causes deferred save blockers
   * to appear
   */
  readonly triedToSubmit: boolean;
};

export const FormContext = React.createContext<
  readonly [
    meta: FormMeta,
    setMeta:
      | ((newState: FormMeta | ((oldMeta: FormMeta) => FormMeta)) => void)
      | undefined
  ]
>([
  {
    triedToSubmit: false,
  },
  undefined,
]);
FormContext.displayName = 'FormContext';
