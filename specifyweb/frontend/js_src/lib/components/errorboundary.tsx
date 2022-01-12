/*
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 * @module
 */

import React from 'react';

import commonText from '../localization/common';
import { clearUnloadProtect } from '../navigation';
import type { IR } from '../types';
import { Dialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { Button, Link } from './basic';

type ErrorBoundaryState =
  | {
      readonly hasError: false;
    }
  | {
      readonly hasError: true;
      readonly error: { toString: () => string };
      readonly errorInfo: { componentStack: string };
    };

function ErrorDialog({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <Dialog
      title={commonText('errorBoundaryDialogTitle')}
      header={commonText('errorBoundaryDialogHeader')}
      buttons={
        <Button.Red
          onClick={(): void => {
            window.location.href = '/';
          }}
        >
          {commonText('close')}
        </Button.Red>
      }
      forceToTop={true}
    >
      <p>
        {commonText('errorBoundaryDialogMessage')}
        <br />
        {commonText('errorBoundaryDialogSecondMessage')(
          <Link.Default href="mailto:support@specifysoftware.org">
            support@specifysoftware.org
          </Link.Default>
        )}
      </p>
      <details className="whitespace-pre-wrap">
        <summary>{commonText('errorMessage')}</summary>
        {children}
      </details>
    </Dialog>
  );
}

const View = createBackboneView(ErrorDialog);

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export function crash(error: Error): void {
  console.error(error);
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  new View({ children: error.message ?? error.toString() }).render();
}

export default class ErrorBoundary extends React.Component<
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

export const silenceErrors = <PROPS extends IR<unknown>>(
  Component: (props: PROPS) => JSX.Element | null
): typeof Component =>
  function SilenceErrors(props: PROPS): JSX.Element {
    return (
      <ErrorBoundary silentErrors={true}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
