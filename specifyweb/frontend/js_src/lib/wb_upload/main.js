"use strict";

require("../../css/workbench/main.css");

const commons = require('./commons.js');
const choose_data_set = require('./choose_data_set.js');
const upload_config = require('./upload_config.js');
const mappings = require('./mappings.js');
const csrf_token = require('../csrftoken.js');
const initialContext = require('../initialcontext.js');

const api_endpoint = '../../api/workbench/upload_new/';


module.exports = () => {


	//initialization
	const screen__loading = document.getElementById('screen__loading');

	const screen__choose_data_set = document.getElementById('screen__choose_data_set');
	const button__create_file = document.getElementById('button__create_file');
	choose_data_set.constructor(() => {
		commons.change_screen('main',screen__choose_data_set);
	}, (headers,upload_plan) => {
		commons.change_screen('main',screen__mapping);
		mappings.set_headers(headers, upload_plan);
	}, (csv)=>{
		commons.change_screen('main',screen__upload_config);
		upload_config.update_table(csv);
	});


	const screen__upload_config = document.getElementById('screen__upload_config');
	const button__upload_config_cancel = document.getElementById('button__upload_config_cancel');
	const button__upload_config_continue = document.getElementById('button__upload_config_continue');
	upload_config.constructor();

	const screen__mapping = document.getElementById('screen__mapping');
	const button__mappings__continue = document.getElementById('button__mappings__continue');
	const button__mappings_cancel = document.getElementById('button__mappings_cancel');
	mappings.constructor();


	commons.set_screen('main',screen__loading);


	//screen__file_upload
	button__create_file.addEventListener('click', function () {
		commons.change_screen('main',screen__mapping);
		choose_data_set.flush_selected_file();
	});


	//screen__upload_config
	button__upload_config_cancel.addEventListener('click', function () {
		commons.change_screen('main',screen__choose_data_set);
		choose_data_set.flush_selected_file();
	});

	button__upload_config_continue.addEventListener('click', function () {
		commons.change_screen('main',screen__mapping);
		mappings.set_headers(upload_config.headers,'',upload_config.checkbox__first_line_header.checked);
	});

	//go back to choosing data set
	button__mappings_cancel.addEventListener('click', function () {
		if(choose_data_set.is_file_selected())
			commons.change_screen('main',button__upload_config_cancel);
		else
			commons.change_screen('main',screen__choose_data_set);

		mappings.reset_table();
	});

	//send request to backend
	button__mappings__continue.addEventListener('click', function () {

		const post_payload = {
			'csrfmiddlewaretoken': csrf_token,
			'upload_plan': mappings.get_upload_plan(),
			'commit': false,
			'csv_data': upload_config.csv,
		}

		const urlEncodedDataPairs = [];
		for(let name in post_payload )
			urlEncodedDataPairs.push( encodeURIComponent( name ) + '=' + encodeURIComponent( post_payload[name] ) );

		const urlEncodedData = urlEncodedDataPairs.join( '&' ).replace( /%20/g, '+' );

		const xhr = new XMLHttpRequest();
		xhr.open("POST", api_endpoint, true);

		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		xhr.onreadystatechange = function() {
			if (this.readyState === XMLHttpRequest.DONE){
				alert('Response code: ' + this.status + '. Scroll down to see full response');
				const iframe = document.createElement('iframe');
				iframe.setAttribute('srcdoc', this.response);
				iframe.style.height = '50vh';
				iframe.style.width = '100vw';
				document.body.appendChild(iframe);
			}
		}
		xhr.send(urlEncodedData);

	});

	window.addEventListener('beforeunload', function (e) {//stops page from reloading if there is mapping in progress
		if (typeof mappings.list__tables_scroll_postion !== "undefined") {
			e.preventDefault();
			e.returnValue = 'Are you sure you want to discard creating mapping for this dataset?';//this message won't be displayed in most browsers
		}
		else
			delete e['returnValue'];
	});
};
