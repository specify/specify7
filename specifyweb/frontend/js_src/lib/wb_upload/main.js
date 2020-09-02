"use strict";

require("../../css/workbench/main.css");

const mappings = require('./mappings.js');


module.exports = () => {


	//initialization
	mappings.constructor();


	//TODO: add ability to go back to choosing data set
	//commons.change_screen('main',button__upload_config_cancel);
	//mappings.reset_table();

	//TODO: redo sending requests to backend
	//return this to header: const api_endpoint = '../../api/workbench/upload_new/';
	/*button__mappings__continue.addEventListener('click', function () {

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

	});*/

	window.addEventListener('beforeunload', function (e) {//stops page from reloading if there is mapping in progress
		if (typeof mappings.list__tables_scroll_postion !== "undefined") {
			e.preventDefault();
			e.returnValue = 'Are you sure you want to discard creating mapping for this dataset?';//this message won't be displayed in most browsers
		}
		else
			delete e['returnValue'];
	});

};
