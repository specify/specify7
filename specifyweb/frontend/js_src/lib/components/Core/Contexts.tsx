import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import type { RA, WritableArray } from '../../utils/types';
import { setDevelopmentGlobal } from '../../utils/types';
import { error } from '../Errors/assert';
import { crash } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Toasts } from '../Errors/Toasts';
import { loadingBar } from '../Molecules';
import { Dialog, dialogClassNames, LoadingScreen } from '../Molecules/Dialog';
import { TooltipManager } from '../Molecules/Tooltips';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
  UnloadProtectsRefContext,
} from '../Router/UnloadProtect';

// Stores errors that occurred before <Context> is rendered
const pendingErrors: WritableArray<ErrorComponent> = [];
type ErrorComponent = (props: { readonly onClose: () => void }) => JSX.Element;
let setError: (error: ErrorComponent) => void;

/**
 * Allows to display an error dialog from anywhere
 */
export function displayError(error: ErrorComponent): void {
  if (typeof setError === 'function') setError(error);
  else pendingErrors.push(error);
}

// This preserves the error messages even if <Context> gets re-rendered
let globalErrors: RA<JSX.Element> = [];

/*
 * For usage in non-react components only
 * REFACTOR: remove this once everything is using react
 */
let legacyContext: (promise: Promise<unknown>) => void;
// eslint-disable-next-line functional/prefer-tacit
export const legacyLoadingContext = (promise: Promise<unknown>): void =>
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
  const [isLoading, handleLoading, handleLoaded] = useBooleanState();
  const loadingHandler = useLoadingLogic(handleLoading, handleLoaded);
  legacyContext = loadingHandler;

  // Error Context
  const [errors, setErrors] = React.useState<RA<JSX.Element>>(globalErrors);
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
        const newErrors = [...errors, newError];
        globalErrors = newErrors;
        return newErrors;
      }),
    []
  );
  if (setError === undefined) pendingErrors.forEach(handleError);
  setError = handleError;

  const [unloadProtects, setUnloadProtects] = React.useState<RA<string>>([]);

  const unloadProtectsRef = React.useRef(unloadProtects);
  const handleChangeUnloadProtects = React.useCallback(
    (value: RA<string> | ((oldValue: RA<string>) => RA<string>)): void => {
      const resolvedValue =
        typeof value === 'function' ? value(unloadProtectsRef.current) : value;
      setUnloadProtects(resolvedValue);
      unloadProtectsRef.current = resolvedValue;

      setDevelopmentGlobal('_unloadProtects', resolvedValue);
    },
    []
  );

  const isReadOnly = React.useContext(ReadOnlyContext);
  const isReadOnlyMode = useCachedState('forms', 'readOnlyMode')[0] ?? false;
  return (
    <UnloadProtectsContext.Provider value={unloadProtects}>
      <UnloadProtectsRefContext.Provider value={unloadProtectsRef}>
        <SetUnloadProtectsContext.Provider value={handleChangeUnloadProtects}>
          <Toasts>
            <ErrorBoundary>
              <ErrorContext.Provider value={handleError}>
                {errors}
                <LoadingContext.Provider value={loadingHandler}>
                  {isLoading && (
                    <Dialog
                      buttons={undefined}
                      className={{
                        container: dialogClassNames.narrowContainer,
                      }}
                      header={commonText.loading()}
                      onClose={undefined}
                    >
                      {loadingBar}
                    </Dialog>
                  )}
                  <React.Suspense fallback={<LoadingScreen />}>
                    <ReadOnlyContext.Provider
                      value={isReadOnly || isReadOnlyMode}
                    >
                      {children}
                    </ReadOnlyContext.Provider>
                  </React.Suspense>
                </LoadingContext.Provider>
                <TooltipManager />
              </ErrorContext.Provider>
            </ErrorBoundary>
          </Toasts>
        </SetUnloadProtectsContext.Provider>
      </UnloadProtectsRefContext.Provider>
    </UnloadProtectsContext.Provider>
  );
}

/**
 * Wait 50ms before displaying loading screen
 *   -> to avoid blinking a loading screen for resolved promises
 *      (that can also trigger bugs, like this one:
 *      https://github.com/specify/specify7/issues/884#issuecomment-1509324664)
 * Wait 50sm before removing loading screen
 *   -> to avoid flashing the screen when one loading screen is immediately
 *      followed by another one
 * 50ms was chosen as the longest delay that I don't notice in comparison to 0ms
 * (on an fast macbook pro with high refresh rate). The value might have to be
 * adjusted in the future
 */
const loadingScreenDelay = 50;

export function useLoadingLogic(
  handleLoading: () => void,
  handleLoaded: () => void
): (promise: Promise<unknown>) => void {
  const holders = React.useRef<RA<number>>([]);
  const loadingTimeout = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  return React.useCallback(
    (promise: Promise<unknown>): void => {
      const holderId = Math.max(-1, ...holders.current) + 1;
      holders.current = [...holders.current, holderId];
      clearTimeout(loadingTimeout.current);
      loadingTimeout.current = setTimeout(handleLoading, loadingScreenDelay);
      promise
        .finally(() => {
          holders.current = holders.current.filter((item) => item !== holderId);
          if (holders.current.length > 0) return;
          clearTimeout(loadingTimeout.current);
          loadingTimeout.current = setTimeout(handleLoaded, loadingScreenDelay);
        })
        .catch(crash);
    },
    [handleLoading, handleLoaded]
  );
}

/*
 * REFACTOR: consider turning LoadingContext and useNavigate into global
 *   functions since they have the same value in all components and never change
 */
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

/** Display a modal error message dialog */
export const ErrorContext = React.createContext<
  (error: (props: { readonly onClose: () => void }) => JSX.Element) => void
>(() => error('Not defined'));
ErrorContext.displayName = 'ErrorContext';

/** If true, renders everything below it as read only */
export const ReadOnlyContext = React.createContext<boolean>(false);
ReadOnlyContext.displayName = 'ReadOnlyContext';

/** If true, form is rendered in a search dialog - required fields are not enforced */
export const SearchDialogContext = React.createContext<boolean>(false);
SearchDialogContext.displayName = 'SearchDialogContext';
