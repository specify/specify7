import React from 'react';

import { InFormEditorContext } from '../components/FormEditor/Context';
import type { Input } from '../components/Forms/validationHelpers';
import { isInputTouched } from '../components/Forms/validationHelpers';
import { listen } from '../utils/events';
import type { RA } from '../utils/types';

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
export function useValidation<T extends Input = Input>(
  // Can set validation message from state or a prop
  message: RA<string> | string = '',
  clearOnTyping: boolean = true
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

  // Clear validation message on typing
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    return listen(input, 'input', (): void => {
      if (input.validity.customError && clearOnTyping) {
        validationMessageRef.current = '';
        input.setCustomValidity('');
      }
    });
  }, []);

  // Display validation message on blur and focus
  React.useEffect(
    () =>
      inputRef.current === null
        ? undefined
        : listen(
            inputRef.current,
            'focus',
            (): void => void inputRef.current?.reportValidity()
          ),
    []
  );

  const isInFormEditor = React.useContext(InFormEditorContext);

  const isPendingError = React.useRef(false);
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    return listen(input, 'blur', (): void => {
      if (!isPendingError.current) return;
      isPendingError.current = false;
      input.reportValidity();
    });
  }, []);

  const setValidation = React.useCallback(
    function setValidation(
      message: RA<string> | string,
      type: 'auto' | 'focus' | 'silent' = 'auto'
    ): void {
      const joined = Array.isArray(message) ? message.join('\n') : message;
      if (validationMessageRef.current === joined && type !== 'focus') return;

      validationMessageRef.current = joined;
      const input = inputRef.current;
      if (!input) return;

      // Do not steal focus when form rendering the form in the form editor
      if (isInFormEditor) return;

      // Empty string clears validation error
      input.setCustomValidity(joined);

      if (
        type === 'focus' ||
        (joined !== '' &&
          isInputTouched(input) &&
          input !== document.activeElement &&
          type !== 'silent')
      )
        input.reportValidity();
      else isPendingError.current = true;
    },
    [isInFormEditor]
  );

  React.useEffect(() => setValidation(message), [message, setValidation]);

  return {
    inputRef,
    validationRef: React.useCallback(
      (input): void => {
        inputRef.current = input;
        setValidation(
          validationMessageRef.current,
          clearOnTyping ? 'auto' : 'focus'
        );
      },
      [setValidation]
    ),
    setValidation,
  };
}
