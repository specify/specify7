/*
 *
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 *
 */

import React from 'react';

import { ModalDialog } from './modaldialog';

type ErrorBoundaryState =
  | {
      readonly hasError: false;
    }
  | {
      readonly hasError: true;
      readonly error: { toString: () => string };
      readonly errorInfo: { componentStack: string };
    };

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
    console.error(error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  public render(): JSX.Element | null {
    return this.state.hasError ? (
      this.props.silentErrors ? (
        <></>
      ) : (
        <ModalDialog
          properties={{
            title: 'Unexpected Error',
            buttons: [
              {
                text: 'Reload',
                click(): void {
                  window.location.reload();
                },
              },
              {
                text: 'Previous Page',
                click(): void {
                  window.history.back();
                },
              },
            ],
          }}
        >
          <p>An unexpected error has occurred.</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </ModalDialog>
      )
    ) : (
      this.props.children
    );
  }
}
