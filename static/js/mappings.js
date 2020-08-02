const mappings = {

	constructor: function () {

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


		global.fetch_data_model();
		global.set_headers();

		commons.set_screen('mappings', global.list__tables);

		global.button__change_table.addEventListener('click', global.reset_table);

		global.button__map.addEventListener('click', global.map_field);
		global.button__delete.addEventListener('click', global.unmap_field);

		global.mappings = {};
		global.unique_id_counter = 0;

	},

	fetch_data_model: function () {

		const global = this;

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
				let relationship_type = relationship['type'];
				let foreign_name = relationship['otherSideName'];
				const friendly_relationship_name = global.get_friendly_name(relationship_name);
				relationship_name = relationship_name.toLowerCase();

				const table_name = relationship['relatedModelName'].toLowerCase();

				relationships[relationship_name] = {
					friendly_relationship_name: friendly_relationship_name,
					table_name: table_name,
					type: relationship_type,
					foreign_name: foreign_name,
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
				if (typeof tables[relationship_data['table_name']] === "undefined")
					delete tables[table_name]['relationships'][relationship_name];


		global.list__tables.innerHTML = data_model_html;

		const table_radios = document.getElementsByClassName('radio__table');

		Object.values(table_radios).forEach(function (line) {
			line.addEventListener('change', global.select_table);
		});


		global.new_column_id = 1;
		global.tables = tables;
		global.data_model = data_model;//TODO: remove this

	},

	map_field: function () {

		const global = mappings;

		const label = global.selected_header.parentElement;
		const heading_mapping = label.getElementsByClassName('mapping')[0];

		if (global.selected_field !== '') {
			if (typeof heading_mapping === "undefined") {

				const column_name = 'New Column ' + global.new_column_id;

				global.list__headers.innerHTML += '<label>' +
					'	<input type="radio" name="header" class="radio__header" data-header="' + column_name + '">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="mapping">' + global.selected_field + '</div>' +
					'		<div class="header">' + column_name + '</div>' +
					'	</div>' +
					'</label>';

				const labels = global.list__headers.getElementsByTagName('label');
				const new_header_label = labels[labels.length - 1];
				const new_header_radio = new_header_label.getElementsByTagName('input')[0];

				new_header_radio.checked = true;


				global.new_column_id++;
			} else {
				heading_mapping.classList.remove('undefined');

				if(global.selected_field.tagName === 'INPUT')
					heading_mapping.innerText = global.selected_field.parentElement.getElementsByClassName('row_name')[0].innerText;
				else
					heading_mapping.innerText = global.selected_field.options[global.selected_field.selectedIndex].text;

			}
		}

		global.update_buttons();

	},

	unmap_field: function () {

		const global = mappings;

		const label = global.selected_header.parentElement;
		const heading_mapping = label.getElementsByClassName('mapping')[0];

		heading_mapping.classList.add('undefined');
		heading_mapping.innerText = '';

		global.update_buttons();

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

		let rows_html = '';

		global.get_table_rows(table_name).forEach(function (row_data) {

			let row_name;
			let class_append = '';
			let row_key;

			if(typeof row_data === "string"){//field
				row_key = row_data;
				row_name = table_data['fields'][row_key];
			}
			else {//relationship
				row_key = row_data[0];
				row_name = '> ' + table_data['relationships'][row_key]['friendly_relationship_name'];
				class_append = 'relationship';
			}

			rows_html += '<label class="table_fields">' +
				'	<input type="radio" name="field" class="radio__field" data-field="' + row_key + '">' +
				'	<div tabindex="0" class="line '+class_append+'">' +
				'		<div class="row_name">' + row_name + '</div>' +
				'	</div>' +
				'</label>';

		});

		global.base_table_name = table_name;
		global.list__data_model.innerHTML = rows_html;

		global.list__data_model.addEventListener('change',function(event){
			if(event.target && event.target.classList.contains('radio__field'))
				global.change_selected_field(event);
			else if(event.target && event.target.tagName==='SELECT')
				global.change_option_field(event);
		});

		global.list__data_model.addEventListener('focus',function(event){
			if(event.target && event.target.tagName==='SELECT')
				global.change_option_field(event);
		});

	},

	get_table_rows: function (table_name, previous_table=undefined, foreign_name=undefined) {

		const global = mappings;

		const rows = Object.keys(global.tables[table_name]['fields']);

		Object.keys(global.tables[table_name]['relationships']).forEach(function(relationship_key){
			const relationship = global.tables[table_name]['relationships'][relationship_key];
			const enabled = (
				relationship['table_name']!==previous_table ||
				relationship_key!==foreign_name
			);
			rows.push([relationship_key,enabled]);
		});

		return rows.sort();

	},

	change_selected_field: function (event) {

		const global = mappings;

		const radio = event.target;
		const label = radio.parentElement;
		const field_key = radio.getAttribute('data-field');

		global.selected_field = radio;

		const opened_lists = global.list__data_model.getElementsByClassName('table_relationship');
		Object.values(opened_lists).forEach(function(list){
			global.list__data_model.removeChild(list);
		});

		if (global.is_selected_field_in_relationship()) {

			const select_line = document.createElement('div');
			global.list__data_model.insertBefore(select_line, label.nextSibling);

			const relationship = global.tables[global.base_table_name]['relationships'][field_key];
			const target_table_name = relationship['table_name'];
			const foreign_name = relationship['foreign_name'];
			select_line.outerHTML = global.get_fields_list_for_table(target_table_name,global.base_table_name,foreign_name);

			label.nextElementSibling.getElementsByTagName('input')[0].checked = true;

		}

		global.update_buttons();

	},

	change_option_field: function (event) {

		const global = mappings;
		const select = event.target;
		const label = select.parentElement;
		const line = label.parentElement;
		const radio = line.getElementsByTagName('input')[0];
		radio.checked = true;

		global.selected_field = select;

		let element = line.nextElementSibling;//remove all <select> elements following this one
		while(true) {

			if(element === null || !element.classList.contains('table_relationship'))
				break;

			let next_element = element.nextElementSibling;

			global.list__data_model.removeChild(element);

			element = next_element;
		}

		if(global.is_selected_field_in_relationship()){

			const select_line = document.createElement('div');
			global.list__data_model.insertBefore(select_line, line.nextSibling);

			const current_table_name = select.getAttribute('data-table');
			const value = select.value;
			const relationship = global.tables[current_table_name]['relationships'][value];
			const target_table_name = relationship['table_name'];
			const foreign_name = relationship['foreign_name'];
			select_line.outerHTML = global.get_fields_list_for_table(target_table_name,current_table_name,foreign_name);

			line.nextElementSibling.getElementsByTagName('input')[0].checked = true;

		}

		global.update_buttons();

	},

	update_buttons: function () {

		const global = mappings;

		global.button__map.disabled = typeof global.selected_header === "undefined" || global.is_selected_field_in_relationship();

		if (typeof global.selected_header === "undefined")
			global.button__delete.disabled = true;
		else {
			const header_label = global.selected_header.parentElement;
			global.button__delete.disabled = header_label.tagName !== 'LABEL' || header_label.getElementsByClassName('undefined').length !== 0;
		}

	},

	is_selected_field_in_relationship: function () {

		const global = mappings;

		if (global.selected_field.tagName === 'INPUT') {

			const label = global.selected_field.parentElement;
			const name = label.getElementsByClassName('row_name')[0];

			return name.innerText.substr(0, 2) === '> ';

		}

		return global.selected_field.options[global.selected_field.selectedIndex].text.substr(0, 2) === '> ';

	},

	get_fields_list_for_table: function (table_name, previous_table, foreign_name) {//TODO: use relationship types

		const global = this;

// for="relationship_'+global.unique_id_counter+'"
		let fields_html = '<div class="table_relationship">' +// id="relationship_'+global.unique_id_counter+'"
			'<input type="radio" name="field" class="radio__field" data-field="relationship">' +
			'<label class="line">'+
			'	<select name="relationship" class="select__field" data-table="'+table_name+'">' +
			'		<option value="0"></option>';

		global.unique_id_counter++;//TODO: remove all of me && remove comments

		global.get_table_rows(table_name, previous_table, foreign_name).forEach(function (row_data) {

			let row_name;
			let row_key;
			let attribute_append = '';

			if (typeof row_data === "string") {//field
				row_key = row_data;
				row_name = global.tables[table_name]['fields'][row_key];
			}
			else {//relationship
				row_key = row_data[0];
				row_name = '> ' + global.tables[table_name]['relationships'][row_key]['friendly_relationship_name'];
				if(!row_data[1])
					attribute_append += 'disabled';
			}

			fields_html += '<option value="' + row_key + '" '+attribute_append+'>' + row_name + '</option>';

		});


		fields_html += '</select>' +
			'</label>' +
			'</div>';

		return fields_html;

	},

	change_selected_header: function (event) {

		const global = mappings;
		global.selected_header = event.target;
		global.update_buttons();

	},

	set_headers: function (headers = []) {

		const global = this;

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

		global.list__headers.addEventListener('change',function(event){
			if(event.target && event.target.classList.contains('radio__header'))
				global.change_selected_header(event);
		});

	},

	get_friendly_name: function (table_name) {
		table_name = table_name.replace(/[A-Z]/g, letter => ` ${letter}`);
		table_name = table_name.replace('D N A', 'DNA');
		table_name = table_name.replace('G U I D', 'GUID');
		table_name = table_name.trim();
		table_name = table_name.charAt(0).toUpperCase() + table_name.slice(1);
		return table_name;
	}

};