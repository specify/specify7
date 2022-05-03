/**
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 * @module
 */

import React from 'react';

import { Http } from '../ajax';
import { breakpoint } from '../assert';
import { removeKey } from '../helpers';
import { commonText } from '../localization/common';
import { getOperationPermissions, getTablePermissions } from '../permissions';
import { remotePrefs } from '../remoteprefs';
import { schema } from '../schema';
import { setCurrentView } from '../specifyapp';
import { getSystemInfo } from '../systeminfo';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Link } from './basic';
import { displayError } from './contexts';
import { copyTextToClipboard, downloadFile } from './filepicker';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { clearUnloadProtect } from './navigation';
import { NotFoundView } from './notfoundview';
import { usePref } from './preferenceshooks';
import { getRawUserPreferences } from '../preferencesutils';

type ErrorBoundaryState =
  | {
      readonly hasError: false;
    }
  | {
      readonly hasError: true;
      readonly error: Error;
      readonly errorInfo: { componentStack: string };
    };

export const supportLink =
  process.env.NODE_ENV === 'test' ? (
    (undefined as unknown as JSX.Element)
  ) : (
    <Link.NewTab href="mailto:support@specifysoftware.org" rel="noreferrer">
      support@specifysoftware.org
    </Link.NewTab>
  );

function ErrorDialog({
  title = commonText('errorBoundaryDialogTitle'),
  header = commonText('errorBoundaryDialogHeader'),
  children,
  copiableMessage,
  // Error dialog is only closable in Development
  onClose: handleClose,
}: {
  readonly children: React.ReactNode;
  readonly copiableMessage: string;
  readonly title?: string;
  readonly header?: string;
  readonly onClose?: () => void;
}): JSX.Element {
  const [canDismiss] = usePref(
    'general',
    'application',
    'allowDismissingErrors'
  );
  return (
    <Dialog
      title={title}
      header={header}
      buttons={
        <>
          <Button.Blue
            onClick={(): void =>
              void downloadFile(
                `Specify 7 Crash Report - ${new Date().toJSON()}.json`,
                copiableMessage
              )
            }
          >
            {commonText('downloadErrorMessage')}
          </Button.Blue>
          <CopyErrorMessage message={copiableMessage} />
          <Link.Blue href="/specify/task/cache-buster/">
            {commonText('clearCache')}
          </Link.Blue>
          <span className="flex-1 -ml-2" />
          <Link.Red href="/" className={className.navigationHandled}>
            {commonText('goToHomepage')}
          </Link.Red>
          {(canDismiss || process.env.NODE_ENV !== 'production') &&
            typeof handleClose === 'function' && (
              <Button.Blue onClick={handleClose}>
                [development] dismiss
              </Button.Blue>
            )}
        </>
      }
      forceToTop={true}
      onClose={undefined}
    >
      <p>
        {commonText('errorBoundaryDialogText')}
        <br />
        {commonText('errorBoundaryDialogSecondMessage', supportLink)}
      </p>
      <details
        className="contents whitespace-pre-wrap"
        open={process.env.NODE_ENV !== 'production'}
      >
        <summary>{commonText('errorMessage')}</summary>
        {children}
      </details>
    </Dialog>
  );
}

const copyMessageTimeout = 3000;

function CopyErrorMessage({ message }: { message: string }): JSX.Element {
  const [wasCopied, handleCopied, handleNotCopied] = useBooleanState();
  return (
    <Button.Green
      onClick={(): void =>
        void copyTextToClipboard(message).then((): void => {
          handleCopied();
          setTimeout(handleNotCopied, copyMessageTimeout);
        })
      }
    >
      {wasCopied ? commonText('copied') : commonText('copyErrorMessage')}
    </Button.Green>
  );
}

/** Spawn a modal error dialog based on an error object */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function crash(error: Error): void {
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
    <ErrorDialog onClose={handleClose} copiableMessage={copiableMessage}>
      {errorObject}
    </ErrorDialog>
  ));
}

export class ErrorBoundary extends React.Component<
  {
    readonly children: JSX.Element | null;
    /*
     * Can wrap a component in an <ErrorBoundary> with silentErrors
     * to silence all errors from it (on error, the component is quietly
     * deRendered), if in production
     * Useful for ensuring non-critical and experimental components don't
     * crash the whole application
     */
    readonly silentErrors?: boolean;
  },
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public componentDidCatch(
    error: Error,
    errorInfo: { readonly componentStack: string }
  ): void {
    clearUnloadProtect();
    console.error(error.toString());
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  public render(): JSX.Element | null {
    return this.state.hasError ? (
      this.props.silentErrors === true &&
      process.env.NODE_ENV === 'production' ? null : (
        <ErrorDialog
          copiableMessage={produceStackTrace({
            message: this.state.error?.toString(),
            stack: this.state.errorInfo.componentStack,
            // Any arguments that are given to the error() function:
            details: Object.getOwnPropertyDescriptor(
              this.state.error,
              'details'
            )?.value,
          })}
        >
          {this.state.error?.toString()}
          <br />
          {this.state.errorInfo.componentStack}
        </ErrorDialog>
      )
    ) : (
      this.props.children
    );
  }
}

/**
 * @remarks
 * The stack trace is about 36KB in size!
 * Can reduce it to 23KB by not prettifying the JSON output
 */
const produceStackTrace = (message: unknown): string =>
  JSON.stringify(
    {
      message,
      userInformation,
      systemInformation: getSystemInfo(),
      schema: removeKey(schema, 'models'),
      href: window.location.href,
      tablePermissions: getTablePermissions(),
      operationPermissions: getOperationPermissions(),
      remotePrefs,
      userPreferences: getRawUserPreferences(),
    },
    null,
    '\t'
  );

function formatError(
  error: unknown,
  url?: string
): Readonly<
  [errorObject: JSX.Element, errorMessage: string, copiableMessage: string]
> {
  const errorObject: React.ReactNode[] = [
    typeof url === 'string' && (
      <p key="errorOccurred">
        Error occurred fetching from <code>{url}</code>
      </p>
    ),
  ];
  const errorMessage: string[] =
    typeof url === 'string' ? [`Error occurred fetching from ${url}`] : [];
  const copiableMessage: string[] =
    typeof url === 'string' ? [`Error occurred fetching from ${url}`] : [];

  if (typeof error === 'object' && error !== null) {
    if (error instanceof Error) {
      errorObject.push(
        <React.Fragment key="stack">
          <p>{error.message}</p>
          <p>Stack:</p>
          <pre>{error.stack}</pre>
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
        readonly statusText: string;
        readonly responseText: string;
      };
      errorObject.push(
        <React.Fragment key="statusText">
          <p>{statusText}</p>
          {formatErrorResponse(responseText)}
        </React.Fragment>
      );
      errorMessage.push(statusText);
      copiableMessage.push(statusText, responseText);
    } else
      errorObject.push(
        <p className="raw" key="raw">
          {error.toString()}
        </p>
      );
  }

  return [
    <div key="object" className="gap-y-2 flex flex-col flex-1">
      {errorObject}
    </div>,
    errorMessage.join('\n'),
    produceStackTrace(copiableMessage.join('\n')),
  ] as const;
}

/** Format error message as JSON, HTML or plain text */
function formatErrorResponse(error: string): JSX.Element {
  try {
    const json = JSON.parse(error);
    return <pre>{JSON.stringify(json, null, 2)}</pre>;
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

  const isNotFoundError =
    response.status === Http.NOT_FOUND && process.env.NODE_ENV === 'production';
  // In production, uncaught 404 errors redirect to the NOT FOUND page
  if (isNotFoundError) {
    clearUnloadProtect();
    setCurrentView(new NotFoundView());
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
    permissionError?.type === 'permissionDenied' &&
    strict;
  if (isPermissionError) {
    const [errorObject, errorMessage] = formatPermissionsError(
      permissionError.responseText,
      response.url
    );
    displayError(({ onClose: handleClose }) => (
      <PermissionError error={errorObject} onClose={handleClose} />
    ));
    const error = new Error(errorMessage);
    Object.defineProperty(error, 'handledBy', {
      value: handleAjaxError,
    });
    throw error;
  }
  const [errorObject, errorMessage, copiableMessage] = formatError(
    error,
    response.url
  );
  if (strict && !isPermissionError)
    displayError(({ onClose: handleClose }) => (
      <ErrorDialog
        title={commonText('backEndErrorDialogTitle')}
        header={commonText('backEndErrorDialogHeader')}
        onClose={handleClose}
        copiableMessage={copiableMessage}
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
function ErrorIframe({ children: error }: { children: string }): JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  React.useEffect(() => {
    if (iframeRef.current === null) return;
    const iframeDocument =
      iframeRef.current.contentDocument ??
      iframeRef.current.contentWindow?.document;
    if (typeof iframeDocument === 'undefined') return;
    iframeDocument.body.innerHTML = error;
  }, [error]);

  return (
    <iframe
      title={commonText('backEndErrorDialogTitle')}
      className="h-full"
      ref={iframeRef}
    />
  );
}

type PermissionErrorSchema = {
  readonly NoMatchingRuleException: RA<{
    readonly action: string;
    readonly collectionid: number;
    readonly resource: string;
    readonly userid: string;
  }>;
};

function PermissionError({
  error,
  onClose: handleClose,
}: {
  readonly error: JSX.Element | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  return typeof error === 'object' ? (
    <Dialog
      header={commonText('permissionDeniedError')}
      onClose={(): void => window.location.assign('/specify/')}
      buttons={
        <>
          <Button.DialogClose component={Button.Red}>
            {commonText('goToHomepage')}
          </Button.DialogClose>
          <Button.Red onClick={handleClose}>{commonText('dismiss')}</Button.Red>
        </>
      }
    >
      {error}
    </Dialog>
  ) : (
    <Dialog
      title={commonText('sessionTimeOutDialogTitle')}
      header={commonText('sessionTimeOutDialogHeader')}
      forceToTop={true}
      onClose={(): void =>
        window.location.assign(`/accounts/login/?next=${window.location.href}`)
      }
      buttons={commonText('logIn')}
    >
      {commonText('sessionTimeOutDialogText')}
    </Dialog>
  );
}

function formatPermissionsError(
  response: string,
  url: string
): Readonly<[errorObject: JSX.Element | undefined, errorMessage: string]> {
  if (response.length === 0)
    return [undefined, commonText('sessionTimeOutDialogTitle')];
  const error = (JSON.parse(response) as PermissionErrorSchema)
    .NoMatchingRuleException;

  return [
    <div className="gap-y-2 flex flex-col h-full">
      <p>
        Permission denied when accessing <code>{url}</code>
        {formatErrorResponse(response)}
      </p>
    </div>,
    [
      `Permission denied when fetching from ${url}`,
      `Response: ${JSON.stringify(error, null, '\t')}`,
    ].join('\n'),
  ] as const;
}
