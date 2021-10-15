import type { RA } from './components/wbplanview';
import formsText from './localization/forms';

export function validationMessages(
  field: HTMLInputElement,
  validationMessages: RA<string>
): void {
  field.setCustomValidity('');

  /*
   * Don't report "Required" errors until field is interacted with or
   * form is being submitted
   */
  const isUntouchedRequired =
    !isInputTouched(field) &&
    field.validity.valueMissing &&
    !hasNativeErrors(field, ['customError', 'valid', 'valueMissing']);

  if (hasNativeErrors(field)) {
    if (!isUntouchedRequired) field.reportValidity();
  } else {
    updateCustomValidity(field, validationMessages);
    if (!isUntouchedRequired) field.reportValidity();
  }
}

function updateCustomValidity(
  field: HTMLInputElement,
  messages: RA<string>
): void {
  /*
   * Don't report "Required" errors until field is interacted with or
   * form is being submitted
   */
  const filteredMessages = isInputTouched(field)
    ? messages
    : messages.filter((message) => message !== formsText('requiredField'));

  field.setCustomValidity(filteredMessages.join('\n'));
}

/*
 * Whether browser identified any issues with the field
 *
 * this.control.checkValidity() returns true if custom error message has
 * been set, which is why it can't be used here
 */
const hasNativeErrors = (
  field: HTMLInputElement,
  exceptions = ['customError', 'valid']
): boolean =>
  Object.keys(Object.getPrototypeOf(field.validity))
    .filter((type) => !exceptions.includes(type))
    .some((type) => field.validity[type as keyof ValidityState]);

const isInputTouched = (field: HTMLInputElement): boolean =>
  field.classList.contains('touched') ||
  field.closest('form')?.classList.contains('submitted') === true;
