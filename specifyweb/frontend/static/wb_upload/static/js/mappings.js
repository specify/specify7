"use strict";

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
		mappings.button__show_upload_plan = document.getElementById('button__show_upload_plan');
		mappings.control_line__new_column = document.getElementById('control_line__new_column');
		mappings.control_line__new_static_column = document.getElementById('control_line__new_static_column');

		//button group


		mappings.fetch_data_model();
		mappings.fetch_ranks();
		mappings.set_headers();

		commons.set_screen('mappings', mappings.list__tables);

		mappings.button__change_table.addEventListener('click', mappings.reset_table);

		mappings.button__map.addEventListener('click', mappings.map_field);
		mappings.button__delete.addEventListener('click', mappings.unmap_field);

		mappings.lines = mappings.list__data_model.getElementsByTagName('input');
		mappings.headers = mappings.list__headers.getElementsByTagName('input');

		mappings.button__show_upload_plan.addEventListener('click', mappings.show_upload_plan);

		mappings.control_line__new_column.addEventListener('change', mappings.change_selected_header);
		mappings.control_line__new_static_column.addEventListener('change', mappings.change_selected_header);

		mappings.reference_indicator = '> ';
		mappings.level_separator = '_';
		mappings.friendly_level_separator = ' > ';
		mappings.reference_symbol = '#';
		mappings.tree_symbol = '$';

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

	fetch_ranks: function () {

		const xhr = new XMLHttpRequest();
		xhr.open("GET", ranks_location);
		xhr.responseType = "json";
		xhr.onload = function () {
			mappings.ranks = xhr.response;
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

				let foreign_name = relationship['otherSideName'];
				if (typeof foreign_name !== "undefined")
					foreign_name = foreign_name.toLowerCase();

				const friendly_relationship_name = mappings.get_friendly_name(relationship_name);
				relationship_name = relationship_name.toLowerCase();

				const relationship_type = relationship['type'];
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

	show_upload_plan: function () {
		console.log(mappings.get_upload_plan());
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
			else if (event.target && event.target.tagName === 'TEXTAREA')
				mappings.changes_made = true;
		});

	},

	set_table: function (event) {
		const radio = event.target;
		const table_name = radio.getAttribute('data-table');
		const table_data = mappings.tables[table_name];

		mappings.list__tables_scroll_postion = mappings.list__tables.parentElement.scrollTop;
		commons.change_screen('mappings', mappings.list__data_model);

		mappings.button__change_table.style.display = '';

		mappings.title__table_name.classList.remove('undefined');
		mappings.title__table_name.innerText = mappings.tables[table_name]['friendly_table_name'];

		mappings.selected_table = radio;

		let rows_html = '';

		if (typeof mappings.ranks[table_name] !== "undefined") {//table is a tree

			const ranks = mappings.ranks[table_name];
			const first_rank = Object.keys(ranks)[0];

			rows_html = '<label class="table_fields">' +
				'	<input type="radio" name="field" class="radio__field tree" data-field="' + mappings.tree_symbol + first_rank + '" disabled>' +
				'	<div tabindex="0" class="line relationship">' +
				'		<div class="row_name">' + mappings.reference_indicator + first_rank + '</div>' +
				'	</div>' +
				'</label>' +

				'<div class="table_relationship">' +
				'	<input type="radio" name="field" class="radio__field" data-field="relationship">' +
				'	<label class="line">' +
				'		<select name="' + table_name + '" class="select__field" data-rank="' + mappings.tree_symbol + first_rank + '">' +
				'			<option value="0"></option>';

			mappings.traverse_table_ranks(ranks, function (rank_name) {

				let rank_key;

				if (rank_name === first_rank) {
					rank_key = 'data';
					rank_name += ' Data';
				} else
					rank_key = rank_name;

				rows_html += '<option value="' + mappings.tree_symbol + rank_key + '">' + rank_name + '</option>';

			}, true);

			rows_html += '</select>' +
				'	</label>' +
				'</div>';

		} else {

			const fields = Object.keys(mappings.tables[table_name]['fields']);
			const relationships = Object.keys(mappings.tables[table_name]['relationships']);

			const temp_table_rows = fields.concat(relationships).sort();

			temp_table_rows.forEach(function (row_key) {

				let class_append = '';
				let row_name;

				if (typeof table_data['fields'][row_key] !== 'undefined')
					row_name = table_data['fields'][row_key];
				else {
					row_name = mappings.reference_indicator + table_data['relationships'][row_key]['friendly_relationship_name'];
					class_append += 'relationship';
				}

				rows_html += '<label class="table_fields">' +
					'	<input type="radio" name="field" class="radio__field" data-field="' + row_key + '">' +
					'	<div tabindex="0" class="line ' + class_append + '">' +
					'		<div class="row_name">' + row_name + '</div>' +
					'	</div>' +
					'</label>';

			});

		}


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


		//if header is checked by browser, update selected_header
		function select_header(header) {
			if (header.checked) {
				mappings.selected_header = header;
				return false;
			}
		}

		Object.values(mappings.headers).forEach(select_header);
		select_header(mappings.control_line__new_column);
		select_header(mappings.control_line__new_static_column);


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
		if (typeof mappings.list__tables_scroll_postion !== "undefined") {
			setTimeout(function () {
				mappings.list__tables.parentElement.scrollTop = mappings.list__tables_scroll_postion;
				mappings.list__tables_scroll_postion = undefined;
			}, 0);
		}

		mappings.button__change_table.style.display = 'none';

	},

	//functions
	map_field: function () {

		const label = mappings.selected_header.parentElement;
		let heading_mapping = label.getElementsByClassName('mapping')[0];

		if (mappings.selected_field === '' || mappings.selected_field.getAttribute('disabled') !== null)
			return;

		if (typeof heading_mapping === "undefined") {

			const header_name = mappings.selected_header.getAttribute('data-header');

			const header_line = document.createElement('div');
			mappings.list__headers.appendChild(header_line);

			if (header_name === 'new_column') {//create new header

				const column_name = 'New Column ' + mappings.new_column_id;

				header_line.innerHTML += '<label>' +
					'	<input type="radio" name="header" class="radio__header" data-header="' + column_name + '">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="mapping"></div>' +
					'		<div class="header">' + column_name + '</div>' +
					'	</div>' +
					'</label>';

				mappings.new_column_id++;

			} else if (header_name === 'new_static_column') {//create new static header

				header_line.innerHTML += '<label>' +
					'	<input type="radio" name="header" class="radio__header">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="mapping"></div>' +
					'		<textarea class="value"></textarea>' +
					'	</div>' +
					'</label>';

			}

			const new_header_label = mappings.list__headers.lastElementChild;
			mappings.selected_header = new_header_label.getElementsByTagName('input')[0];
			mappings.selected_header.checked = true;
			heading_mapping = new_header_label.getElementsByClassName('mapping')[0];

		} else
			heading_mapping.classList.remove('undefined');

		heading_mapping.innerText = mappings.get_selected_field_name();

		const line = heading_mapping.parentNode;
		const radio = line.previousElementSibling;

		const field_path = mappings.get_field_path();
		const string_field_path = field_path.join(mappings.level_separator);
		radio.setAttribute('data-path', string_field_path);

		if (field_path.length === 1)
			mappings.selected_field.setAttribute('disabled', '');

		const friendly_field_path = mappings.get_friendly_field_path(field_path);
		heading_mapping.setAttribute('title', friendly_field_path);

		mappings.changes_made = true;
		mappings.update_buttons();
		mappings.update_fields();

	},

	update_fields: function (first_line, mappings_array = []) {

		let field_path;
		if (typeof first_line === "undefined") {
			const last_element = mappings.selected_field;
			const last_line = mappings.get_line_element(last_element);
			first_line = mappings.get_first_line(last_line);
			field_path = mappings.get_field_path();
		} else {
			const last_line = mappings.get_last_line(first_line);
			const control_element = mappings.get_control_element(last_line)[0];
			field_path = mappings.get_field_path(control_element);
		}

		if (mappings_array.length !== 0 && field_path[0] !== mappings_array[0])
			return;

		const mapped_children_count = field_path.length;

		let line = first_line;
		for (let i = 0; i < mapped_children_count; i++) {

			const control_element = mappings.get_control_element(line)[0];

			if (i === 0) {
				if (!control_element.classList.contains('tree'))
					mappings.change_selected_field({target: control_element});
			} else {
				control_element.value = field_path[i];
				mappings.change_option_field({target: control_element});
			}

			line = line.nextElementSibling;

		}

	},

	unmap_field: function () {

		const label = mappings.selected_header.parentElement;
		const heading_mapping = label.getElementsByClassName('mapping')[0];

		const mappings_path = mappings.selected_header.getAttribute('data-path');
		const mappings_array = mappings_path.split(mappings.level_separator);

		heading_mapping.classList.add('undefined');
		mappings.selected_header.removeAttribute('data-path');
		heading_mapping.removeAttribute('title');
		heading_mapping.innerText = '';

		mappings.update_buttons();
		mappings.changes_made = true;

		const lines = Object.values(mappings.lines);
		const lines_count = lines.length;
		for (let i = 0; i < lines_count; i++) {
			if (lines[i].getAttribute('data-field') !== 'relationship') {
				if (i + 1 < lines_count && lines[i + 1].getAttribute('data-field') === 'relationship') {
					if (i + 1 < lines_count) {

						const first_line = lines[i].parentElement;
						mappings.update_fields(first_line, mappings_array);
					}
				} else if (mappings_path === lines[i].getAttribute('data-field'))
					lines[i].removeAttribute('disabled');
			}
		}

	},

	//getters

	get_html_for_table_fields: function (table_name, previous_table, foreign_name, current_line, index = false) {

		let fields_html = '<div class="table_relationship">' +
			'<input type="radio" name="field" class="radio__field" data-field="relationship">' +
			'<label class="line">' +
			'	<select name="' + table_name + '" class="select__field">' +
			'		<option value="0"></option>';


		let relationship_type;
		if (previous_table !== '')
			relationship_type = mappings.tables[previous_table]['relationships'][foreign_name]['type'];

		let mapped_nodes = mappings.get_mapped_children(current_line);

		const ranks = mappings.ranks[table_name];
		if (typeof ranks !== "undefined" && index === false)
			mappings.traverse_table_ranks(ranks, function (rank_name) {
				fields_html += '<option value="' + mappings.tree_symbol + rank_name + '">' + rank_name + '</option>';
			});

		else if (index === false && (relationship_type === 'one-to-many' || relationship_type === 'many-to-many')) {
			let mapped_nodes_count = mapped_nodes.length;

			if (mapped_nodes === false)
				mapped_nodes_count = 0;

			const friendly_table_name = mappings.tables[table_name]['friendly_table_name'];

			for (let i = 1; i < mapped_nodes_count + 2; i++)
				fields_html += '<option value="' + mappings.reference_symbol + i + '">' + i + '. ' + friendly_table_name + '</option>';

		} else {

			const rows = {};

			Object.keys(mappings.tables[table_name]['fields']).forEach(function (field_key) {

				const field_name = mappings.tables[table_name]['fields'][field_key];
				const enabled = !mapped_nodes.includes(field_key);
				rows[field_name] = [field_key, enabled, 'field'];

			});

			Object.keys(mappings.tables[table_name]['relationships']).forEach(function (relationship_key) {
				const relationship = mappings.tables[table_name]['relationships'][relationship_key];
				const relationship_name = relationship['friendly_relationship_name'];
				const enabled = //disables circular relationships
					relationship['foreign_name'] !== foreign_name ||
					relationship['table_name'] !== previous_table;
				rows[relationship_name] = [relationship_key, enabled, 'relationship'];
			});

			Object.keys(rows).sort().forEach(function (row_name) {

				let row_key;
				let attribute_append = '';
				let row_enabled;
				let row_type;

				[row_key, row_enabled, row_type] = rows[row_name];

				if (row_type === 'relationship')
					row_name = mappings.reference_indicator + row_name;

				if (table_name === 'taxon' && row_name !== 'Name')//TODO: remove this to enable all fields for taxa
					row_enabled = false;

				if (!row_enabled)
					attribute_append += 'disabled';

				fields_html += '<option value="' + row_key + '" ' + attribute_append + '>' + row_name + '</option>';

			});
		}


		fields_html += '</select>' +
			'</label>' +
			'</div>';

		return fields_html;

	},

	get_mapped_children: function (current_line) {
		const previous_line = current_line.previousElementSibling;

		const previous_element = mappings.get_control_element(previous_line)[0];

		const mappings_array = mappings.get_field_path(previous_element);
		const node_mappings_tree = mappings.array_to_tree(mappings_array);
		const full_mappings_tree = mappings.get_mappings_tree();

		const tree = mappings.traverse_tree(full_mappings_tree, node_mappings_tree);

		return Object.keys(tree);

	},

	get_selected_field_name: function () {

		if (mappings.selected_field.tagName === 'INPUT')
			return mappings.selected_field.parentElement.getElementsByClassName('row_name')[0].innerText;

		return mappings.selected_field.options[mappings.selected_field.selectedIndex].text;

	},

	get_field_path: function (target_field = undefined) {

		const path = [];

		if (typeof target_field === "undefined") {
			if (mappings.selected_field === '')
				return '';
			target_field = mappings.selected_field;
		}

		let line = mappings.get_line_element(target_field);

		while (true) {

			let control_element;
			let control_element_type;

			[control_element, control_element_type] = mappings.get_control_element(line);

			if (control_element_type === 'select')
				path.push(control_element.value);
			else {
				path.push(control_element.getAttribute('data-field'));
				break;
			}

			line = line.previousElementSibling;

		}

		return path.reverse();

	},

	get_last_line: function (line) {

		while (true) {

			const previous_line = line;

			line = line.nextElementSibling;

			if (line.classList.contains('table_fields'))
				return previous_line;

		}

	},

	get_first_line: function (line) {

		while (true) {

			if (line.classList.contains('table_fields'))
				return line;

			line = line.previousElementSibling;

		}

	},

	get_friendly_field_path: function (path, friendly_names = [], table_name) {

		if (path.length === 0)
			return friendly_names;

		if (friendly_names.length === 0) {
			const base_table_friendly_name = mappings.tables[mappings.base_table_name]['friendly_table_name'];
			friendly_names = mappings.get_friendly_field_path(path, [base_table_friendly_name], mappings.base_table_name);
			return friendly_names.join(mappings.friendly_level_separator);
		}

		const rank_name = path.shift();

		if (rank_name.substr(0, mappings.reference_symbol.length) === mappings.reference_symbol) {
			friendly_names.push(rank_name);
			return mappings.get_friendly_field_path(path, friendly_names, table_name);
		}

		const field_name = mappings.tables[table_name]['fields'][rank_name];
		if (typeof field_name !== "undefined") {
			friendly_names.push(field_name);
			return friendly_names;
		}

		if (rank_name.substr(0, mappings.tree_symbol.length) === mappings.tree_symbol) {

			if (rank_name === mappings.tree_symbol + 'data') {
				friendly_names.push(friendly_names[friendly_names.length - 1] + ' Data');
				return mappings.get_friendly_field_path(path, friendly_names, table_name);
			}

			const new_rank_name = rank_name.substr(mappings.tree_symbol.length);
			friendly_names.push(new_rank_name);
			return mappings.get_friendly_field_path(path, friendly_names, table_name);
		}

		const relationship = mappings.tables[table_name]['relationships'][rank_name];
		friendly_names.push(relationship['friendly_relationship_name']);
		table_name = relationship['table_name'];
		return mappings.get_friendly_field_path(path, friendly_names, table_name);

	},

	get_friendly_name: function (table_name) {
		table_name = table_name.replace(/[A-Z]/g, letter => ` ${letter}`);
		table_name = table_name.trim();
		table_name = table_name.charAt(0).toUpperCase() + table_name.slice(1);

		const regex = /([A-Z]) ([ A-Z])/g;
		const subst = `$1$2`;
		table_name = table_name.replace(regex, subst);
		table_name = table_name.replace(regex, subst);

		table_name = table_name.replace('Dna', 'DNA');

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

			let path = [];

			raw_path.split(mappings.level_separator).forEach(function(path_part){
				path.push(path_part);
			});

			const next_heading_line = header.nextElementSibling;
			const mapping_text_object = next_heading_line.getElementsByClassName('header')[0];

			if (typeof mapping_text_object === "undefined") {
				const textarea = next_heading_line.getElementsByTagName('textarea')[0];
				path.push({'static': textarea.value});
			} else
				path.push(mapping_text_object.innerText);

			const branch = mappings.array_to_tree(path);
			tree = mappings.deep_merge_object(tree, branch);

		});

		mappings.tree = tree;
		mappings.changes_made = false;


		return tree;

	},

	get_line_element: function (control_element) {

		if (typeof control_element === "undefined")
			control_element = mappings.selected_field;

		const parent_element = control_element.parentElement;

		if (parent_element.classList.contains('line'))
			return parent_element.parentElement;

		return parent_element;

	},

	get_upload_plan: function (mappings_tree = '') {

		if (mappings_tree === '')
			mappings_tree = mappings.get_mappings_tree();
		const upload_plan = {};

		upload_plan['baseTableName'] = mappings.base_table_name;

		function handle_tree(tree, rank_name, table_name = '', result_tree = {}) {
			const tree_keys = Object.keys(tree);

			tree_keys.forEach(function (tree_key) {
				if (tree_key === mappings.tree_symbol + 'data') {

					let name = tree[mappings.tree_symbol + 'data']['name'];

					if (typeof name === 'object')
						name = name['static'];

					result_tree[rank_name] = name;
				} else {
					const new_tree_key = tree_key.substr(mappings.tree_symbol.length);
					result_tree = handle_tree(tree[tree_key], new_tree_key, '', result_tree);
				}
			});

			if (table_name !== '') {
				const new_result_tree = {};
				const ranks = mappings.ranks[table_name];

				Object.keys(ranks).forEach(function (key) {
					if (typeof result_tree[key] !== "undefined")
						new_result_tree[key] = result_tree[key];
				});

				result_tree = new_result_tree;
			}

			return result_tree;
		}

		function handle_table(table_data, table_name, wrap_it = true) {

			if (typeof mappings.ranks[table_name] !== "undefined") {
				const top_rank_name = Object.keys(mappings.ranks[table_name])[0];
				return {'treeRecord': {'ranks': handle_tree(table_data[mappings.tree_symbol + top_rank_name], top_rank_name, table_name)}};
			}

			let table_plan = {
				'wbcols': {},
				'static': {},
				'toOne': {},
			};

			if (wrap_it)
				table_plan['toMany'] = {};

			let is_to_many = false;

			Object.keys(table_data).forEach(function (field_name) {

				if (field_name.substr(0, mappings.reference_symbol.length) === mappings.reference_symbol) {
					if (!is_to_many) {
						is_to_many = true;
						table_plan = [];
					}

					table_plan.push(handle_table(table_data[field_name], table_name, false));
				} else if (field_name.substr(0, mappings.tree_symbol.length) === mappings.tree_symbol)
					table_plan = handle_tree(table_data[field_name], field_name, table_name);

				else if (typeof table_data[field_name] === "object" && typeof table_data[field_name]['static'] === "string") {
					let value = table_data[field_name]['static'];

					if (value === 'true')
						value = true;
					else if (value === 'false')
						value = false;
					else if (!isNaN(value))
						value = parseInt(value);

					table_plan['static'][field_name] = value;
				} else if (typeof mappings.tables[table_name]['fields'][field_name] !== "undefined")
					table_plan['wbcols'][field_name] = table_data[field_name];

				else {

					const mapping = mappings.tables[table_name]['relationships'][field_name];
					const mapping_table = mapping['table_name'];
					const is_to_one = mapping['type'] === 'one-to-one' || mapping['type'] === 'many-to-one';

					if (is_to_one && typeof table_plan['toOne'][field_name] === "undefined")
						table_plan['toOne'][field_name] = handle_table(table_data[field_name], mapping_table);

					else if (typeof table_plan['toMany'][field_name] === "undefined")
						table_plan['toMany'][field_name] = handle_table(table_data[field_name], mapping_table);

				}

			});


			if (Array.isArray(table_plan) || !wrap_it)
				return table_plan;

			const keys = Object.keys(table_data);

			if (keys[0].substr(0, mappings.reference_symbol.length) === mappings.reference_symbol)
				return table_plan;

			return {'uploadTable': table_plan};

		}


		upload_plan['uploadable'] = handle_table(mappings_tree, mappings.base_table_name);

		return JSON.stringify(upload_plan, null, "\t");

	},

	get_control_element: function (parent) {
		const parent_select = parent.getElementsByTagName('select')[0];

		if (typeof parent_select !== "undefined")
			return [parent_select, 'select'];

		const parent_input = parent.getElementsByTagName('input')[0];
		return [parent_input, 'input'];
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
			mappings.list__data_model.insertBefore(select_line, label.nextElementSibling);

			const relationship = mappings.tables[mappings.base_table_name]['relationships'][field_key];
			const target_table_name = relationship['table_name'];
			select_line.outerHTML = mappings.get_html_for_table_fields(target_table_name, mappings.base_table_name, field_key, select_line);

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
			mappings.list__data_model.insertBefore(select_line, line.nextElementSibling);

			let current_table_name;
			let relationship_key;
			let index = false;

			if (value.substr(0, mappings.tree_symbol.length) === mappings.tree_symbol) {//previous_selected_field was part of a tree structure

				const table_name = select.getAttribute('name');

				const ranks = mappings.ranks[table_name];
				const rank_names = Object.keys(ranks);

				const current_rank = value.substr(mappings.tree_symbol.length);

				if (current_rank === 'data')
					select_line.outerHTML = mappings.get_html_for_table_fields(table_name, '', '', select_line, true);
				else {
					const start_rank = rank_names.indexOf(current_rank) + 1;

					let fields_html = '<div class="table_relationship">' +
						'<input type="radio" name="field" class="radio__field" data-field="relationship">' +
						'<label class="line">' +
						'	<select name="' + table_name + '" class="select__field" data-rank="' + value + '">' +
						'		<option value="0"></option>' +
						'		<option value="' + mappings.tree_symbol + 'data">' + current_rank + ' Data</option>';

					mappings.traverse_table_ranks(ranks, function (rank_name) {

						fields_html += '<option value="' + mappings.tree_symbol + rank_name + '">' + rank_name + '</option>';

					}, false, start_rank);


					fields_html += '</select>' +
						'</label>' +
						'</div>';

					select_line.outerHTML = fields_html;
				}

			} else {

				if (value.substr(0, mappings.reference_symbol.length) === mappings.reference_symbol) {//previous_selected_field was a o-m or m-m multiple

					const parent_line = line.previousElementSibling;
					let parent_control_element;
					let parent_control_element_type;
					[parent_control_element, parent_control_element_type] = mappings.get_control_element(parent_line);

					if (parent_control_element_type === 'select') {
						current_table_name = parent_control_element.getAttribute('name');
						relationship_key = parent_control_element.value;
					} else {
						current_table_name = mappings.base_table_name;
						relationship_key = parent_control_element.getAttribute('data-field');
					}

					index = value;

				} else {
					current_table_name = select.getAttribute('name');
					relationship_key = value;
				}

				const relationship = mappings.tables[current_table_name]['relationships'][relationship_key];
				const target_table_name = relationship['table_name'];
				select_line.outerHTML = mappings.get_html_for_table_fields(target_table_name, current_table_name, relationship_key, select_line, index);


			}


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

		return mappings.selected_field.value[0] === mappings.reference_symbol || mappings.selected_field.value[0] === mappings.tree_symbol || mappings.selected_field.options[mappings.selected_field.selectedIndex].text.substr(0, mappings.reference_indicator.length) === mappings.reference_indicator;

	},

	traverse_table_ranks: function (ranks, callback, ignore_first_required = false, start_rank = 0) {

		const rank_names = Object.keys(ranks);
		const rank_names_count = rank_names.length;

		for (let rank_name_index = start_rank; rank_name_index < rank_names_count; rank_name_index++) {

			callback(rank_names[rank_name_index]);

			if (ranks[rank_names[rank_name_index]] === true && (!ignore_first_required || rank_name_index !== start_rank))
				break;
		}

	},

	update_buttons: function () {

		mappings.button__map.disabled =
			typeof mappings.selected_header === "undefined" ||
			typeof mappings.selected_field === "undefined" ||
			mappings.selected_field.getAttribute('disabled') !== null ||
			mappings.is_selected_field_in_relationship() ||
			mappings.selected_field.value === "0";

		if (typeof mappings.selected_header === "undefined")
			mappings.button__delete.disabled = true;
		else {
			const header_label = mappings.selected_header.parentElement;
			mappings.button__delete.disabled =
				header_label.tagName !== 'LABEL' ||
				header_label.getElementsByClassName('undefined').length !== 0;
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