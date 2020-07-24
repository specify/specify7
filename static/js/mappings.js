const mappings = {
	fetch: function () {

		const global = this;

		global.list__data_model = document.getElementById('list__data_model');

		global.button__map = document.getElementById('button__map');
		global.button__delete = document.getElementById('button__delete');

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

				let table_name = table_data['classname'].split('.').pop();
				const friendly_table_name = global.get_friendly_name(table_name);
				table_name = table_name.toLowerCase();

				let fields = {};

				if (table_data['system']) {
					system_tables.push(table_name);
					return true;
				}

				table_data['fields'].forEach(function (field) {

					let field_name = field['column'];
					const friendly_field_name = global.get_friendly_name(field_name)
					field_name = field_name.toLowerCase()

					fields[field_name] = friendly_field_name;

				});

				tables[table_name] = {
					friendly_table_name: friendly_table_name,
					fields: fields,
				};

				data_model_html += '<label>' +
					'	<input type="radio" name="table" class="radio__table" data-level="0" data-table="' + table_name + '">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="mapping">' + friendly_table_name + '</div>' +
					'	</div>' +
					'</label>';

			});

			global.list__data_model.innerHTML = data_model_html;

			global.radios__table = document.getElementsByClassName('radio__table');

			Object.values(global.radios__table).forEach(function (line) {
				line.addEventListener('change', global.table_line_change);
			});


			global.tables = tables;
			global.data_model = data_model;//TODO: remove this

			global.update_headers();

		};
		xhr.send();

	},

	header_line_change: function (event) {

		const global = mappings;

		const radio = event.target;
		const label = radio.nextElementSibling;

		global.button__delete.disabled = label.tagName!=='label' || label.getElementsByClassName('undefined').length===0;

		mappings.selected_header = radio;//.getAttribute('data-header');

	},

	table_line_change: function (event) {

		const global = mappings;
		const radio = event.target;
		const label = radio.parentElement;
		const table_name = radio.getAttribute('data-table');
		const level = parseInt(radio.getAttribute('data-level'))+1;
		const fields = global.list__data_model.getElementsByClassName('field');

		if(fields.length>0)
			Object.values(fields).forEach(function(field){//remove open fields
				global.list__data_model.removeChild(field);
			});

		let fields_html = '';

		for (const [field_name, friendly_field_name] of Object.entries(global.tables[table_name]['fields']))
			fields_html += '<label class="field">' +
				'	<input type="radio" name="field" class="radio__field" data-level="'+level+'" data-field="' + field_name + '">' +
				'	<div tabindex="0" class="line">' +
				'		<div class="mapping" style="padding-left: '+(level*10)+'px">' + friendly_field_name + '</div>' +
				'	</div>' +
				'</label>';

		label.outerHTML += fields_html;

		global.button__map.disabled = level===0;

		mappings.selected_table = radio;

	},

	update_headers: function (headers = []) {

		const global = this;

		if (typeof global.line__headers !== "undefined")//fix memory leaks in old browsers
			Object.values(global.line__headers).forEach(function (line) {
				line.removeEventListener('change', global.header_line_change);
			});


		let headers_html = '';

		headers.forEach(function (header) {
			headers_html += '<label>' +
				'	<input type="radio" name="header" class="radio__header" data-header="' + header + '">' +
				'	<div tabindex="0" class="line">' +
				'		<div class="undefined mapping"></div>' +
				'		<div class="header">' + header + '</div>' +
				'	</div>' +
				'</label>';
		});

		global.list__headers.innerHTML = headers_html;

		global.line__headers = document.getElementsByClassName('radio__header');

		Object.values(global.line__headers).forEach(function (line) {
			line.addEventListener('change', global.header_line_change);
		});

	},


	get_friendly_name: table_name => table_name.replace(/[A-Z]/g, letter => ` ${letter}`).replace('D N A', 'DNA').trim(),


	render_table: function (table_name, table_data) {

	}
};