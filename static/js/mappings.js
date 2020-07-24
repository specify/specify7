const mappings = {
	fetch: function () {

		const global = this;

		global.column__data_model = document.getElementById('column__data_model');

		global.list__headers = document.getElementById('list__headers');
		global.button__new_field = document.getElementById('button__new_field');

		const xhr = new XMLHttpRequest();
		xhr.open("GET", data_model_location);
		xhr.responseType = "json";
		xhr.onload = function () {

			const data_model = xhr.response;
			const system_tables = [];
			const tables = [];
			let data_model_html = '';

			data_model.forEach(function (table_data) {

				let table_name = table_data['classname'].split('.').pop()
				const friendly_table_name = global.get_friendly_table_name(table_name)
				table_name = table_name.toLowerCase();

				let fields = {};

				if (table_data['system']) {
					system_tables.push(table_name)
					return true;
				}

				let table = {
					friendly_table_name: friendly_table_name,
					fields: fields,
				};

				tables[table_name] = table;

				data_model_html += table_name;

			});

			global.data_model = data_model_html;
			global.tables = tables;
			global.data_model = data_model;//TODO: remove this
		}
		xhr.send();


	},


	update_headers: function (headers = []) {

		const global = this;

		let headers_html = '';

		headers.forEach(function (header) {
			headers_html += '<label>' +
				'<input type="radio" name="header">' +
				'<div tabindex="0" class="line">' +
					'<div class="undefined mapping"></div>' +
					'<div class="header">' + header + '</div>' +
				'</div>' +
			'</label>';
		});

		global.list__headers.innerHTML = headers_html;

		global.line__headers = document.getElementsByClassName('line');

	},


	get_friendly_table_name: table_name => table_name.replace(/[A-Z]/g, letter => ` ${letter}`).trim(),


	render_table: function (table_name, table_data) {

	}
};