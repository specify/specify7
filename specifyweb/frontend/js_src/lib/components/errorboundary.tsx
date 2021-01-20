/*
*
* Error Boundary for React Components. Catches exceptions and provides a stack trace
*
* */

'use strict';

import React from 'react';
import { ModalDialog }      from './modaldialog';

type ErrorBoundaryState =
	{
		has_error: false,
	} | {
	has_error: true,
	error: {toString: () => string},
	errorInfo: {componentStack: string}
};

export default class ErrorBoundary extends React.Component<{children: JSX.Element}, ErrorBoundaryState> {
	state: ErrorBoundaryState = {
		has_error: false,
	};

	componentDidCatch(error: {toString: () => string}, errorInfo: {componentStack: string}):void {
		console.log(error, errorInfo);
		this.setState({
			has_error: true,
			error,
			errorInfo,
		});
	}

	render():JSX.Element {
		if (this.state.has_error)
			return <ModalDialog properties={{
				title: 'Unexpected Error',
				buttons: [
					{
						text: 'Reload', click: function() {
							window.location.reload();
						},
					},
					{
						text: 'Previous Page', click: function() {
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