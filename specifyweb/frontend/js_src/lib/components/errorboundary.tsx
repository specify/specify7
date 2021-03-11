/*
*
* Error Boundary for React Components. Catches exceptions and provides a
* stack trace
*
* */

'use strict';

import React           from 'react';
import { ModalDialog } from './modaldialog';

type ErrorBoundaryState =
  {
    hasError: false,
  } | {
  hasError: true,
  error: {toString: () => string},
  errorInfo: {componentStack: string}
};

export default class ErrorBoundary
  extends React.Component<{children: JSX.Element}, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  componentDidCatch(
    error: {toString: () => string},
    errorInfo: {componentStack: string},
  ): void {
    console.log(error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  render(): JSX.Element {
    if (this.state.hasError)
      return <ModalDialog properties={{
        title: 'Unexpected Error',
        buttons: [
          {
            text: 'Reload',
            click: function() {
              window.location.reload();
            },
          },
          {
            text: 'Previous Page',
            click: function() {
              window.history.back();
            },
          }],
      }}>
        <p>An unexpected error has occurred.</p>
        <details style={{whiteSpace: 'pre-wrap'}}>
          {this.state.error && this.state.error.toString()}
          <br />
          {this.state.errorInfo.componentStack}
        </details>
      </ModalDialog>;
    else
      return this.props.children;
  }
}