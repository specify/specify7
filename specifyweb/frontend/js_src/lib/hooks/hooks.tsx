/**
 * Definitions for React hooks that are used extensively throughout the
 * application
 */

import React from 'react';

import { listen } from '../utils/events';
import { commonText } from '../localization/common';
import type { Input } from '../components/DataModel/saveBlockers';
import type { GetOrSet, R, RA } from '../utils/types';
import { isInputTouched } from '../components/Forms/validationHelpers';
import { LoadingContext } from '../components/Core/Contexts';
import { crash } from '../components/Errors/ErrorBoundary';

const idStore: R<number> = {};

/**
 * A hook that returns a unique string ID generator that is unique
 * and unchanging for the lifecycle of a component
 *
 * @remarks
 * No matter which prefix is chosen, the final ID is guaranteed to be unique
 * among all components. Thus, you shouldn't worry about prefixes being globally
 * unique. The specific prefix does not matter at all, except it makes debugging
 * easier.
 *
 * Update:
 * React 18 added a useId hook that serves a similar purpose. However, there
 * are some advantages to using this useId implementation:
 *   - Generated IDs use a human-readable prefix, rather than `:r0:` to make
 *     debugging easier. React's implementation is better at avoiding conflicts,
 *     but it shouldn't be a problem since IDs are not widely used in Specify 7,
 *     other than for accessibility in forms.
 *   - React.useId generates only one ID, where as it is common to need several
 *     IDs at once. While you could use that ID and manually concat different
 *     suffixes, this useId implementation returns a suffix-awere function to
 *     begin with. If you don't need a suffix, then just call this hook like this:
 *     ```js
 *     const id = useId('somePrefix')('');
 *     ```
 */
export function useId(prefix: string): (suffix: string) => string {
  const id = React.useRef(-1);

  const resolvedPrefix = `${prefix}-`;

  if (!(resolvedPrefix in idStore)) idStore[resolvedPrefix] = 0;

  if (id.current === -1) {
    id.current = idStore[resolvedPrefix];
    idStore[resolvedPrefix] += 1;
  }

  return React.useCallback(
    (suffix = ''): string =>
      `${resolvedPrefix}${id.current}${suffix ? `-${suffix}` : ''}`,
    [resolvedPrefix]
  );
}

export function setTitle(title: string): void {
  globalThis.document.title = commonText('appTitle', title);
}

const titleStack = new Map<unknown, string>();

const refreshTitle = (): void =>
  setTitle(Array.from(titleStack.values()).at(-1) ?? '');

/** Set title of the webpage. Restores previous title on component destruction */
export function useTitle(title: string | undefined): void {
  // Change page's title
  React.useEffect(() => {
    const id = {};
    if (typeof title === 'string') titleStack.set(id, title);
    refreshTitle();
    return (): void => {
      titleStack.delete(id);
      refreshTitle();
    };
  }, [title]);
}

/**
 * An integration into native browser error reporting mechanism.
 * Can set an error message via prop or callback.
 * Hides the error message on input
 *
 * @remarks
 * For performance reasons, this hook does not cause state update when setting
 * validation message. Thus, you can call it on keydown to implement live
 * validation
 */
export function useValidation<T extends Input = HTMLInputElement>(
  // Can set validation message from state or a prop
  message: RA<string> | string = ''
): {
  // Set this as a ref prop on an input
  readonly validationRef: React.RefCallback<T>;
  // If need access to the underlying inputRef, can use this prop
  readonly inputRef: React.MutableRefObject<T | null>;
  // Can set validation message via this callback
  readonly setValidation: (
    message: RA<string> | string,
    type?: 'auto' | 'focus' | 'silent'
  ) => void;
} {
  const inputRef = React.useRef<T | null>(null);

  /*
   * Store last validation message in case inputRef.current is null at the moment
   * This happens if setValidation is called for an input that is not currently
   * rendered
   */
  const validationMessageRef = React.useRef<string>(
    Array.isArray(message) ? message.join('\n') : message
  );
  const isFirstError = React.useRef(validationMessageRef.current !== '');

  // Clear validation message on typing
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    return listen(input, 'input', (): void => {
      if (input.validity.customError) {
        validationMessageRef.current = '';
        input.setCustomValidity('');
      }
    });
  }, []);

  // Display validation message on focus
  const isFirstFocus = React.useRef<boolean>(true);
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    return listen(input, 'focus', (): void => {
      if (isFirstFocus.current) isFirstFocus.current = false;
      else input.reportValidity();
    });
  }, []);

  const setValidation = React.useCallback(function setValidation(
    message: RA<string> | string,
    type: 'auto' | 'focus' | 'silent' = 'auto'
  ): void {
    const joined = Array.isArray(message) ? message.join('\n') : message;
    if (validationMessageRef.current === joined && type !== 'focus') return;

    validationMessageRef.current = joined;
    const input = inputRef.current;
    if (!input) return;
    // Empty string clears validation error
    input.setCustomValidity(joined);

    if (joined !== '' && isInputTouched(input) && type !== 'silent')
      input.reportValidity();
    else if (isFirstError.current) {
      isFirstError.current = false;
      input.reportValidity();
    }
  },
  []);

  React.useEffect(() => setValidation(message), [message, setValidation]);

  return {
    inputRef,
    validationRef: React.useCallback(
      (input): void => {
        inputRef.current = input;
        setValidation(validationMessageRef.current, 'focus');
      },
      [setValidation]
    ),
    setValidation,
  };
}

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

/**
 * A synchronous version of useAsyncState
 * Like React.useMemo, but with setState
 *
 * @remarks
 * Like React.useState, but default value must always be a function, and when
 * function changes, default value is recalculated and reapplied.
 *
 * Thus, wrap the callback in React.useCallback with dependency array that
 * would determine when the state is recalculated.
 *
 * @example
 * This will call getDefaultValue to get new default value every time
 * dependency changes
 * ```js
 * const [value, setValue] = useLiveState(
 *   React.useCallback(
 *     getDefaultValue,
 *     [dependency]
 *   )
 * );
 * ```
 */
export function useLiveState<T>(callback: () => T): GetOrSet<T> {
  const [state, setState] = React.useState<T>(callback);

  useReadyEffect(React.useCallback(() => setState(callback()), [callback]));

  return [state, setState];
}

/**
 * Like React.useState, but updates the state whenever default value changes
 */
export function useTriggerState<T>(defaultValue: T): GetOrSet<T> {
  const [state, setState] = React.useState<T>(defaultValue);

  /* Using layout effect rather than useEffect to update the state earlier */
  React.useLayoutEffect(() => setState(defaultValue), [defaultValue]);

  return [state, setState];
}

/**
 * Like React.useEffect, but does not execute on first render.
 * Passed callback must be wrapped in React.useCallback
 */
export function useReadyEffect(callback: () => void): void {
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) isFirstRender.current = false;
    else callback();
  }, [callback]);
}

/**
 * Many react states are simple boolean switches
 * This hook gives a convenient way to defined such states
 *
 * @example Usage
 * Without this hook:
 * ```js
 * const [isOpen, setIsOpen] = React.useState(false);
 * ```
 * With this hook:
 * ```
 * const [isOpen, handleOpen, handleClose, handleToggle] = useBooleanState();
 * ```
 * "handleClose" is easier to reason about than "setIsOpen(false)"
 *
 * If handleClose or handleToggle actions are not needed, they simply
 * don't have to be destructured.
 *
 * Initial value can be given as a prop. State value is changed to match the
 * prop if prop changes.
 *
 * @example Performance optimization
 * This hook also reduces the render the need for reRenders
 * This calls reRender of Dialog on each parent component render since
 * lamda function is redefined at each render:
 * ```js
 * <Dialog onClose={():void => setIsOpen(false)} ... >...</Dialog>
 * ```
 * This doss not cause needless reRenders and looks cleaner:
 * ```js
 * <Dialog onClose={handleClose} ... >...</Dialog>
 * ```
 */
export function useBooleanState(
  value = false
): Readonly<
  readonly [
    state: boolean,
    enable: () => void,
    disable: () => void,
    toggle: () => void
  ]
> {
  const [state, setState] = useTriggerState(value);
  return [
    state,
    React.useCallback(
      function enable() {
        setState(true);
      },
      [setState]
    ),
    React.useCallback(
      function disable() {
        setState(false);
      },
      [setState]
    ),
    React.useCallback(
      function toggle() {
        setState((value) => !value);
      },
      [setState]
    ),
  ];
}
