const mappings = {//TODO: do not output circular dependency
	fetch_data_model: function () {

		const global = this;

		/* column data model */
		global.title__table_name = document.getElementById('title__table_name');
		global.button__change_table = document.getElementById('button__change_table');
		global.list__tables = document.getElementById('list__tables');
		global.list__data_model = document.getElementById('list__data_model');

		/* column controls */
		global.button__map = document.getElementById('button__map');
		global.button__delete = document.getElementById('button__delete');

		/* column headers */
		global.list__headers = document.getElementById('list__headers');
		global.button__new_field = document.getElementById('button__new_field');

		const xhr = new XMLHttpRequest();
		xhr.open("GET", data_model_location);
		xhr.responseType = "json";
		xhr.onload = function () {
			global.process_data_model(xhr.response);
		};
		xhr.send();

	},

	process_data_model: function (data_model) {

		const global = this;
		const tables = [];
		let data_model_html = '';

		data_model.forEach(function (table_data) {

			let table_name = table_data['classname'].split('.').pop();
			const friendly_table_name = global.get_friendly_name(table_name);
			table_name = table_name.toLowerCase();

			let fields = {};
			let relationships = {};

			if (table_data['system'])//skip system tables
				return true;

			table_data['fields'].forEach(function (field) {

				let field_name = field['column'];
				const friendly_field_name = global.get_friendly_name(field_name);
				field_name = field_name.toLowerCase();

				fields[field_name] = friendly_field_name;

			});

			table_data['relationships'].forEach(function (relationship) {

				let relationship_name = relationship['name'];
				const friendly_relationship_name = global.get_friendly_name(relationship_name);
				relationship_name = relationship_name.toLowerCase();

				const table_name = relationship['relatedModelName'].toLowerCase();

				relationships[relationship_name] = {
					friendly_relationship_name: friendly_relationship_name,
					table_name: table_name,
				};

			});

			tables[table_name] = {
				friendly_table_name: friendly_table_name,
				fields: fields,
				relationships: relationships,
			};

			data_model_html += '<label>' +
				'	<input type="radio" name="table" class="radio__table" data-table="' + table_name + '">' +
				'	<div tabindex="0" class="line">' +
				'		<div class="mapping">' + friendly_table_name + '</div>' +
				'	</div>' +
				'</label>';

			commons.set_screen('mappings', global.list__tables);

		});

		for (const [table_name, table_data] of Object.entries(tables))//remove relationships to system tables
			for (const [relationship_name, relationship_data] of Object.entries(table_data['relationships']))
				if(typeof tables[relationship_data['table_name']] === "undefined")
					delete tables[table_name]['relationships'][relationship_name]


		global.list__tables.innerHTML = data_model_html;

		global.radios__table = document.getElementsByClassName('radio__table');

		Object.values(global.radios__table).forEach(function (line) {
			line.addEventListener('change', global.select_table);
		});


		global.tables = tables;
		global.data_model = data_model;//TODO: remove this

		global.update_headers();
		commons.set_screen('mappings', global.list__tables);

		button__change_table.addEventListener('click', global.reset_table);

	},

	reset_table: function () {

		const global = mappings;

		global.selected_table.checked = false;
		global.selected_table = undefined;

		const header_mappings = global.list__headers.getElementsByClassName('mapping');

		Object.values(header_mappings).forEach(function (mapping) {
			mapping.outerHTML = '<div class="undefined mapping"></div>';
		});

		global.title__table_name.classList.add('undefined');
		global.title__table_name.innerText = '';

		commons.change_screen('mappings', global.list__tables);

		global.button__change_table.style.display = 'none';

	},

	select_table: function (event) {

		const global = mappings;
		const radio = event.target;
		const table_name = radio.getAttribute('data-table');
		const table_data = global.tables[table_name];

		commons.change_screen('mappings', global.list__data_model);

		global.button__change_table.style.display = '';

		global.title__table_name.classList.remove('undefined');
		global.title__table_name.innerText = global.tables[table_name]['friendly_table_name'];

		global.selected_table = radio;

		if(typeof global.table_fields !== "undefined")
			Object.values(global.table_fields).forEach(function(field){
				field.removeEventListener('focus',global.unfold_tree);
			});


		let rows_html = '';
		const unordered_rows_lists = Object.keys(global.tables[table_name]['fields']).concat(Object.keys(global.tables[table_name]['relationships']));
		const ordered_rows_lists = unordered_rows_lists.sort();

		ordered_rows_lists.forEach(function(row_key){

			if(typeof table_data['fields'][row_key] !== "undefined")
				rows_html += '<label class="field table_fields">' +
					'	<input type="radio" name="field" class="radio__field" data-level="0" data-field="' + row_key + '">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="table_name">' + table_data['fields'][row_key] + '</div>' +
					'	</div>' +
					'</label>';
			else
				rows_html += '<label class="relationship">' +
					'	<input type="radio" name="field" class="radio__field" data-level="0" data-field="' + row_key + '">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="table_name">' + table_data['relationships'][row_key]['friendly_relationship_name'] + '</div>' +
					'		<div class="relationship">' + table_data['relationships'][row_key]['table_name'] + '</div>' +
					'	</div>' +
					'</label>';

		});

		global.list__data_model.innerHTML = rows_html;

		global.table_fields = document.getElementsByClassName('table_fields');
		Object.values(global.table_fields).forEach(function(field){
			field.addEventListener('focus',global.unfold_tree);
		});

	},

	unfold_tree: function (event) {

		const global = mappings;
		const radio = event.target;
		const label = radio.parentElement;
		const table_name = radio.getAttribute('data-table');
		const level = parseInt(radio.getAttribute('data-level')) + 1;
		const fields = global.list__data_model.getElementsByClassName('field');

		if (fields.length > 0)
			Object.values(fields).forEach(function (field) {//remove open fields
				global.list__data_model.removeChild(field);
			});

		let fields_html = '';

		for (const [field_name, friendly_field_name] of Object.entries(global.tables[table_name]['fields']))
			fields_html += '<label class="field">' +
				'	<input type="radio" name="field" class="radio__field" data-level="' + level + '" data-field="' + field_name + '">' +
				'	<div tabindex="0" class="line">' +
				'		<div class="table_name" style="padding-left: ' + (level * 10) + 'px">' + friendly_field_name + '</div>' +
				'	</div>' +
				'</label>';

		label.outerHTML += fields_html;

		global.button__map.disabled = level === 0;

		mappings.selected_radio = radio;

	},

	change_selected_header: function (event) {

		const global = mappings;

		const radio = event.target;
		const label = radio.nextElementSibling;

		global.button__delete.disabled = label.tagName !== 'label' || label.getElementsByClassName('undefined').length === 0;

		global.selected_header = radio;//.getAttribute('data-header');

	},

	update_headers: function (headers = []) {

		const global = this;

		if (typeof global.line__headers !== "undefined")//fix memory leaks in old browsers
			Object.values(global.line__headers).forEach(function (line) {
				line.removeEventListener('change', global.change_selected_header);
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
			line.addEventListener('change', global.change_selected_header);
		});

	},

	get_friendly_name: function(table_name) {
		table_name = table_name.replace(/[A-Z]/g, letter => ` ${letter}`);
		table_name = table_name.replace('D N A', 'DNA');
		table_name = table_name.trim();
		table_name = table_name.charAt(0).toUpperCase() + table_name.slice(1)
		return table_name
	}

};