const mappings = {

	//configurators
	constructor: function () {


		// column data model
		mappings.title__table_name = document.getElementById('title__table_name');
		mappings.button__change_table = document.getElementById('button__change_table');
		mappings.list__tables = document.getElementById('list__tables');
		mappings.list__data_model = document.getElementById('list__data_model');

		// column controls
		mappings.button__map = document.getElementById('button__map');
		mappings.button__delete = document.getElementById('button__delete');

		// column headers
		mappings.list__headers = document.getElementById('list__headers');
		mappings.button__new_field = document.getElementById('button__new_field');


		mappings.fetch_data_model();
		mappings.set_headers();

		commons.set_screen('mappings', mappings.list__tables);

		mappings.button__change_table.addEventListener('click', mappings.reset_table);

		mappings.button__map.addEventListener('click', mappings.map_field);
		mappings.button__delete.addEventListener('click', mappings.unmap_field);

		mappings.lines = mappings.list__data_model.getElementsByTagName('input');
		mappings.headers = mappings.list__headers.getElementsByTagName('input');

		mappings.reference_indicator = '> ';
		mappings.level_separator = '_';
		mappings.friendly_level_separator = ' > ';
		mappings.reference_symbol = '#';

	},

	fetch_data_model: function () {

		const xhr = new XMLHttpRequest();
		xhr.open("GET", data_model_location);
		xhr.responseType = "json";
		xhr.onload = function () {
			mappings.process_data_model(xhr.response);
		};
		xhr.send();

	},

	process_data_model: function (data_model) {
		const tables = [];
		let data_model_html = '';

		data_model.forEach(function (table_data) {

			let table_name = table_data['classname'].split('.').pop();
			const friendly_table_name = mappings.get_friendly_name(table_name);
			table_name = table_name.toLowerCase();

			let fields = {};
			let relationships = {};

			if (table_data['system'])//skip system tables
				return true;

			table_data['fields'].forEach(function (field) {

				let field_name = field['column'];
				const friendly_field_name = mappings.get_friendly_name(field_name);
				field_name = field_name.toLowerCase();

				fields[field_name] = friendly_field_name;

			});

			table_data['relationships'].forEach(function (relationship) {

				let relationship_name = relationship['name'];
				let relationship_type = relationship['type'];
				let foreign_name = relationship['otherSideName'];
				const friendly_relationship_name = mappings.get_friendly_name(relationship_name);
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

			commons.set_screen('mappings', mappings.list__tables);

		});

		for (const [table_name, table_data] of Object.entries(tables))//remove relationships to system tables
			for (const [relationship_name, relationship_data] of Object.entries(table_data['relationships']))
				if (typeof tables[relationship_data['table_name']] === "undefined")
					delete tables[table_name]['relationships'][relationship_name];


		mappings.list__tables.innerHTML = data_model_html;

		const table_radios = document.getElementsByClassName('radio__table');

		Object.values(table_radios).forEach(function (line) {
			line.addEventListener('change', mappings.set_table);
		});


		mappings.new_column_id = 1;
		mappings.tables = tables;
		mappings.data_model = data_model;//TODO: remove this

	},

	//setters
	set_headers: function (headers = []) {

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

		mappings.list__headers.innerHTML = headers_html;

		mappings.list__headers.addEventListener('change', function (event) {
			if (event.target && event.target.classList.contains('radio__header'))
				mappings.change_selected_header(event);
		});

	},

	set_table: function (event) {
		const radio = event.target;
		const table_name = radio.getAttribute('data-table');
		const table_data = mappings.tables[table_name];

		commons.change_screen('mappings', mappings.list__data_model);

		mappings.button__change_table.style.display = '';

		mappings.title__table_name.classList.remove('undefined');
		mappings.title__table_name.innerText = mappings.tables[table_name]['friendly_table_name'];

		mappings.selected_table = radio;

		let rows_html = '';

		mappings.get_table_rows(table_name).forEach(function (row_key) {

			let row_name;
			let class_append = '';

			if (typeof table_data['fields'][row_key] !== "undefined")//field
				row_name = table_data['fields'][row_key];
			else {//relationship
				row_name = mappings.reference_indicator + table_data['relationships'][row_key]['friendly_relationship_name'];
				class_append = 'relationship';
			}

			rows_html += '<label class="table_fields">' +
				'	<input type="radio" name="field" class="radio__field" data-field="' + row_key + '">' +
				'	<div tabindex="0" class="line ' + class_append + '">' +
				'		<div class="row_name">' + row_name + '</div>' +
				'	</div>' +
				'</label>';

		});

		mappings.base_table_name = table_name;
		mappings.list__data_model.innerHTML = rows_html;

		mappings.list__data_model.addEventListener('change', function (event) {
			if (event.target && event.target.classList.contains('radio__field'))
				mappings.change_selected_field(event);
			else if (event.target && event.target.tagName === 'SELECT')
				mappings.change_option_field(event);
		});

		mappings.list__data_model.addEventListener('focus', function (event) {
			if (event.target && event.target.tagName === 'SELECT')
				mappings.change_option_field(event);
		});

		mappings.tree = {};
		mappings.changes_made = true;

	},

	reset_table: function () {

		mappings.selected_table.checked = false;
		mappings.selected_table = undefined;

		const header_mappings = mappings.list__headers.getElementsByClassName('mapping');

		Object.values(header_mappings).forEach(function (mapping) {
			mapping.outerHTML = '<div class="undefined mapping"></div>';
		});

		mappings.title__table_name.classList.add('undefined');
		mappings.title__table_name.innerText = '';

		commons.change_screen('mappings', mappings.list__tables);

		mappings.button__change_table.style.display = 'none';

	},

	//functions
	map_field: function () {

		const label = mappings.selected_header.parentElement;
		let heading_mapping = label.getElementsByClassName('mapping')[0];

		if (mappings.selected_field === '')
			return;

		if (typeof heading_mapping === "undefined") {//create new header

			const column_name = 'New Column ' + mappings.new_column_id;

			mappings.list__headers.innerHTML += '<label>' +
				'	<input type="radio" name="header" class="radio__header" data-header="' + column_name + '">' +
				'	<div tabindex="0" class="line">' +
				'		<div class="mapping"></div>' +
				'		<div class="header">' + column_name + '</div>' +
				'	</div>' +
				'</label>';

			const labels = mappings.list__headers.getElementsByTagName('label');
			const new_header_label = labels[labels.length - 1];
			heading_mapping = new_header_label.getElementsByTagName('input')[0];

			heading_mapping.checked = true;

			mappings.new_column_id++;

		} else
			heading_mapping.classList.remove('undefined');

		heading_mapping.innerText = mappings.get_selected_field_name();

		const line = heading_mapping.parentNode;
		const radio = line.previousElementSibling;

		const field_path = mappings.get_field_path();
		const string_field_path = field_path.join(mappings.level_separator);
		radio.setAttribute('data-path', string_field_path);

		const friendly_field_path = mappings.get_field_path(undefined,true);
		heading_mapping.setAttribute('title', friendly_field_path);

		mappings.update_buttons();
		mappings.changes_made = true;

	},

	unmap_field: function () {

		const label = mappings.selected_header.parentElement;
		const heading_mapping = label.getElementsByClassName('mapping')[0];

		heading_mapping.classList.add('undefined');
		mappings.selected_header.removeAttribute('data-path');
		heading_mapping.removeAttribute('title');
		heading_mapping.innerText = '';

		mappings.update_buttons();
		mappings.changes_made = true;

	},

	//getters
	get_table_rows: function (table_name) {

		const fields = Object.keys(mappings.tables[table_name]['fields']);
		const relationships = Object.keys(mappings.tables[table_name]['relationships']);

		return fields.concat(relationships).sort();

	},

	get_related_table_rows: function (table_name, previous_table, foreign_name, current_line, index) {

		const mapped_nodes = mappings.get_mapped_children(current_line);

		const rows = Object.keys(mappings.tables[table_name]['fields']);

		Object.keys(mappings.tables[table_name]['relationships']).forEach(function (relationship_key) {
			const relationship = mappings.tables[table_name]['relationships'][relationship_key];
			const enabled = (
				relationship_key !== foreign_name && //disable circular relationships
				(//disable one-to-one and one-to-many if it is already mapped
					typeof mapped_nodes[relationship_key] === "undefined" ||
					(
						relationship['type'] !== "one-to-one" &&
						relationship['type'] !== "many-to-one"
					)
				)
			);
			rows.push([relationship_key, enabled]);
		});

		return rows.sort();

	},

	get_fields_list_for_table: function (table_name, previous_table, foreign_name, current_line, index=false) {

		let fields_html = '<div class="table_relationship">' +
			'<input type="radio" name="field" class="radio__field" data-field="relationship">' +
			'<label class="line">' +
			'	<select name="relationship" class="select__field" data-table="' + table_name + '">' +
			'		<option value="0"></option>';


		const relationship_type = mappings.tables[previous_table]['relationships'][foreign_name]['type'];

		let fields_to_display = {};
		if (index===false && (relationship_type === 'one-to-many' || relationship_type === 'many-to-many')) {

			const mapped_nodes = mappings.get_mapped_children(current_line);
			let mapped_nodes_count = Object.keys(mapped_nodes).length;

			if(mapped_nodes===false)
				mapped_nodes_count = 0;

			const friendly_table_name = mappings.tables[table_name]['friendly_table_name'];

			for(let i=1; i<mapped_nodes_count+2; i++)
				fields_html += '<option value="'+mappings.reference_symbol+i+'">'+i+'. '+friendly_table_name +'</option>';

		} else {
			fields_to_display = mappings.get_related_table_rows(table_name, previous_table, foreign_name, current_line, index);

			fields_to_display.forEach(function (row_data) {

				let row_name;
				let row_key;
				let attribute_append = '';

				if (typeof row_data === "string") {//field
					row_key = row_data;
					row_name = mappings.tables[table_name]['fields'][row_key];
				} else {//relationship
					row_key = row_data[0];
					row_name = mappings.reference_indicator + mappings.tables[table_name]['relationships'][row_key]['friendly_relationship_name'];
					if (!row_data[1])
						attribute_append += 'disabled';
				}

				fields_html += '<option value="' + row_key + '" ' + attribute_append + '>' + row_name + '</option>';

			});
		}


		fields_html += '</select>' +
			'</label>' +
			'</div>';

		return fields_html;

	},

	get_mapped_children: function(current_line){
		const previous_line = current_line.previousElementSibling;

		let previous_element = previous_line.getElementsByTagName('select')[0];
		if (typeof previous_element === "undefined")
			previous_element = previous_line.getElementsByTagName('input')[0];

		if (typeof previous_element === "undefined")
			return {};

		const mappings_array = mappings.get_field_path(previous_element);
		const node_mappings_tree = mappings.array_to_tree(mappings_array);
		const full_mappings_tree = mappings.get_mappings_tree();

		return mappings.traverse_tree(full_mappings_tree, node_mappings_tree);

	},

	get_selected_field_name: function () {

		if (mappings.selected_field.tagName === 'INPUT')
			return mappings.selected_field.parentElement.getElementsByClassName('row_name')[0].innerText;

		return mappings.selected_field.options[mappings.selected_field.selectedIndex].text;

	},

	get_field_path: function (target_field = undefined,human_friendly = false) {

		if (mappings.selected_field === '')
			return '';

		const path = [];
		const lines_count = mappings.lines.length;
		let selected_field_found = false;

		if (typeof target_field === "undefined")
			target_field = mappings.selected_field;

		for (let i = lines_count - 1; i >= 0; i--) {

			let field = mappings.lines[i];
			const field_name = field.getAttribute('data-field');
			let field_value = '';

			if (field_name === 'relationship'){
				field = field.nextElementSibling.getElementsByTagName('select')[0];
				if(human_friendly)
					field_value = field.options[field.selectedIndex].text;
				else
					field_value = field.value;
			}
			else {
				if(human_friendly)
					field_value = field.nextElementSibling.getElementsByClassName('row_name')[0].innerText.replace(mappings.reference_indicator,'');
				else
					field_value = field_name;
			}

			if (!selected_field_found && !(selected_field_found = target_field === field))
				continue;

			if (field_name !== 'relationship') {
				path.push(field_value);
				break;
			} else
				path.push(field_value);

		}

		const result = path.reverse();

		if(human_friendly) {
			const base_table_friendly_name = mappings.tables[mappings.base_table_name]['friendly_table_name']
			result.unshift(base_table_friendly_name);
			return result.join(mappings.friendly_level_separator);
		}

		return result;

	},

	// get_friendly_field_path: function(path,friendly_name= [],table_name){
	//
	// 	if(friendly_name.length === 0){
	// 		const base_table_friendly_name = mappings.tables[mappings.base_table_name]['friendly_table_name']
	// 		friendly_name = mappings.get_friendly_field_path(path,base_table_friendly_name);
	// 		return friendly_name.join(mappings.friendly_level_separator)
	// 	}
	//
	// 	const rank_name = path.pop();
	// },

	get_friendly_name: function (table_name) {
		table_name = table_name.replace(/[A-Z]/g, letter => ` ${letter}`);
		table_name = table_name.replace('D N A', 'DNA');
		table_name = table_name.replace('G U I D', 'GUID');
		table_name = table_name.trim();
		table_name = table_name.charAt(0).toUpperCase() + table_name.slice(1);
		return table_name;
	},

	get_mappings_tree: function () {

		if (!mappings.changes_made)
			return mappings.tree;

		let tree = {};

		Object.values(mappings.headers).forEach(function (header) {

			const raw_path = header.getAttribute('data-path');

			if (raw_path == null)
				return true;

			const path = raw_path.split(mappings.level_separator);
			path.push(header);

			const branch = mappings.array_to_tree(path);
			tree = mappings.deep_merge_object(tree, branch);

		});

		mappings.tree = tree;
		mappings.changes_made = false;


		return tree;

	},

	//callbacks
	change_selected_header: function (event) {
		mappings.selected_header = event.target;
		mappings.update_buttons();

	},

	change_selected_field: function (event) {

		const radio = event.target;
		const label = radio.parentElement;
		const field_key = radio.getAttribute('data-field');

		mappings.selected_field = radio;

		const opened_lists = mappings.list__data_model.getElementsByClassName('table_relationship');
		Object.values(opened_lists).forEach(function (list) {
			mappings.list__data_model.removeChild(list);
		});

		if (mappings.is_selected_field_in_relationship()) {

			const select_line = document.createElement('div');
			mappings.list__data_model.insertBefore(select_line, label.nextSibling);

			const relationship = mappings.tables[mappings.base_table_name]['relationships'][field_key];
			const target_table_name = relationship['table_name'];
			select_line.outerHTML = mappings.get_fields_list_for_table(target_table_name, mappings.base_table_name, field_key, select_line);

			label.nextElementSibling.getElementsByTagName('input')[0].checked = true;

		}

		mappings.update_buttons();

	},

	change_option_field: function (event) {
		const select = event.target;
		const value = select.value;
		const label = select.parentElement;
		const line = label.parentElement;
		const radio = line.getElementsByTagName('input')[0];
		radio.checked = true;

		mappings.selected_field = select;

		let element = line.nextElementSibling;//remove all <select> elements following this one
		while (true) {

			if (element === null || !element.classList.contains('table_relationship'))
				break;

			let next_element = element.nextElementSibling;

			mappings.list__data_model.removeChild(element);

			element = next_element;
		}

		if (mappings.is_selected_field_in_relationship()) {

			const select_line = document.createElement('div');
			mappings.list__data_model.insertBefore(select_line, line.nextSibling);

			let current_table_name;
			let relationship_key = value;
			let index = false;
			if(value[0]===mappings.reference_symbol){//previous_selected_field was a o-m or m-m multiple
				const parent_line = line.previousElementSibling;
				const parent_select = parent_line.getElementsByTagName('select')[0];
				if(typeof parent_select !== "undefined") {
					current_table_name = parent_select.getAttribute('data-table');
					relationship_key = parent_select.value;
				}
				else {
					const parent_input = parent_line.getElementsByTagName('input')[0];
					current_table_name = mappings.base_table_name;
					relationship_key = parent_input.getAttribute('data-field');
				}
				index = value;
			}
			else
				current_table_name = select.getAttribute('data-table');
			const relationship = mappings.tables[current_table_name]['relationships'][relationship_key];
			const target_table_name = relationship['table_name'];
			select_line.outerHTML = mappings.get_fields_list_for_table(target_table_name, current_table_name, relationship_key, select_line, index);

			line.nextElementSibling.getElementsByTagName('input')[0].checked = true;

		}

		mappings.update_buttons();

	},

	//helpers
	is_selected_field_in_relationship: function () {

		if (mappings.selected_field.tagName === 'INPUT') {

			const label = mappings.selected_field.parentElement;
			const name = label.getElementsByClassName('row_name')[0];

			return name.innerText.substr(0, mappings.reference_indicator.length) === mappings.reference_indicator;

		}

		return mappings.selected_field.value[0]===mappings.reference_symbol || mappings.selected_field.options[mappings.selected_field.selectedIndex].text.substr(0, mappings.reference_indicator.length) === mappings.reference_indicator;

	},

	update_buttons: function () {

		mappings.button__map.disabled = typeof mappings.selected_header === "undefined" || mappings.is_selected_field_in_relationship();

		if (typeof mappings.selected_header === "undefined")
			mappings.button__delete.disabled = true;
		else {
			const header_label = mappings.selected_header.parentElement;
			mappings.button__delete.disabled = header_label.tagName !== 'LABEL' || header_label.getElementsByClassName('undefined').length !== 0;
		}

	},

	array_to_tree: function (array, tree = {}) {

		if (array.length === 0)
			return false;
		const node = array.shift();
		const data = mappings.array_to_tree(array);

		if (data === false)
			return node;

		tree[node] = data;
		return tree;

	},

	deep_merge_object: function (target, source) {

		Object.keys(source).forEach(function (source_property) {
			if (typeof target[source_property] === "undefined")
				target[source_property] = source[source_property];
			else
				target[source_property] = mappings.deep_merge_object(target[source_property], source[source_property]);
		});

		return target;

	},

	traverse_tree(full_mappings_tree, node_mappings_tree) {

		if (typeof node_mappings_tree === "undefined")
			return full_mappings_tree;

		let target_key = '';
		if (typeof node_mappings_tree === "string")
			target_key = node_mappings_tree;
		else {
			const target_keys = Object.keys(node_mappings_tree);

			if (target_keys.length === 0)
				return full_mappings_tree;

			target_key = target_keys[0];
		}

		if (typeof full_mappings_tree[target_key] === "undefined")
			return false;

		return mappings.traverse_tree(full_mappings_tree[target_key], node_mappings_tree[target_key]);

	}
};