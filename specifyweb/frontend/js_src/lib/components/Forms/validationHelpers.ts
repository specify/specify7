/**
 * Helpers for dealing with browsers' native Validation API
 */

import { className } from '../Atoms/className';

export type Input =
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/**
 * Whether browser identified any issues with the field
 *
 * this.control.checkValidity() returns true if custom error message has
 * been set, which is why it can't be used here
 */
export const hasNativeErrors = (
  field: Input,
  exceptions = ['customError', 'valid']
): boolean =>
  Object.keys(Object.getPrototypeOf(field.validity))
    .filter((type) => !exceptions.includes(type))
    .some((type) => field.validity[type as keyof ValidityState]);

/**
 * Don't report errors until field is interacted with or form is being submitted
 */
export const isInputTouched = (field: Input): boolean =>
  !field.classList.contains(className.notTouchedInput) ||
  field.closest('form')?.classList.contains(className.notSubmittedForm) !==
    true;
