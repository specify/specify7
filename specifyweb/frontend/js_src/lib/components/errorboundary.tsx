/*
 *
 * Error Boundary for React Components. Catches exceptions and provides a
 * stack trace
 *
 *
 */

import React from 'react';
import commonText from '../localization/common';

import { clearUnloadProtect } from '../navigation';
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
    clearUnloadProtect();
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  public render(): JSX.Element | null {
    return this.state.hasError ? (
      this.props.silentErrors && process.env.NODE_ENV === 'production' ? (
        <></>
      ) : (
        <ModalDialog
          properties={{
            title: commonText('errorBoundaryDialogTitle'),
            dialogClass: 'ui-dialog-no-close',
            buttons: [
              {
                text: commonText('okay'),
                click(): void {
                  window.location.href = '/';
                },
              },
            ],
          }}
        >
          {commonText('errorBoundaryDialogHeader')}
          <p>{commonText('errorBoundaryDialogMessage')}</p>
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
