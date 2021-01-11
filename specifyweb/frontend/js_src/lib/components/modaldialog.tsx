/*
*
* A React wrapper for jQuery's dialog. Also has a jQuery's dialog with a loading bar inside it
*
* */

'use strict';

import React               from 'react';
import ReactDOM            from 'react-dom';
import $                   from 'jquery';
import { named_component } from './statemanagement';

function ModalDialogContent({
	children,
	onLoadCallback,
}: ModalDialogContentProps) {

	onLoadCallback && React.useEffect(onLoadCallback, []);

	return <>
		{children}
	</>;
}

function close_dialog($dialog: JQuery<HTMLElement>, resize: () => void, onCloseCallback?: () => void) {
	if (!$dialog.is(':ui-dialog'))
		return;
	ReactDOM.unmountComponentAtNode($dialog[0]);
	window.removeEventListener('resize', resize);
	$dialog.dialog('destroy');
	if (typeof onCloseCallback === 'function')
		onCloseCallback();
}

export const ModalDialog = React.memo(named_component(({
	onCloseCallback,
	properties,
	onLoadCallback,
	children,
}: ModalDialogProps) => {

	const dialog_ref = React.useRef<HTMLDivElement>(null);
	const [$dialog, setDialog] = React.useState<JQuery<HTMLElement> | undefined>();

	React.useEffect(() => {
		if (dialog_ref.current === null)
			return;

		const dialog_element = $(dialog_ref.current.children[0] as HTMLElement);
		const resize = () => dialog_element.dialog('option', 'position', 'center');

		const close_dialog_bind = () => close_dialog(dialog_element, resize, onCloseCallback);

		dialog_element.dialog({
			modal: true,
			width: 300,
			close: close_dialog_bind,
			buttons: [
				{
					text: 'Cancel', click: close_dialog_bind,
				},
			],
			...properties,
		});
		window.addEventListener('resize', resize);

		setDialog(dialog_element);

		return close_dialog_bind;

	}, [dialog_ref]);

	React.useEffect(() => {

		if (typeof $dialog === 'undefined')
			return;

		ReactDOM.render(
			<ModalDialogContent
				onLoadCallback={onLoadCallback && onLoadCallback.bind(null, $dialog)}
			>
				{children}
			</ModalDialogContent>,
			$dialog[0]);

	}, [$dialog, children]);

	return <div ref={dialog_ref}>
		<div />
	</div>;
}, 'ModalDialog'));


//Loading Screen
function handleOnLoad(dialog: JQuery<HTMLElement>) {
	$('.progress-bar', dialog).progressbar({value: false});
}

export const LoadingScreen = named_component(() =>
	<ModalDialog
		onLoadCallback={handleOnLoad}
		properties={{
			modal: false,
			title: 'Loading',
			buttons: [],
			close: undefined,
		}}
	>
		<div className="progress-bar" />
	</ModalDialog>, 'LoadingScreen');