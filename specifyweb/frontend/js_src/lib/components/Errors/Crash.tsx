import React from 'react';

import { displayError } from '../Core/Contexts';
import { breakpoint } from './assert';
import { ErrorDialog } from './ErrorDialog';
import { formatError, handleAjaxError } from './FormatError';
import {RA} from '../../utils/types';

/** Display an error message. Can be dismissed */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const fail = (error: Error,...args:RA<unknown>): void => showError(error, true, ...args);

// FEATURE: softFail errors should be displayed in the UI as toasts
export const softFail =
  process.env.NODE_ENV === 'development' ? fail : console.error;

/** Display an error message. Can only be dismissed if has user preference set */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const crash = (error: Error): void => showError(error, false);

/** Spawn a modal error dialog based on an error object */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
function showError(error: Error, dismissible: boolean, ...args: RA<unknown>): void {
  if (
    Object.getOwnPropertyDescriptor(error ?? {}, 'handledBy')?.value ===
    handleAjaxError
  )
    // It is a network error, and it has already been handled
    return;
  const [errorObject, errorMessage, copiableMessage] = formatError(error);
  console.error(errorMessage,...args);
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
