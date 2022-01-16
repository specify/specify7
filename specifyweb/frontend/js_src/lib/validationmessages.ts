import formsText from './localization/forms';
import type { Input } from './saveblockers';
import type { RA } from './types';
import { className } from './components/basic';

/**
 * Display field's validation messages (both native and custom)
 * Do not use this in React components. Prefer useValidation instead
 */
export function validationMessages(
  field: Input,
  validationMessages: RA<string>
): void {
  field.setCustomValidity('');
  if (!hasNativeErrors(field)) updateCustomValidity(field, validationMessages);

  if (!ignoreValidationErrors(field)) field.reportValidity();
}

function updateCustomValidity(field: Input, messages: RA<string>): void {
  /*
   * Don't report "Required" errors until field is interacted with or
   * form is being submitted
   */
  const filteredMessages = isInputTouched(field)
    ? messages
    : messages.filter((message) => message !== formsText('requiredField'));

  field.setCustomValidity(filteredMessages.join('\n'));
}

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

const isInputTouched = (field: Input): boolean =>
  !field.classList.contains(className.notTouchedInput) ||
  field.closest('form')?.classList.contains(className.notSubmittedForm) !==
    true;

/*
 * Don't report errors until field is interacted with or form is being submitted
 */
export const ignoreValidationErrors = (field: Input): boolean =>
  !isInputTouched(field) && !hasNativeErrors(field, ['customError', 'valid']);
