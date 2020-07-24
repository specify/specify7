window.addEventListener('load', function () {

	//initialization
	const screen__loading = document.getElementById('screen__loading');


	const screen__file_upload = document.getElementById('screen__file_upload');
	const button__create_file = document.getElementById('button__create_file');
	const input__file = document.getElementById('input__file');


	const screen__upload_config = document.getElementById('screen__upload_config');
	const button__file_preview_cancel = document.getElementById('button__file_preview_cancel');
	const button__file_preview_continue = document.getElementById('button__file_preview_continue');
	file_preview.constructor();

	const screen__mapping = document.getElementById('screen__mapping');
	mappings.fetch();


	set_screen(screen__loading);
	change_screen(screen__file_upload);


	//screen__file_upload
	button__create_file.addEventListener('click', function () {
		change_screen(screen__mapping);
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

			change_screen(screen__upload_config);
			file_preview.update_table(csv);

		};

	}

	input__file.addEventListener('change', file_change_handler);
	file_change_handler();

	button__file_preview_cancel.addEventListener('click', function () {
		change_screen(screen__file_upload);
		input__file.value = [];
	});

	button__file_preview_continue.addEventListener('click', function () {
		change_screen(screen__mapping);
		mappings.update_headers(file_preview.headers);
	});

});