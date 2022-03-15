import React from 'react';

import commonText from '../localization/common';
import * as navigation from '../navigation';
import type { Input } from '../saveblockers';
import type { R, RA } from '../types';
import { isInputTouched } from '../validationmessages';
import { crash } from './errorboundary';

const idStore: R<number> = {};

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
  window.document.title = commonText('appTitle')(title);
}

export function useTitle(title: string): void {
  // Reset title after component is destroyed
  React.useEffect(() => {
    const initialTitle = document.title;
    return (): void => {
      document.title = initialTitle;
    };
  }, []);

  // Change page's title
  React.useEffect(() => {
    setTitle(title);
  }, [title]);
}

/**
 * For performance reasons, this hook does not cause state update when setting
 * validation message. Thus, you can call it on keydown to implement live
 * validation
 */
export function useValidation<T extends Input = HTMLInputElement>(
  // Can set validation message from state or a prop
  message: string | RA<string> = ''
): {
  // Set this as a ref prop on an input
  readonly validationRef: React.RefCallback<T>;
  // If need access to the underlying inputRef, can use this prop
  readonly inputRef: React.MutableRefObject<T | null>;
  // Can set validation message via this callback
  readonly setValidation: (message: string | RA<string>) => void;
} {
  const inputRef = React.useRef<T | null>(null);

  /*
   * Store last validation message in case inputRef.current is null at the moment
   * This happens if setValidation is called for an input that is not currently
   * rendered
   */
  const validationMessageRef = React.useRef<string | RA<string>>(message);

  // Clear validation message on typing
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    function handleChange(): void {
      if (input.validity.customError) {
        validationMessageRef.current = '';
        input.setCustomValidity('');
      }
    }

    input.addEventListener('input', handleChange);
    return (): void => input.removeEventListener('input', handleChange);
  }, []);

  // Empty string clears validation error
  function setValidation(message: string | RA<string>): void {
    const joined = Array.isArray(message) ? message.join('\n') : message;
    validationMessageRef.current = joined;

    const input = inputRef.current;
    if (!input) return;
    input.setCustomValidity(joined);

    if (joined !== '' && isInputTouched(input)) input.reportValidity();
  }

  React.useEffect(() => setValidation(message), [message]);

  return {
    inputRef,
    validationRef: (input): void => {
      inputRef.current = input;
      setValidation(validationMessageRef.current);
    },
    setValidation,
  };
}

/** Like React.useState, but initial value is retrieved asynchronously */
export function useAsyncState<T>(
  /*
   * Callback can call "refreshState" asynchronously to trigger another call to
   * "callback"
   */
  callback: (refreshState: () => void) => undefined | T | Promise<T | undefined>
): [
  state: T | undefined,
  setState: React.Dispatch<React.SetStateAction<T | undefined>>
] {
  const [state, setState] = React.useState<T | undefined>(undefined);

  React.useEffect(() => {
    const refreshState = () =>
      void Promise.resolve(callback(refreshState))
        .then((initialState) =>
          destructorCalled ? undefined : setState(initialState)
        )
        .catch(crash);
    refreshState();

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [callback]);

  return [state, setState];
}

export function useUnloadProtect(
  isEnabled: boolean,
  message: string
): (isEnabled: boolean, callback?: () => void) => void {
  const [hasUnloadProtect, setHasUnloadProtect] = React.useState(isEnabled);
  React.useEffect(() => setHasUnloadProtect(isEnabled), [isEnabled]);

  React.useEffect(() => {
    if (!hasUnloadProtect) return;
    const id = {};
    navigation.addUnloadProtect(id, message);
    return (): void => navigation.removeUnloadProtect(id);
  }, [hasUnloadProtect, message]);

  const [callback, setCallback] = React.useState<(() => void) | undefined>(
    undefined
  );
  if (typeof callback === 'function') {
    callback();
    setCallback(undefined);
  }
  return (isEnabled, callback) => {
    setHasUnloadProtect(isEnabled);
    setCallback(callback);
  };
}

export function useBooleanState(
  value = false
): Readonly<
  [state: boolean, enable: () => void, disable: () => void, toggle: () => void]
> {
  const [state, setState] = React.useState<boolean>(value);
  React.useEffect(() => setState(value), [value]);
  return [
    state,
    React.useCallback(function enable() {
      setState(true);
    }, []),
    React.useCallback(function disable() {
      setState(false);
    }, []),
    React.useCallback(function toggle() {
      setState((value) => !value);
    }, []),
  ];
}
