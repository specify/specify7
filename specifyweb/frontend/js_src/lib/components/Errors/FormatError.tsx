import React from 'react';

import { mainText } from '../../localization/main';
import { Http } from '../../utils/ajax/definitions';
import type { RA, WritableArray } from '../../utils/types';
import { jsonStringify } from '../../utils/utils';
import { displayError } from '../Core/Contexts';
import { userInformation } from '../InitialContext/userInformation';
import { join } from '../Molecules';
import { formatPermissionsError } from '../Permissions/FormatError';
import { PermissionError } from '../Permissions/PermissionDenied';
import { unsafeTriggerNotFound } from '../Router/Router';
import { ErrorDialog } from './ErrorDialog';
import { formatJsonBackendResponse } from './JsonError';
import { produceStackTrace } from './stackTrace';

export function formatError(
  error: unknown,
  url?: string
): Readonly<
  readonly [
    errorObject: JSX.Element,
    errorMessage: string,
    copiableMessage: string
  ]
> {
  const errorObject: WritableArray<React.ReactNode> = [
    typeof url === 'string' && (
      <p key="errorOccurred">
        Error occurred fetching from <code>{url}</code>
      </p>
    ),
  ];
  const errorMessage: WritableArray<string> =
    typeof url === 'string' ? [`Error occurred fetching from ${url}`] : [];
  const copiableMessage: WritableArray<unknown> =
    typeof url === 'string' ? [`Error occurred fetching from ${url}`] : [];

  if (typeof error === 'object' && error !== null) {
    if (error instanceof Error) {
      errorObject.push(
        <React.Fragment key="stack">
          <p>{error.message}</p>
          {typeof error.stack === 'string' && error.stack.length > 0 && (
            <>
              <p>Stack:</p>
              <pre>{error.stack}</pre>
            </>
          )}
        </React.Fragment>
      );
      errorMessage.push(`Error: ${error.message}`);
      copiableMessage.push(
        `Message: ${error.message}`,
        `Stack: ${error.stack}`
      );
      console.error(error);
    } else if ('statusText' in error && 'responseText' in error) {
      const { statusText, responseText } = error as {
        readonly statusText: RA<string> | string;
        readonly responseText: string;
      };
      const statusTextArray = Array.isArray(statusText)
        ? statusText
        : [statusText];
      errorObject.push(
        <React.Fragment key="statusText">
          <p className="whitespace-normal">
            {join(
              statusTextArray,
              <>
                <br />
                <br />
              </>
            )}
          </p>
          {formatErrorResponse(responseText)}
        </React.Fragment>
      );
      errorMessage.push(...statusTextArray);
      copiableMessage.push(error);
    } else {
      const serialized = jsonStringify(error, 4);
      errorObject.push(
        <p className="raw" key="raw">
          {serialized}
        </p>
      );
      errorMessage.push(serialized);
      copiableMessage.push(serialized);
    }
  } else {
    const message = (error as string | undefined)?.toString() ?? '';
    errorObject.push(
      <p className="raw" key="raw">
        {message}
      </p>
    );
    errorMessage.push(message);
    copiableMessage.push(message);
  }

  return [
    <div className="flex h-full flex-col gap-2" key="object">
      {errorObject}
    </div>,
    errorMessage.join('\n'),
    produceStackTrace(copiableMessage),
  ] as const;
}

/** Format error message as JSON, HTML or plain text */
function formatErrorResponse(error: string): JSX.Element {
  try {
    return formatJsonBackendResponse(error);
  } catch {
    // Failed parsing error message as JSON
  }
  try {
    const htmlElement = document.createElement('html');
    htmlElement.innerHTML = error;
    htmlElement.remove();
    return <ErrorIframe>{error}</ErrorIframe>;
  } catch {
    // Failed parsing error message as HTML
  }
  // Output raw error message
  return <pre>{error}</pre>;
}

export function handleAjaxError(
  error: unknown,
  response: Response,
  strict: boolean
): never {
  /*
   * If exceptions occur because user has no agent, don't display the error
   * message, so as not to spawn a new dialog on top of the "No Agent" dialog
   */
  if (userInformation.agent === null) throw error;

  if (strict) {
    const isNotFoundError =
      response.status === Http.NOT_FOUND &&
      process.env.NODE_ENV !== 'development';
    // In production, uncaught 404 errors redirect to the NOT FOUND page
    if (isNotFoundError && unsafeTriggerNotFound()) {
      Object.defineProperty(error, 'handledBy', {
        value: handleAjaxError,
      });
      throw error;
    }
    const permissionError = error as {
      readonly type: 'permissionDenied';
      readonly responseText: string;
    };
    const isPermissionError =
      typeof permissionError === 'object' &&
      permissionError?.type === 'permissionDenied';
    if (isPermissionError) {
      const parsed = formatPermissionsError(
        permissionError.responseText,
        response.url
      );
      if (Array.isArray(parsed)) {
        const [errorObject, errorMessage] = parsed;
        displayError(({ onClose: handleClose }) => (
          <PermissionError error={errorObject} onClose={handleClose} />
        ));
        const error = new Error(errorMessage);
        Object.defineProperty(error, 'handledBy', {
          value: handleAjaxError,
        });
        throw error;
      }
    }
  }
  const [errorObject, errorMessage, copiableMessage] = formatError(
    error,
    response.url
  );
  if (strict)
    displayError(({ onClose: handleClose }) => (
      <ErrorDialog
        copiableMessage={copiableMessage}
        header={mainText.errorOccurred()}
        onClose={handleClose}
      >
        {errorObject}
      </ErrorDialog>
    ));
  const newError = new Error(errorMessage);
  Object.defineProperty(newError, 'handledBy', {
    value: handleAjaxError,
  });
  throw newError;
}

/** Create an iframe from HTML string */
export function ErrorIframe({
  children: error,
}: {
  readonly children: string;
}): JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  React.useEffect(() => {
    if (iframeRef.current === null) return;
    iframeRef.current.srcdoc = error;
  }, [error]);

  return (
    <iframe
      className="h-full w-full"
      ref={iframeRef}
      sandbox="allow-scripts"
      title={mainText.errorOccurred()}
    />
  );
}
