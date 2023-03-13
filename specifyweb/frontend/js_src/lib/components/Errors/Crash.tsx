import React from 'react';

import type { RA } from '../../utils/types';
import { displayError } from '../Core/Contexts';
import { breakpoint } from './assert';
import { ErrorDialog } from './ErrorDialog';
import { formatError, handleAjaxError } from './FormatError';

/**
 * Display an error message. Can be dismissed
 * Original name for the function was "fail", but that clashes with Jest's
 * function available on global scope - thus confusing auto-imports
 */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const raise = (error: Error, ...args: RA<unknown>): void =>
  showError(error, true, ...args);

export const softFail =
  process.env.NODE_ENV === 'development' ? raise : console.error;

/** Display an error message. Can only be dismissed if has user preference set */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const crash = (error: Error): void => showError(error, false);

/** Spawn a modal error dialog based on an error object */

function showError(
  error: Error,
  dismissible: boolean,
  ...args: RA<unknown>
): void {
  if (
    Object.getOwnPropertyDescriptor(error ?? {}, 'handledBy')?.value ===
    handleAjaxError
  )
    // It is a network error, and it has already been handled
    return;
  const [errorObject, errorMessage, copiableMessage] = formatError(error);
  console.error(errorMessage, ...args);
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
