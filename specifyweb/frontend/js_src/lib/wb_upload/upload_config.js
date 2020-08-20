"use strict";

const papa_parse_config = {
	preview: 5,
	skipEmptyLines: true
};

const Papa = require('papaparse');


const upload_config = {

	constructor: () => {

		//initialization
		const radio__delimiter = document.getElementsByClassName('radio__delimiter');
		const input__custom_delimiter = document.getElementById('input__custom_delimiter');

		upload_config.radio__delimiter_comma = document.getElementById('radio__delimiter_comma');
		upload_config.radio__delimiter_tab = document.getElementById('radio__delimiter_tab');
		upload_config.radio__delimiter_other = document.getElementById('radio__delimiter_other');
		upload_config.checkbox__first_line_header = document.getElementById('checkbox__first_line_header');
		upload_config.table_header__upload_config = document.getElementById('table_header__upload_config');
		upload_config.table_body__upload_config = document.getElementById('table_body__upload_config');
		upload_config.custom_papa_parse_config = {};


		//header checkbox change handler
		upload_config.checkbox__first_line_header.addEventListener('change', (event) => {
			upload_config.header = event.target['checked'];
			upload_config.update_table(undefined,false);
		});


		//set listener for radios
		Array.prototype.forEach.call(radio__delimiter, (radio) => {
			radio.addEventListener('change', radio_change_handler);
		});


		//radios change handler
		function radio_change_handler(checkbox = undefined) {

			if (typeof checkbox === "undefined" || typeof checkbox.currentTarget !== "undefined")
				checkbox = this;

			if (checkbox.value === '\\t')
				upload_config.custom_papa_parse_config.delimiter = "\t";
			else if (checkbox.value === 'other') {
				if(input__custom_delimiter.value==='')
					return true;
				upload_config.custom_papa_parse_config.delimiter = input__custom_delimiter.value;
			}
			else
				upload_config.custom_papa_parse_config.delimiter = checkbox.value;

			upload_config.update_table(undefined,false);

		}


		//update selected radio button on custom delimiter button press
		input__custom_delimiter.addEventListener('click', ()=> {
			if (!upload_config.radio__delimiter_other.checked) {
				upload_config.radio__delimiter_other.checked = true;
				radio_change_handler(upload_config.radio__delimiter_other);
			}
		});

		//custom delimiter input change handler
		input__custom_delimiter.addEventListener('change', ()=> {

			if(input__custom_delimiter.value==='')
				return true;

			upload_config.custom_papa_parse_config.delimiter = input__custom_delimiter.value;
			upload_config.update_table(undefined,false);
		});
	},

	//update csv file preview
	update_table: (new_csv = undefined,detect_config=true) => {

		if (typeof new_csv !== "undefined")
			upload_config.csv = new_csv;

		const target_config = Object.assign(papa_parse_config, upload_config.custom_papa_parse_config);
		const parsed_csv = Papa.parse(upload_config.csv, target_config);

		if (parsed_csv['meta'].delimiter === ",")
			upload_config.radio__delimiter_comma.checked = true;
		else if (parsed_csv['meta'].delimiter === "\t")
			upload_config.radio__delimiter_tab.checked = true;

		// console.log(parsed_csv);

		if (parsed_csv.data.length === 0) {
			upload_config.table_header__upload_config.innerHTML = '';
			upload_config.table_body__upload_config.innerHTML = '';
			return false;
		}


		//showing header
		let header_html = '<tr>';
		let columns_count = 0;
		upload_config.headers = [];

		if (upload_config.header) {
			upload_config.headers = parsed_csv.data.shift();
			columns_count = parsed_csv.data[0].length;
		} else {

			if (detect_config && upload_config.count_non_empty_cells(parsed_csv.data[0]) > upload_config.count_non_empty_cells(parsed_csv.data[1])) {
				//rerun with the first line being a header
				upload_config.checkbox__first_line_header.checked = true;
				upload_config.header = true;
				return upload_config.update_table();
			}

			Array.prototype.forEach.call(parsed_csv.data[0],  () => {
				upload_config.headers.push('Column ' + columns_count);
				columns_count++;
			});

		}

		upload_config.headers.forEach((header) =>{
			header_html += '<th>' + header + '</th>';
		});


		header_html += '</tr>';
		upload_config.table_header__upload_config.innerHTML = header_html;


		//showing body
		let body_html = '';

		parsed_csv.data.forEach( (row) =>{

			body_html += '<tr>';

			Object.values(row).forEach( (column) =>{
				body_html += '<td>' + column + '</td>';
			});

			if (row.length < columns_count)
				body_html += '<td></td>'.repeat(columns_count - row.length);

			body_html += '</tr>';

		});


		upload_config.table_body__upload_config.innerHTML = body_html;


	},

	count_non_empty_cells:  (array) =>{
		let count = 0;

		array.forEach( (column) =>{
			if (column !== '')
				count++;
		});

		return count;
	}

};

module.exports = upload_config;