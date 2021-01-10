/*
*
* A React wrapper for jQuery's dialog. Also has a jQuery's dialog with a loading bar inside it
*
* */

'use strict';

import React               from 'react';
import $                   from 'jquery';
import { named_component } from './wbplanview';


export const ModalDialog = React.memo(named_component(({
	onCloseCallback,
	properties,
	onLoadCallback,
	eventListenersEffect,
	children,
}: ModalDialogProps) => {
	const dialog_ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {

		if (dialog_ref.current === null)
			throw new Error('Modal Dialog Ref is null');

		function close_dialog() {
			if (!dialog.is(':ui-dialog'))
				return;
			dialog.dialog('destroy');
			window.removeEventListener('resize', resize);
			if (typeof onCloseCallback === 'function')
				onCloseCallback();
		}

		const dialog = $(dialog_ref.current.children[0]).dialog({
			modal: true,
			width: 300,
			close: close_dialog,
			buttons: [
				{
					text: 'Cancel', click: close_dialog,
				},
			],
			...properties,
		});
		if (typeof onLoadCallback !== 'undefined')
			onLoadCallback(dialog);

		const resize = () => dialog.dialog('option', 'position', 'center');

		window.addEventListener('resize', resize);


		// jQuery modifies DOM, which stops React's event listeners from firing
		// if we need event listeners on elements inside the modal, we need to use old school addEventListener

		if (eventListenersEffect) {
			const event_destroy_callback = eventListenersEffect(dialog[0]);
			return () => {
				if (typeof event_destroy_callback === 'function')
					event_destroy_callback();
				close_dialog();
			};
		}
		else
			return close_dialog;
	}, []);

	return (
		<div ref={dialog_ref}>
			<div>
				{children}
			</div>
		</div>
	);
}, 'ModalDialog'));

//Loading Screen
const handleOnLoad = (dialog: JQuery<HTMLElement>) =>
	$('.progress-bar', dialog).progressbar({value: false});

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