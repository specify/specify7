import { formatError, handleAjaxError } from './FormatError';
import { breakpoint } from './assert';
import { displayError } from '../Core/Contexts';
import { ErrorDialog } from './ErrorDialog';
import React from 'react';

/** Display an error message. Can be dismissed */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const fail = (error: Error): void => showError(error, true);
export const softFail =
  process.env.NODE_ENV === 'development' ? fail : console.error;
/** Display an error message. Can only be dismissed if has user preference set */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const crash = (error: Error): void => showError(error, false);

/** Spawn a modal error dialog based on an error object */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
function showError(error: Error, dismissible: boolean): void {
  if (
    Object.getOwnPropertyDescriptor(error ?? {}, 'handledBy')?.value ===
    handleAjaxError
  )
    // It is a network error, and it has already been handled
    return;
  const [errorObject, errorMessage, copiableMessage] = formatError(error);
  console.error(errorMessage);
  breakpoint();
  displayError(({ onClose: handleClose }) => (
    <ErrorDialog
      copiableMessage={copiableMessage}
      dismissible={dismissible}
      onClose={handleClose}
    >
      {errorObject}
    </ErrorDialog>
  ));
}
