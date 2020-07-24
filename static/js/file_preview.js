const file_preview = {

	constructor: function () {

		const global = this;

		//initialization
		const radio__delimiter = document.getElementsByClassName('radio__delimiter');
		const input__custom_delimiter = document.getElementById('input__custom_delimiter');

		global.radio__delimiter_comma = document.getElementById('radio__delimiter_comma');
		global.radio__delimiter_tab = document.getElementById('radio__delimiter_tab');
		global.radio__delimiter_other = document.getElementById('radio__delimiter_other');
		global.checkbox__first_line_header = document.getElementById('checkbox__first_line_header');
		global.table_header__file_preview = document.getElementById('table_header__file_preview');
		global.table_body__file_preview = document.getElementById('table_body__file_preview');
		global.custom_papa_parse_config = {};


		//header checkbox change handler
		this.checkbox__first_line_header.addEventListener('change', (event) => {
			global.header = event.target['checked'];
			global.update_table(undefined,false);
		});


		//set listener for radios
		Array.prototype.forEach.call(radio__delimiter, function (radio) {
			radio.addEventListener('change', radio_change_handler);
		});


		//radios change handler
		function radio_change_handler(checkbox = undefined) {

			if (typeof checkbox === "undefined" || typeof checkbox.currentTarget !== "undefined")
				checkbox = this;

			if (checkbox.value === '\\t')
				global.custom_papa_parse_config.delimiter = "\t";
			else if (checkbox.value === 'other') {
				if(input__custom_delimiter.value==='')
					return true;
				global.custom_papa_parse_config.delimiter = input__custom_delimiter.value;
			}
			else
				global.custom_papa_parse_config.delimiter = checkbox.value;

			global.update_table(undefined,false);

		}


		//update selected radio button on custom delimiter button press
		input__custom_delimiter.addEventListener('click', function () {
			if (!global.radio__delimiter_other.checked) {
				global.radio__delimiter_other.checked = true;
				radio_change_handler(global.radio__delimiter_other);
			}
		});

		//custom delimiter input change handler
		input__custom_delimiter.addEventListener('change', function () {

			if(input__custom_delimiter.value==='')
				return true;

			global.custom_papa_parse_config.delimiter = input__custom_delimiter.value;
			global.update_table(undefined,false);
		});
	},

	//update csv file preview
	update_table: function (new_csv = undefined,detect_config=true) {

		const global = this;


		if (typeof new_csv !== "undefined")
			global.csv = new_csv;

		const target_config = Object.assign(papa_parse_config, global.custom_papa_parse_config);
		const parsed_csv = Papa.parse(global.csv, target_config);

		if (parsed_csv.meta.delimiter === ",")
			global.radio__delimiter_comma.checked = true;
		else if (parsed_csv.meta.delimiter === "\t")
			global.radio__delimiter_tab.checked = true;

		console.log(parsed_csv);

		if (parsed_csv.data.length === 0) {
			global.table_header__file_preview.innerHTML = '';
			global.table_body__file_preview.innerHTML = '';
			return false;
		}


		//showing header
		let header_html = '<tr>';
		let columns_count = 0;
		global.headers = [];

		if (global.header) {
			global.headers = parsed_csv.data.shift();
			columns_count = parsed_csv.data[0].length;
		} else {

			if (detect_config && global.count_non_empty_cells(parsed_csv.data[0]) > global.count_non_empty_cells(parsed_csv.data[1])) {
				//rerun with the first line being a header
				global.checkbox__first_line_header.checked = true;
				global.header = true;
				return global.update_table();
			}

			Array.prototype.forEach.call(parsed_csv.data[0], function () {
				global.headers.push('Column ' + columns_count);
				columns_count++;
			});

		}

		global.headers.forEach(function (header) {
			header_html += '<th>' + header + '</th>';
		});


		header_html += '</tr>';
		global.table_header__file_preview.innerHTML = header_html;


		//showing body
		let body_html = '';

		parsed_csv.data.forEach(function (row) {

			body_html += '<tr>';

			Object.values(row).forEach(function (column) {
				body_html += '<td>' + column + '</td>';
			});

			if (row.length < columns_count)
				body_html += '<td></td>'.repeat(columns_count - row.length);

			body_html += '</tr>';

		});


		global.table_body__file_preview.innerHTML = body_html;


	},

	count_non_empty_cells: function (array) {
		let count = 0;

		array.forEach(function (column) {
			if (column !== '')
				count++;
		});

		return count;
	}

};