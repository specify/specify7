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
    <Container>
      <H2>{header}</H2>
      <p>{message}</p>
    </Container>
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
      <details className="whitespace-pre-wrap">
        <summary>{commonText('errorMessage')}</summary>
        {children}
      </details>
    </Dialog>
  );
}

export const UnhandledErrorView = createBackboneView(ErrorDialog);

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function crash(error: Error): void {
  breakpoint();
  console.error(error);
  const handleClose = (): void => void view.remove();
  const view = new UnhandledErrorView({
    children:
      error.message ??
      // "error.responseText" is for jQuery exceptions
      (error as unknown as { readonly responseText: string }).responseText ??
      error.stack ??
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      error.toString(),
    onClose: handleClose,
  }).render();
}

export class ErrorBoundary extends React.Component<
  { readonly children: JSX.Element | null; readonly silentErrors?: boolean },
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

export function handleAjaxError(
  error: unknown,
  url: string,
  strict: boolean
): Error {
  const errorObject: React.ReactNode[] = [
    <p>
      Error occurred fetching from <code>{url}</code>
    </p>,
  ];
  const errorMessage: string[] = [`Error occurred fetching from ${url}`];

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
    } else if ('message' in error && 'response' in error) {
      const { message, response } = error as {
        readonly message: string;
        readonly response: string;
      };
      errorObject.push(
        <>
          <p>{message}</p>
          {formatErrorResponse(response)}
        </>
      );
      errorMessage.push(message);
    } else errorObject.push(<p>{error.toString()}</p>);
  }

  const handleClose = (): void => void view?.remove();
  const view = strict
    ? new UnhandledErrorView({
        title: commonText('backEndErrorDialogTitle'),
        header: commonText('backEndErrorDialogHeader'),
        children: (
          <div className="gap-y-2 flex flex-col flex-1">{errorObject}</div>
        ),
        onClose: handleClose,
      }).render()
    : undefined;
  throw new Error(errorMessage.join('\n'));
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

  return <iframe className="flex-1" ref={iframeRef} />;
}
