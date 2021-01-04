'use strict';

import React from 'react';
import $ from 'jquery';


export const ModalDialog = React.memo((props :ModalDialogProps) => {
	const dialog_ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {

		if(dialog_ref.current===null)
			throw new Error('Modal Dialog Ref is null');

		function close_dialog(){
			if(!dialog.is(':ui-dialog'))
				return;
			dialog.dialog('destroy');
			window.removeEventListener('resize',resize);
			if(typeof props.onCloseCallback === "function")
				props.onCloseCallback();
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
			...props.properties,
		});
		if (typeof props.onLoadCallback !== 'undefined')
			props.onLoadCallback(dialog);

		const resize = ()=>dialog.dialog("option", "position", "center");

		window.addEventListener('resize',resize);

		return close_dialog;
	},[]);

	return (
		<div ref={dialog_ref}>
			<div>
				{props.children}
			</div>
		</div>
	);
});

//Loading Screen
const handleOnLoad = (dialog :JQuery<HTMLElement>) =>
	$('.progress-bar', dialog).progressbar({value: false});

export const LoadingScreen = () =>
	<ModalDialog
		onLoadCallback={handleOnLoad}
		properties={{
			title: 'Loading',
			buttons: [],
			close: undefined
		}}
	>
		<div className="progress-bar"/>
	</ModalDialog>;