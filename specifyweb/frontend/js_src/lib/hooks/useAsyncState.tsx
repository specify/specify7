import { GetOrSet } from '../utils/types';
import React from 'react';
import { LoadingContext } from '../components/Core/Contexts';
import { crash } from '../components/Errors/Crash';

/**
 * Like React.useState, but initial value is retrieved asynchronously
 * While value is being retrieved, hook returns undefined, which can be
 * conveniently replaced with a default value when destructuring the array
 *
 * @remarks
 * This hook resets the state value every time the prop changes. Thus,
 * you need to wrap the prop in React.useCallback(). This allows for
 * recalculation of the state when parent component props change.
 *
 * If async action is resolved after component destruction, no update occurs
 * (thus no warning messages are triggered)
 *
 * Rejected promises result in a modal error dialog
 *
 * @example
 * This would fetch data from a url, use defaultValue while fetching,
 * reFetch every time url changes, and allow to manually change state
 * value using setValue:
 * ```js
 * const [value=defaultValue, setValue] = useAsyncState(
 *   React.useCallback(()=>fetch(url), [url]);
 * );
 * ```
 */
export function useAsyncState<T>(
  callback: () => Promise<T | undefined> | T | undefined,
  // Show the loading screen while the promise is being resolved
  loadingScreen: boolean
): GetOrSet<T | undefined> {
  const [state, setState] = React.useState<T | undefined>(undefined);
  const loading = React.useContext(LoadingContext);

  /**
   * Using layout effect so that setState(undefined) runs immediately on
   * callback change, rather than give inconsistent state.
   */
  React.useLayoutEffect(() => {
    // If callback changes, state is reset while new state is fetching
    setState(undefined);
    const wrapped = loadingScreen
      ? loading
      : (promise: Promise<unknown>): void => void promise.catch(crash);
    wrapped(
      Promise.resolve(callback()).then((newState) =>
        destructorCalled ? undefined : setState(newState)
      )
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [callback, loading, loadingScreen]);

  return [state, setState];
}
