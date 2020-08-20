"use strict";

require("../../css/workbench/main.css");

const commons = require('./commons.js');
const mappings = require('./mappings.js');
const upload_config = require('./upload_config.js');

const initialContext = require('../initialcontext.js');


initialContext.lock().promise().done(() => {

	//initialization
	const screen__loading = document.getElementById('screen__loading');


	const screen__file_upload = document.getElementById('screen__file_upload');
	const button__create_file = document.getElementById('button__create_file');
	const input__file = document.getElementById('input__file');


	const screen__upload_config = document.getElementById('screen__upload_config');
	const button__upload_config_cancel = document.getElementById('button__upload_config_cancel');
	const button__upload_config_continue = document.getElementById('button__upload_config_continue');
	upload_config.constructor();

	const screen__mapping = document.getElementById('screen__mapping');
	const button__mappings__continue = document.getElementById('button__mappings__continue');
	const button__mappings_cancel = document.getElementById('button__mappings_cancel');
	mappings.constructor();


	commons.set_screen('main',screen__loading);
	commons.change_screen('main',screen__file_upload);



	//screen__file_upload
	button__create_file.addEventListener('click', function () {
		commons.change_screen('main',screen__mapping);
	});


	//screen__upload_config
	function file_change_handler() {

		const reader = new FileReader();
		const file = input__file.files[0];

		if (typeof file === "undefined")
			return true;

		reader.readAsText(file);
		reader.onerror = function (event) {
			if (event.target.error.name === "NotReadableError")
				alert("There were problems reading that file");
		};
		reader.onload = function (event) {
			const csv = event.target.result;

			commons.change_screen('main',screen__upload_config);
			upload_config.update_table(csv);

		};

	}

	input__file.addEventListener('change', file_change_handler);
	file_change_handler();


	button__upload_config_cancel.addEventListener('click', function () {
		commons.change_screen('main',screen__file_upload);
		input__file.value = [];
	});

	button__upload_config_continue.addEventListener('click', function () {
		commons.change_screen('main',screen__mapping);
		mappings.set_headers(upload_config.headers);
	});

	button__mappings_cancel.addEventListener('click', function () {
		commons.change_screen('main',screen__file_upload);
		mappings.reset_table();
		input__file.value = [];
	});

	button__mappings__continue.addEventListener('click', function () {
		//commons.change_screen('main',screen__mapping);
		//mappings.set_headers(upload_config.headers);
	});

});
