/**
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 * @module
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { Http } from '../ajax';
import { breakpoint } from '../assert';
import { jsonStringify, removeKey } from '../helpers';
import { consoleLog } from '../interceptlogs';
import { commonText } from '../localization/common';
import { getOperationPermissions, getTablePermissions } from '../permissions';
import { getRawUserPreferences } from '../preferencesutils';
import { remotePrefs } from '../remoteprefs';
import { schema } from '../schema';
import { getSystemInfo } from '../systeminfo';
import type { WritableArray } from '../types';
import { userInformation } from '../userinfo';
import { Button, Input, Label, Link } from './basic';
import {
  displayError,
  legacyLoadingContext,
  UnloadProtectsContext,
} from './contexts';
import { downloadFile } from './filepicker';
import { useId } from './hooks';
import { Dialog } from './modaldialog';
import { formatPermissionsError, PermissionError } from './permissiondenied';
import { usePref } from './preferenceshooks';
import { useCachedState } from './statecache';
import { clearCache } from './toolbar/cachebuster';
import { unsafeTriggerNotFound } from './router';

type ErrorBoundaryState =
  | State<
      'Error',
      {
        readonly hasError: true;
        readonly error: Error;
        readonly errorInfo: { readonly componentStack: string };
      }
    >
  | State<'Main'>
  | State<'Silenced'>;

export const supportLink =
  process.env.NODE_ENV === 'test' ? (
    (undefined as unknown as JSX.Element)
  ) : (
    <Link.NewTab href="mailto:support@specifysoftware.org" rel="noreferrer">
      support@specifysoftware.org
    </Link.NewTab>
  );

const errors = new Set<string>();

function ErrorDialog({
  header = commonText('errorBoundaryDialogHeader'),
  children,
  copiableMessage,
  // Error dialog is only closable in Development
  onClose: handleClose,
  dismissable = false,
}: {
  readonly children: React.ReactNode;
  readonly copiableMessage: string;
  readonly header?: string;
  readonly onClose?: () => void;
  readonly dismissable?: boolean;
}): JSX.Element {
  const id = useId('error-dialog')('');
  // If there is more than one error, all but the last one should be dismissable
  const isLastError = React.useRef(errors.size === 0).current;
  React.useEffect(() => {
    errors.add(id);
    return (): void => void errors.delete(id);
  }, [id]);

  const [canDismiss] = usePref(
    'general',
    'application',
    'allowDismissingErrors'
  );
  const canClose =
    (canDismiss ||
      dismissable ||
      process.env.NODE_ENV === 'development' ||
      !isLastError) &&
    typeof handleClose === 'function';
  const [clearCacheOnException = false, setClearCache] = useCachedState(
    'general',
    'clearCacheOnException'
  );

  const [unloadProtects, setUnloadProtects] = React.useContext(
    UnloadProtectsContext
  )!;
  /**
   * Clear unload protects when error occurs, but return them back if error
   * is dismissed
   */
  const initialUnloadProtects = React.useRef(unloadProtects ?? []);
  React.useCallback(() => setUnloadProtects?.([]), [setUnloadProtects]);

  return (
    <Dialog
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
          <span className="-ml-2 flex-1" />
          <Label.ForCheckbox>
            <Input.Checkbox
              checked={clearCacheOnException}
              onValueChange={setClearCache}
            />
            {commonText('clearCache')}
          </Label.ForCheckbox>
          <Button.Red
            onClick={(): void =>
              legacyLoadingContext(
                (clearCacheOnException
                  ? clearCache()
                  : Promise.resolve(undefined)
                ).then(() => globalThis.location.assign('/specify/'))
              )
            }
          >
            {commonText('goToHomepage')}
          </Button.Red>
          {canClose && (
            <Button.Blue
              onClick={(): void => {
                setUnloadProtects?.(
                  initialUnloadProtects.current.length === 0
                    ? unloadProtects
                    : initialUnloadProtects.current
                );
                handleClose();
              }}
            >
              {commonText('dismiss')}
            </Button.Blue>
          )}
        </>
      }
      forceToTop
      header={header}
      onClose={undefined}
    >
      <p>
        {commonText('errorBoundaryDialogText')}
        {!canClose && commonText('errorBoundaryCriticalDialogText')}
      </p>
      <br />
      <p>{commonText('errorBoundaryDialogSecondMessage', supportLink)}</p>
      <details
        className="flex-1 whitespace-pre-wrap"
        open={process.env.NODE_ENV === 'development'}
      >
        <summary>{commonText('errorMessage')}</summary>
        {children}
      </details>
    </Dialog>
  );
}

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
function showError(error: Error, dismissable: boolean): void {
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
      dismissable={dismissable}
      onClose={handleClose}
    >
      {errorObject}
    </ErrorDialog>
  ));
}

export class ErrorBoundary extends React.Component<
  {
    readonly children: React.ReactNode;
    /*
     * Can wrap a component in an <ErrorBoundary> with silentErrors
     * to silence all errors from it (on error, the component is quietly
     * deRendered), if in production
     * Useful for ensuring non-critical and experimental components don't
     * crash the whole application
     */
    readonly silentErrors?: boolean;
    readonly dismissable?: boolean;
  },
  ErrorBoundaryState
> {
  public readonly state: ErrorBoundaryState = {
    type: 'Main',
  };

  public componentDidCatch(
    error: Error,
    errorInfo: { readonly componentStack: string }
  ): void {
    console.error(error.toString());
    this.setState({
      type: 'Error',
      error,
      errorInfo,
    });
  }

  public render(): React.ReactNode {
    if (
      (this.state.type === 'Error' &&
        this.props.silentErrors === true &&
        process.env.NODE_ENV !== 'development') ||
      this.state.type === 'Silenced'
    )
      return null;
    else
      return this.state.type === 'Error' ? (
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
          dismissable={this.props.dismissable}
          onClose={(): void => this.setState({ type: 'Silenced' })}
        >
          {this.state.error?.toString()}
          <br />
          {this.state.errorInfo.componentStack}
        </ErrorDialog>
      ) : (
        this.props.children ?? null
      );
  }
}

/**
 * The stack trace is about 83KB in size
 */
const produceStackTrace = (message: unknown): string =>
  jsonStringify({
    message,
    userInformation,
    systemInformation: getSystemInfo(),
    schema: removeKey(schema, 'models'),
    href: globalThis.location.href,
    consoleLog,
    // Network log and page load telemetry
    eventLog: globalThis.performance.getEntries(),
    tablePermissions: getTablePermissions(),
    operationPermissions: getOperationPermissions(),
    remotePrefs,
    userPreferences: getRawUserPreferences(),
    navigator: {
      userAgent: navigator.userAgent,
      language: navigator.language,
    },
  });

function formatError(
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
    const json = JSON.parse(error);
    return <pre>{jsonStringify(json, 2)}</pre>;
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
        header={commonText('errorBoundaryDialogHeader')}
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
function ErrorIframe({
  children: error,
}: {
  readonly children: string;
}): JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  React.useEffect(() => {
    if (iframeRef.current === null) return;
    const iframeDocument =
      iframeRef.current.contentDocument ??
      iframeRef.current.contentWindow?.document;
    if (iframeDocument === undefined) return;
    iframeDocument.body.innerHTML = error;
  }, [error]);

  return (
    <iframe
      className="h-full"
      ref={iframeRef}
      title={commonText('errorBoundaryDialogHeader')}
    />
  );
}
