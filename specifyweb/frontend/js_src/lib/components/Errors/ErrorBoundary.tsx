/**
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 * @module
 */

import React from 'react';
import type { State } from 'typesafe-reducer';
import { produceStackTrace } from './stackTrace';
import { ErrorDialog } from './ErrorDialog';

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
