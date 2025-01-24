/**
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 * @module
 */

import React from 'react';
import type { State } from 'typesafe-reducer';

import { errorDetails } from './assert';
import { ErrorDialog } from './ErrorDialog';
import { produceStackTrace } from './stackTrace';

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
    readonly dismissible?: boolean;
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
    // Reload the page if webpack bundle is stale
    if (
      process.env.NODE_ENV === 'development' &&
      error.name === 'ChunkLoadError'
    )
      globalThis.location.reload();
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
              errorDetails
            )?.value,
          })}
          dismissible={this.props.dismissible}
          onClose={(): void => this.setState({ type: 'Silenced' })}
        >
          {this.state.error?.toString()}
          <br />
          {this.state.errorInfo.componentStack}
        </ErrorDialog>
      ) : (
        (this.props.children ?? null)
      );
  }
}
