/*
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 * @module
 */

import React from 'react';

import { breakpoint } from '../assert';
import commonText from '../localization/common';
import { clearUnloadProtect } from '../navigation';
import type { RA } from '../types';
import { Button, Container, H2, Link } from './basic';
import { Dialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

type ErrorBoundaryState =
  | {
      readonly hasError: false;
    }
  | {
      readonly hasError: true;
      readonly error: { toString: () => string };
      readonly errorInfo: { componentStack: string };
    };

function ErrorComponent({
  header,
  message,
}: {
  readonly header: string;
  readonly message: string;
}): JSX.Element {
  return (
    <Container.Generic>
      <H2>{header}</H2>
      <p>{message}</p>
    </Container.Generic>
  );
}

export const ErrorView = createBackboneView(ErrorComponent);

export const supportLink =
  process.env.NODE_ENV == 'test' ? (
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
  // Error dialog is only closable in Development
  onClose: handleClose,
}: {
  readonly children: React.ReactNode;
  readonly title?: string;
  readonly header?: string;
  readonly onClose?: () => void;
}): JSX.Element {
  return (
    <Dialog
      title={title}
      header={header}
      buttons={
        <>
          <Button.Red onClick={(): void => window.location.assign('/')}>
            {commonText('close')}
          </Button.Red>
          {process.env.NODE_ENV !== 'production' &&
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
        {commonText('errorBoundaryDialogMessage')}
        <br />
        {commonText('errorBoundaryDialogSecondMessage')(supportLink)}
      </p>
      <details className="flex-1 whitespace-pre-wrap">
        <summary>{commonText('errorMessage')}</summary>
        {children}
      </details>
    </Dialog>
  );
}

export const UnhandledErrorView = createBackboneView(ErrorDialog);

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function crash(error: Error): void {
  const [errorObject, errorMessage] = formatError(error);
  console.error(errorMessage);
  breakpoint();
  const handleClose = (): void => void view.remove();
  const view = new UnhandledErrorView({
    children: errorObject,
    onClose: handleClose,
  }).render();
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
    error: { readonly toString: () => string },
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
        <ErrorDialog>
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

function formatError(
  error: unknown,
  url?: string
): Readonly<[errorObject: JSX.Element, errorMessage: string]> {
  const errorObject: React.ReactNode[] = [
    typeof error === 'string' && (
      <p>
        Error occurred fetching from <code>{url}</code>
      </p>
    ),
  ];
  const errorMessage: string[] =
    typeof url === 'string' ? [`Error occurred fetching from ${url}`] : [];

  if (typeof error === 'object' && error !== null) {
    if (error instanceof Error) {
      errorObject.push(
        <>
          <p>Stack:</p>
          <pre>{error.stack}</pre>
        </>
      );
      errorMessage.push(`Error: ${error.message}`);
      console.error(error);
    } else if ('statusText' in error && 'responseText' in error) {
      const { statusText, responseText } = error as {
        readonly statusText: string;
        readonly responseText: string;
      };
      errorObject.push(
        <>
          <p>{statusText}</p>
          {formatErrorResponse(responseText)}
        </>
      );
      errorMessage.push(statusText);
    } else errorObject.push(<p>{error.toString()}</p>);
  }

  return [
    <div className="gap-y-2 flex flex-col h-full">{errorObject}</div>,
    errorMessage.join('\n'),
  ] as const;
}

export function handleAjaxError(
  error: unknown,
  url: string,
  strict: boolean
): never {
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
      url
    );
    new PermissionErrorView({
      error: errorObject,
    }).render();
    throw new Error(errorMessage);
  }
  const [errorObject, errorMessage] = formatError(error, url);
  const handleClose = (): void => void view?.remove();
  const view =
    strict && !isPermissionError
      ? new UnhandledErrorView({
          title: commonText('backEndErrorDialogTitle'),
          header: commonText('backEndErrorDialogHeader'),
          children: errorObject,
          onClose: handleClose,
        }).render()
      : undefined;
  throw new Error(errorMessage);
}

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

type PermissionAction = 'create' | 'read' | 'update' | 'delete';
type PermissionErrorSchema = {
  readonly NoMatchingRuleException: RA<{
    readonly action: PermissionAction;
    readonly collectionid: number;
    readonly resource: string;
    readonly userid: string;
  }>;
};

function PermissionError({
  error,
}: {
  readonly error: JSX.Element | undefined;
}): JSX.Element {
  return typeof error === 'object' ? (
    /*
     * If this type of error occurs, it is a UI's fault
     * No need to localize it, only need to make sure it never happens
     */
    <Dialog
      header="Permission denied error"
      onClose={(): void => window.location.assign('/specify/')}
      buttons={
        <Button.DialogClose component={Button.Red}>
          {commonText('close')}
        </Button.DialogClose>
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
      {commonText('sessionTimeOutDialogMessage')}
    </Dialog>
  );
}

const PermissionErrorView = createBackboneView(PermissionError);

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
