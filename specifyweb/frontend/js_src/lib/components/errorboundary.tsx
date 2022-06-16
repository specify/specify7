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
import { getRawUserPreferences } from '../preferencesutils';
import { remotePrefs } from '../remoteprefs';
import { schema } from '../schema';
import { setCurrentComponent } from '../specifyapp';
import { getSystemInfo } from '../systeminfo';
import { userInformation } from '../userinfo';
import { Button, Input, Label, Link } from './basic';
import { displayError, legacyLoadingContext } from './contexts';
import { downloadFile } from './filepicker';
import { Dialog } from './modaldialog';
import { clearUnloadProtect } from './navigation';
import { NotFoundView } from './notfoundview';
import { formatPermissionsError, PermissionError } from './permissiondenied';
import { usePref } from './preferenceshooks';
import { useCachedState } from './statecache';
import { clearCache } from './toolbar/cachebuster';

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
  const [clearCacheOnException = false, setClearCache] = useCachedState({
    bucketName: 'general',
    cacheName: 'clearCacheOnException',
    defaultValue: false,
    staleWhileRefresh: false,
  });
  return (
    <Dialog
      header={header}
      buttons={
        <>
          <Button.Blue
            onClick={(): void =>
              void downloadFile(
                /*
                 * Even though the file is in a JSON format, the `.txt` file
                 * extension is used since `.json` files can't be attached to
                 * a GitHub issue (I know, that's crazy). Alternative solution
                 * is to create a `.zip` archive with a `.json` file instead,
                 * but that would require some giant zipping library.
                 */
                `Specify 7 Crash Report - ${new Date().toJSON()}.txt`,
                copiableMessage
              )
            }
          >
            {commonText('downloadErrorMessage')}
          </Button.Blue>
          <span className="flex-1 -ml-2" />
          <Label.ForCheckbox>
            <Input.Checkbox
              checked={clearCacheOnException}
              onValueChange={setClearCache}
            />
            {commonText('clearCache')}
          </Label.ForCheckbox>
          <Button.Red
            onClick={(): void =>
              // TODO: use loading() here after everything is using React
              legacyLoadingContext(
                (clearCacheOnException
                  ? clearCache()
                  : Promise.resolve(undefined)
                ).then(() => window.location.assign('/specify/'))
              )
            }
          >
            {commonText('goToHomepage')}
          </Button.Red>
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
      <p>{commonText('errorBoundaryDialogText')}</p>
      <br />
      <p>{commonText('errorBoundaryDialogSecondMessage', supportLink)}</p>
      <details
        className="flex-1 whitespace-pre-wrap"
        open={process.env.NODE_ENV !== 'production'}
      >
        <summary>{commonText('errorMessage')}</summary>
        {children}
      </details>
    </Dialog>
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
 * The stack trace is about 32KB in size!
 */
const produceStackTrace = (message: unknown): string =>
  JSON.stringify({
    message,
    userInformation,
    systemInformation: getSystemInfo(),
    schema: removeKey(schema, 'models'),
    href: window.location.href,
    tablePermissions: getTablePermissions(),
    operationPermissions: getOperationPermissions(),
    remotePrefs,
    userPreferences: getRawUserPreferences(),
  });

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
  const copiableMessage: unknown[] =
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
      copiableMessage.push(error);
    } else {
      errorObject.push(
        <p className="raw" key="raw">
          {JSON.stringify(error, null, 4)}
        </p>
      );
      errorMessage.push(JSON.stringify(error, null, 4));
      copiableMessage.push(JSON.stringify(error, null, 4));
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
    <div key="object" className="gap-y-2 flex flex-col h-full">
      {errorObject}
    </div>,
    errorMessage.join('\n'),
    produceStackTrace(copiableMessage),
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
    setCurrentComponent(<NotFoundView />);
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
        header={commonText('errorBoundaryDialogHeader')}
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
      title={commonText('errorBoundaryDialogHeader')}
      className="h-full"
      ref={iframeRef}
    />
  );
}
