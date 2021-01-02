'use strict';

import React from 'react';
import $ from 'jquery';

export const ModalDialog = (props :ModalDialogProps) => {
	const dialog_ref = React.useRef(null);

	React.useEffect(() => {
		const dialog = $(dialog_ref).dialog({
			modal: true,
			width: 'auto',
			close: () => dialog.remove(),
			buttons: [
				{
					text: 'Cancel', click: function () {
						$(this).remove();
					},
				},
			],
			...props.properties,
		});
		if (typeof props.onLoadCallback !== 'undefined')
			props.onLoadCallback(dialog);

		return () => {
			dialog.remove();
		};
	});

	return (
		<div ref={dialog_ref}>
			{props.children}
		</div>
	);
};

//Loading Screen
const LoadingScreen_onLoadCallback = (dialog :JQuery<HTMLElement>) =>
	$('.progress-bar', dialog).progressbar({value: false});

export const LoadingScreen = () =>
	<ModalDialog
		onLoadCallback={LoadingScreen_onLoadCallback}
		properties={{
			title: 'Loading',
			buttons: [],
		}}
	>
		<div className="progress-bar"/>
	</ModalDialog>;