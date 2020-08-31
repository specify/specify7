"use strict";
const commons = require('./commons.js');
const schema = require('../schema.js');
const domain = require('../domain.js');
const auto_mapper = require('./auto_mapper.js');

const mappings = {

	//configurators
	constructor: () => {

		// column data model
		mappings.title__table_name = document.getElementById('title__table_name');
		mappings.button__change_table = document.getElementById('button__change_table');
		mappings.list__tables = document.getElementById('list__tables');
		mappings.list__data_model = document.getElementById('list__data_model');
		mappings.lines = mappings.list__data_model.getElementsByTagName('input');


		// column controls
		mappings.button__map = document.getElementById('button__map');
		mappings.button__delete = document.getElementById('button__delete');


		// column headers
		mappings.list__headers = document.getElementById('list__headers');
		mappings.button__new_field = document.getElementById('button__new_field');
		mappings.button__show_upload_plan = document.getElementById('button__show_upload_plan');
		mappings.control_line__new_header = document.getElementById('control_line__new_header');
		mappings.control_line__new_static_header = document.getElementById('control_line__new_static_header');
		mappings.headers = mappings.list__headers.getElementsByTagName('input');


		//config
		mappings.ranks = {};
		mappings.hide_hidden_fields = true;
		mappings.need_to_run_auto_mapper = true;

		mappings.reference_indicator = '> ';
		mappings.level_separator = '_';
		mappings.friendly_level_separator = ' > ';
		mappings.reference_symbol = '#';
		mappings.tree_symbol = '$';


		//initialization
		mappings.fetch_data_model();
		commons.set_screen('mappings', mappings.list__tables);


		//setting event listeners

		mappings.button__change_table.addEventListener('click', mappings.reset_table);

		mappings.button__map.addEventListener('click', mappings.map_field_callback);
		mappings.button__delete.addEventListener('click', mappings.unmap_field_callback);

		mappings.button__show_upload_plan.addEventListener('click', mappings.show_upload_plan);

		mappings.control_line__new_header.addEventListener('change', mappings.change_selected_header);
		mappings.control_line__new_static_header.addEventListener('change', mappings.change_selected_header);

		document.getElementById('checkbox__toggle_hidden_fields').addEventListener('change', () => {
			mappings.hide_hidden_fields = !mappings.hide_hidden_fields;
			mappings.cycle_though_fields();
		});

		mappings.list__data_model.addEventListener('change', (event) => {
			if (event.target && event.target.classList.contains('radio__field'))
				mappings.change_selected_field(event);
			else if (event.target && event.target.tagName === 'SELECT')
				mappings.change_option_field(event);
		});

		mappings.list__data_model.addEventListener('focus', (event) => {
			if (event.target && event.target.tagName === 'SELECT')
				mappings.change_option_field(event);
		});

		mappings.list__headers.addEventListener('change', (event) => {
			if (event.target && event.target['classList'].contains('radio__header'))
				mappings.change_selected_header(event);
			else if (event.target && event.target['tagName'] === 'TEXTAREA')
				mappings.changes_made = true;
		});

		mappings.list__tables.addEventListener('change', (event) => {
			if (event.target && event.target['classList'].contains('radio__table'))
				mappings.set_table(event);
		});


	},

	fetch_data_model: () => {

		const tables = [];
		let data_model_html = '';

		Object.values(schema.models).forEach((table_data) => {

			const table_name = table_data['longName'].split('.').pop().toLowerCase();
			const friendly_table_name = table_data.getLocalizedName();

			let fields = {};
			let relationships = {};

			if (table_data['system'])//skip system tables
				return true;

			table_data['fields'].forEach((field) => {

				let field_name = field['name'];
				let friendly_name = field.getLocalizedName();

				if (typeof friendly_name === "undefined")
					friendly_name = mappings.get_friendly_name(field_name);

				field_name = field_name.toLowerCase();

				const is_hidden = field.isHidden()===1;

				if (field['isRelationship']) {

					let foreign_name = field['otherSideName'];
					if (typeof foreign_name !== "undefined")
						foreign_name = foreign_name.toLowerCase();

					if (field['readOnly'])
						return true;

					const relationship_type = field['type'];
					const table_name = field['relatedModelName'].toLowerCase();

					relationships[field_name] = {
						friendly_relationship_name: friendly_name,
						table_name: table_name,
						type: relationship_type,
						foreign_name: foreign_name,
						is_hidden: is_hidden,
					};

				} else
					fields[field_name] = {
						friendly_field_name: friendly_name,
						is_hidden: is_hidden,
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


			if (typeof relationships['definition'] !== "undefined" && typeof relationships['definitionitem'] !== "undefined")
				mappings.fetch_ranks(table_name);

		});

		commons.set_screen('mappings', mappings.list__tables);


		for (const [table_name, table_data] of Object.entries(tables))//remove relationships to system tables
			for (const [relationship_name, relationship_data] of Object.entries(table_data['relationships']))
				if (typeof tables[relationship_data['table_name']] === "undefined")
					delete tables[table_name]['relationships'][relationship_name];


		mappings.list__tables.innerHTML = data_model_html;

		auto_mapper.constructor(tables, mappings.ranks, mappings.reference_symbol, mappings.tree_symbol);


		mappings.new_header_id = 1;
		mappings.tables = tables;

	},

	fetch_ranks: table_name => {

		domain.getTreeDef(table_name).done(tree_definition => {
			tree_definition.rget('treedefitems').done(
				treeDefItems => {
					treeDefItems.fetch({limit: 0}).done(() => {

						mappings.ranks[table_name] = {};

						Object.values(treeDefItems['models']).forEach((rank) => {

							const rank_id = rank.get('id');

							if (rank_id === 1)
								return true;

							const rank_name = rank.get('name');
							mappings.ranks[table_name][rank_name] = rank.get('isenforced');

						});

					});
				}
			);
		});

	},

	show_upload_plan: () => {//TODO: remove this
		console.log(mappings.get_upload_plan());
	},

	map_field: (mapping_type,header_element,mapping) => {

		//existing_header,header_element,mapping_path
		//new_header,header_name,mapping_path
		//new_static_header,static_value,mapping_path

		let heading_mapping;

		if(mapping_type === 'existing_header'){
			const label = header_element.parentElement;
			heading_mapping = label.getElementsByClassName('mapping')[0];
			heading_mapping.classList.remove('undefined');
		}

		else {

			const header_line__element = document.createElement('div');
			mappings.list__headers.appendChild(header_line__element);

			if(mapping_type === 'new_header'){
				let header_name;

				if(header_element === '')
					header_name = 'New Column ' + mappings.new_header_id;
				else
					header_name = header_element;

				header_line__element.innerHTML += '<label>' +
					'	<input type="radio" name="header" class="radio__header" data-header="' + header_name + '">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="mapping"></div>' +
					'		<div class="header">' + header_name + '</div>' +
					'	</div>' +
					'</label>';

				mappings.new_header_id++;
			}
			else if(mapping_type === 'new_static_header')
				header_line__element.innerHTML += '<label>' +
					'	<input type="radio" name="header" class="radio__header">' +
					'	<div tabindex="0" class="line">' +
					'		<div class="mapping"></div>' +
					'		<textarea class="value">'+header_element+'</textarea>' +
					'	</div>' +
					'</label>';

			const new_header_label = mappings.list__headers.lastElementChild;
			header_element = new_header_label.getElementsByTagName('input')[0];
			header_element.checked = true;
			heading_mapping = new_header_label.getElementsByClassName('mapping')[0];

		}

		const mapping_path = mapping.join(mappings.level_separator);

		header_element.setAttribute('data-path', mapping_path);

		if (mapping.length === 1 && typeof mappings.selected_field !== "undefined")
			mappings.selected_field.setAttribute('disabled', '');

		const friendly_field_path_array = mappings.get_friendly_field_path(mapping.slice());
		const friendly_field_path = friendly_field_path_array.join(mappings.friendly_level_separator);

		heading_mapping.innerText = mappings.get_friendly_field_path_preview(friendly_field_path_array,mapping);
		heading_mapping.setAttribute('title', friendly_field_path);

		return heading_mapping;

	},

	implement_array_of_mappings: (array_of_mappings) => {

		if(array_of_mappings.length === 0)
			return false;



		const base_table_columns = [];

		Object.values(array_of_mappings).forEach((header_data) => {

			let header;
			let mapping;
			let mapping_type;
			[mapping_type, header, mapping] = header_data;

			if(mapping_type === 'existing_header'){
				const position = mappings.raw_headers.indexOf(header);
				header = mappings.headers[position];
			}

			mappings.map_field(mapping_type, header, mapping);

			//disable base table columns
			if(mapping.length===1)
				base_table_columns.push(mapping[0]);

		});

		Object.values(mappings.lines).forEach((line) => {
			const data_field = line.getAttribute('data-field');
			if(data_field!=='relationship' && base_table_columns.indexOf(data_field)!==-1)
				line.setAttribute('disabled', '')
		});

		//make all checkboxes unchecked again
		mappings.headers[0].checked = true;
		mappings.headers[0].checked = false;

		mappings.changes_made = true;
		mappings.update_buttons();

	},

	//setters
	set_table: (event) => {

		const radio = event.target;
		const table_name = radio.getAttribute('data-table');
		const table_data = mappings.tables[table_name];

		mappings.list__tables_scroll_postion = mappings.list__tables.parentElement.scrollTop;
		mappings.list__tables.parentElement.scrollTop = 0;
		commons.change_screen('mappings', mappings.list__data_model);

		mappings.button__change_table.style.display = '';

		mappings.title__table_name.classList.remove('undefined');
		mappings.title__table_name.innerText = mappings.tables[table_name]['friendly_table_name'];

		mappings.selected_table = radio;

		let rows_html = '';

		if (typeof mappings.ranks[table_name] !== "undefined") {//table is a tree

			const ranks = mappings.ranks[table_name];

			Object.keys(ranks).forEach((rank_name) => {

				rows_html += '<label class="table_fields">' +
					'	<input type="radio" name="field" class="radio__field tree" data-field="' + mappings.tree_symbol + rank_name + '">' +
					'	<div tabindex="0" class="line relationship">' +
					'		<div class="row_name">' + mappings.reference_indicator + rank_name + '</div>' +
					'	</div>' +
					'</label>';

			});

		} else {

			const fields = Object.keys(mappings.tables[table_name]['fields']);
			const relationships = Object.keys(mappings.tables[table_name]['relationships']);

			const temp_table_rows = fields.concat(relationships).sort();

			temp_table_rows.forEach((row_key) => {

				let class_append = '';
				let row_name;

				if (typeof table_data['fields'][row_key] !== 'undefined')
					row_name = table_data['fields'][row_key]['friendly_field_name'];
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


		//if header is checked by browser, update selected_header
		function select_header(header) {
			if (header.checked) {
				mappings.selected_header = header;
				return false;
			}
		}

		Object.values(mappings.headers).forEach(select_header);
		select_header(mappings.control_line__new_header);
		select_header(mappings.control_line__new_static_header);


		mappings.tree = {};
		mappings.changes_made = true;

		if (mappings.need_to_run_auto_mapper) {
			const mappings_object = auto_mapper.map(mappings.raw_headers, mappings.base_table_name);
			const array_of_mappings = [];
			Object.keys(mappings_object).forEach((header_name) => {
				const mapping_path = mappings_object[header_name];
				array_of_mappings.push(['existing_header',header_name,mapping_path]);
			});
			mappings.need_to_run_auto_mapper = false;
			mappings.implement_array_of_mappings(array_of_mappings);
		}

	},

	set_headers: (headers = [], upload_plan = '', headers_defined=true) => {

		let headers_html = '';

		mappings.need_to_run_auto_mapper = headers_defined;//don't run auto mapper if CSV file doesn't have headers

		mappings.raw_headers = headers;

		headers.forEach((header) => {
			headers_html += '<label>' +
				'	<input type="radio" name="header" class="radio__header" data-header="' + header + '">' +
				'	<div tabindex="0" class="line">' +
				'		<div class="undefined mapping"></div>' +
				'		<div class="header">' + header + '</div>' +
				'	</div>' +
				'</label>';
		});

		mappings.list__headers.innerHTML = headers_html;

		let mappings_tree = '';
		if (upload_plan !== '') {
			const upload_plan_object = JSON.parse(upload_plan);

			const base_table_name = upload_plan_object['baseTableName'];
			const list_of_tables = Object.keys(mappings.tables);
			const table_position = list_of_tables.indexOf(base_table_name);
			const label = mappings.list__tables.children[table_position];
			const radio = mappings.get_control_element(label)[0];
			mappings.need_to_run_auto_mapper = false;

			mappings.set_table({target: radio});

			mappings_tree = mappings.upload_plan_to_mappings_tree(upload_plan_object);
			const array_of_mappings = mappings.mappings_tree_to_array_of_mappings(mappings_tree);
			mappings.implement_array_of_mappings(array_of_mappings);
		}

	},

	reset_table: () => {

		if (typeof mappings.selected_table === "undefined")
			return;

		mappings.selected_table.checked = false;
		mappings.selected_table = undefined;

		const header_mappings = mappings.list__headers.getElementsByClassName('mapping');

		Object.values(header_mappings).forEach((mapping) => {
			mapping.outerHTML = '<div class="undefined mapping"></div>';
		});

		mappings.title__table_name.classList.add('undefined');
		mappings.title__table_name.innerText = '';

		commons.change_screen('mappings', mappings.list__tables);
		if (typeof mappings.list__tables_scroll_postion !== "undefined") {
			setTimeout(() => {
				mappings.list__tables.parentElement.scrollTop = mappings.list__tables_scroll_postion;
				mappings.list__tables_scroll_postion = undefined;
			}, 0);
		}

		mappings.button__change_table.style.display = 'none';
		mappings.need_to_run_auto_mapper = true;

	},

	//functions
	map_field_callback: () => {

		if (mappings.selected_field === '' ||
			mappings.selected_field.getAttribute('disabled') !== null
		)
			return;

		let mapping_type;
		let header;
		let mapping;

		const label = mappings.selected_header.parentElement;
		let heading_mapping = label.getElementsByClassName('mapping')[0];

		header = mappings.selected_header
		mapping = mappings.get_field_path();

		if (typeof heading_mapping === "undefined") {
			mapping_type = mappings.selected_header.getAttribute('data-header');
			header = '';
		}
		else {
			mapping_type = 'existing_header';
			mappings.unmap_field_callback();
		}

		mappings.selected_header = mappings.map_field(mapping_type, header, mapping);

		mappings.changes_made = true;
		mappings.update_buttons();
		mappings.update_fields();

	},

	update_fields: (first_line, mappings_array = []) => {

		let field_path;
		if (typeof first_line === "undefined") {
			let last_element = mappings.selected_field;
			if(typeof last_element === "undefined")
				last_element = mappings.lines[0];
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

	unmap_field_callback: () => {

		const label = mappings.selected_header.parentElement;
		const heading_mapping = label.getElementsByClassName('mapping')[0];

		const mappings_path = mappings.selected_header.getAttribute('data-path');

		if (mappings_path === null)
			return;

		const mappings_array = mappings_path.split(mappings.level_separator);

		heading_mapping.classList.add('undefined');
		mappings.selected_header.removeAttribute('data-path');
		heading_mapping.removeAttribute('title');
		heading_mapping.innerText = '';

		mappings.changes_made = true;

		//go through each field and update it's status
		mappings.cycle_though_fields(mappings_array, mappings_path);

		mappings.update_buttons();


	},

	//getters
	get_html_for_table_fields: (table_name, previous_table, foreign_name, current_line, index = false) => {

		let fields_html = '';


		let mapped_nodes = mappings.get_mapped_children(current_line);

		const ranks = mappings.ranks[table_name];
		if (index === false) {

			if (typeof ranks !== "undefined")
				Object.keys(ranks).forEach((rank_name) => {
					fields_html += '<option value="' + mappings.tree_symbol + rank_name + '">' + mappings.reference_indicator + rank_name + '</option>';
				});

			let relationship_type;
			if (previous_table !== '')
				relationship_type = mappings.tables[previous_table]['relationships'][foreign_name]['type'];

			if (fields_html === '' && (relationship_type === 'one-to-many' || relationship_type === 'many-to-many')) {
				let mapped_nodes_count = mapped_nodes.length;

				if (mapped_nodes === false)
					mapped_nodes_count = 0;

				const friendly_table_name = mappings.tables[table_name]['friendly_table_name'];

				for (let i = 1; i < mapped_nodes_count + 2; i++)
					fields_html += '<option value="' + mappings.reference_symbol + i + '">' + i + '. ' + friendly_table_name + '</option>';
			}

		}

		if (fields_html === '') {

			const rows = {};

			Object.keys(mappings.tables[table_name]['fields']).forEach((field_key) => {

				const field_data = mappings.tables[table_name]['fields'][field_key];
				const is_field_hidden = field_data['is_hidden'];

				if (is_field_hidden && mappings.hide_hidden_fields)
					return true;

				const field_name = field_data['friendly_field_name'];
				const enabled = !mapped_nodes.includes(field_key);
				rows[field_name] = [field_key, enabled, 'field'];

			});

			Object.keys(mappings.tables[table_name]['relationships']).forEach((relationship_key) => {
				const relationship_data = mappings.tables[table_name]['relationships'][relationship_key];

				const is_field_hidden = relationship_data['is_hidden'];
				if (is_field_hidden && mappings.hide_hidden_fields)
					return true;

				const relationship_name = relationship_data['friendly_relationship_name'];
				const enabled = //disables circular relationships
					relationship_data['foreign_name'] !== foreign_name ||
					relationship_data['table_name'] !== previous_table;
				rows[relationship_name] = [relationship_key, enabled, 'relationship'];
			});

			Object.keys(rows).sort().forEach((row_name) => {

				let row_key;
				let attribute_append = '';
				let row_enabled;
				let row_type;

				[row_key, row_enabled, row_type] = rows[row_name];

				if (row_type === 'relationship')
					row_name = mappings.reference_indicator + row_name;

				if (//TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
					typeof mappings.ranks[table_name] !== "undefined" &&
					row_name !== 'Name'
				)
					row_enabled = false;

				if (!row_enabled)
					attribute_append += 'disabled';

				fields_html += '<option value="' + row_key + '" ' + attribute_append + '>' + row_name + '</option>';

			});
		}


		fields_html = '<div class="table_relationship">' +
			'<input type="radio" name="field" class="radio__field" data-field="relationship">' +
			'<label class="line">' +
			'	<select name="' + table_name + '" class="select__field">' +
			'		<option value="0"></option>' +
			'		' + fields_html + '' +
			'	</select>' +
			'</label>' +
			'</div>';

		return fields_html;

	},

	get_mapped_children: (current_line) => {
		const previous_line = current_line.previousElementSibling;

		const previous_element = mappings.get_control_element(previous_line)[0];

		const mappings_array = mappings.get_field_path(previous_element);
		const node_mappings_tree = mappings.array_to_tree(mappings_array);
		const full_mappings_tree = mappings.get_mappings_tree();

		const tree = mappings.traverse_tree(full_mappings_tree, node_mappings_tree);

		return Object.keys(tree);

	},

	get_field_path: (target_field = undefined) => {

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


		if(path.length === 0 && path[0]===null)
			return [];

		return path.reverse();

	},

	get_last_line: (line) => {

		while (true) {

			const previous_line = line;

			line = line.nextElementSibling;

			if (line.classList.contains('table_fields'))
				return previous_line;

		}

	},

	get_first_line: (line) => {

		while (true) {

			if (line.classList.contains('table_fields'))
				return line;

			line = line.previousElementSibling;

		}

	},

	//turns a mapping path (array) into a friendly mapping path (array)
	get_friendly_field_path: (path, friendly_names = [], table_name) => {

		//return result after path is processed
		if (path.length === 0)
			return friendly_names;

		//detects the first execution
		if (friendly_names.length === 0) {
			const base_table_friendly_name = mappings.tables[mappings.base_table_name]['friendly_table_name'];
			return mappings.get_friendly_field_path(path, [base_table_friendly_name], mappings.base_table_name);
		}

		const field_name = path.shift();

		//detects a -to-many object
		if (field_name.substr(0, mappings.reference_symbol.length) === mappings.reference_symbol) {
			friendly_names.push(field_name);
			return mappings.get_friendly_field_path(path, friendly_names, table_name);
		}

		//detects a field
		const field_data = mappings.tables[table_name]['fields'][field_name];
		if (typeof field_data !== "undefined") {
			const field_name = field_data['friendly_field_name'];
			friendly_names.push(field_name);
			return friendly_names;
		}

		//detects a tree
		if (field_name.substr(0, mappings.tree_symbol.length) === mappings.tree_symbol) {
			const new_rank_name = field_name.substr(mappings.tree_symbol.length);
			friendly_names.push(new_rank_name);
			return mappings.get_friendly_field_path(path, friendly_names, table_name);
		}

		//detects a relationship
		const relationship = mappings.tables[table_name]['relationships'][field_name];
		friendly_names.push(relationship['friendly_relationship_name']);
		table_name = relationship['table_name'];
		return mappings.get_friendly_field_path(path, friendly_names, table_name);

	},

	get_friendly_field_path_preview: (friendly_field_path, field_path) => {
		friendly_field_path = friendly_field_path.splice(1);//remove the base table from the friendly path
		const path_length = friendly_field_path.length;

		if(path_length === 0 || path_length !== field_path.length)
			return '';

		let result = friendly_field_path[path_length-1];

		if(path_length === 1)
			return result;

		//if base table is a tree and path length == 2
		if(path_length === 2 && typeof mappings.ranks[mappings.base_table_name] !== "undefined")
			return friendly_field_path[0] + ' ' + result;//e.x. for `Kingdom > Name` return `Kingdom Name`

		//detect previous field being a -to-many object
		if(friendly_field_path[path_length-2].substr(0,mappings.reference_symbol.length)===mappings.reference_symbol)
			return friendly_field_path[path_length-2] + ' ' + result;//e.x. for `... > #1 > Name` return `#1 Name`

		//detect previous field being a tree rank
		if(field_path[path_length-2].substr(0,mappings.tree_symbol.length)===mappings.tree_symbol)
			return field_path[path_length - 2].substr(mappings.tree_symbol.length) + ' ' + result;//e.x. for `$Kingdom > Name` return `Kingdom Name`


		return result;
	},

	get_mappings_tree: () => {

		if (!mappings.changes_made)
			return mappings.tree;

		let tree = {};

		Object.values(mappings.headers).forEach((header) => {

			const raw_path = header.getAttribute('data-path');

			if (raw_path == null)
				return true;

			let path = [];

			raw_path.split(mappings.level_separator).forEach((path_part) => {
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

	get_line_element: (control_element) => {

		if (typeof control_element === "undefined")
			control_element = mappings.selected_field;

		const parent_element = control_element.parentElement;

		if (parent_element.classList.contains('line'))
			return parent_element.parentElement;

		return parent_element;

	},

	//only called if failed to find friendly_name in schema_definition
	get_friendly_name: (table_name) => {
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

	get_upload_plan: (mappings_tree = '') => {

		if (mappings_tree === '')
			mappings_tree = mappings.get_mappings_tree();
		const upload_plan = {};

		upload_plan['baseTableName'] = mappings.base_table_name;

		function handle_table(table_data, table_name, wrap_it = true) {

			if (typeof mappings.ranks[table_name] !== "undefined") {

				const final_tree = {};

				Object.keys(table_data).forEach((tree_key) => {

					const new_tree_key = tree_key.substr(mappings.tree_symbol.length);
					let name = table_data[tree_key]['name'];

					if (typeof name === 'object')//handle static records
						name = name['static'];

					final_tree[new_tree_key] = name;

				});


				return {'treeRecord': {'ranks': final_tree}};
			}

			let table_plan = {
				'wbcols': {},
				'static': {},
				'toOne': {},
			};

			if (wrap_it)
				table_plan['toMany'] = {};

			let is_to_many = false;

			Object.keys(table_data).forEach((field_name) => {

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

	get_control_element: (parent) => {
		const parent_select = parent.getElementsByTagName('select')[0];

		if (typeof parent_select !== "undefined")
			return [parent_select, 'select'];

		const parent_input = parent.getElementsByTagName('input')[0];
		return [parent_input, 'input'];
	},

	//callbacks
	change_selected_header: (event) => {
		mappings.selected_header = event.target;
		mappings.update_buttons();

	},

	change_selected_field: (event) => {

		const radio = event.target;
		const label = radio.parentElement;
		const field_key = radio.getAttribute('data-field');

		mappings.selected_field = radio;

		const opened_lists = mappings.list__data_model.getElementsByClassName('table_relationship');
		Object.values(opened_lists).forEach((list) => {
			mappings.list__data_model.removeChild(list);
		});

		if (mappings.is_selected_field_in_relationship()) {

			const select_line = document.createElement('div');
			mappings.list__data_model.insertBefore(select_line, label.nextElementSibling);

			let target_table_name;
			let index = field_key.substr(0, mappings.tree_symbol.length) === mappings.tree_symbol;
			if (index)
				target_table_name = mappings.base_table_name;
			else {
				const relationship = mappings.tables[mappings.base_table_name]['relationships'][field_key];
				target_table_name = relationship['table_name'];
			}

			select_line.outerHTML = mappings.get_html_for_table_fields(target_table_name, mappings.base_table_name, field_key, select_line, index);
			label.nextElementSibling.getElementsByTagName('input')[0].checked = true;

		}

		mappings.update_buttons();

	},

	change_option_field: (event) => {
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


		if (mappings.is_selected_field_in_relationship() && value !== '' && value !== "0") {

			const select_line = document.createElement('div');
			mappings.list__data_model.insertBefore(select_line, line.nextElementSibling);

			let current_table_name;
			let relationship_key;
			let index = false;

			if (value.substr(0, mappings.tree_symbol.length) === mappings.tree_symbol) {//previous_selected_field was part of a tree structure

				const table_name = select.getAttribute('name');
				select_line.outerHTML = mappings.get_html_for_table_fields(table_name, '', '', select_line, true);

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
	upload_plan_to_mappings_tree: (upload_plan, base_table_name_extracted = false) => {

		const tree = {};

		if (base_table_name_extracted === false) {
			mappings.base_table_name = upload_plan['baseTableName'];

			return mappings.upload_plan_to_mappings_tree(upload_plan['uploadable'], true);
		} else if (typeof upload_plan['uploadTable'] !== "undefined")
			return mappings.upload_plan_to_mappings_tree(upload_plan['uploadTable'], true);

		else if (typeof upload_plan['treeRecord'] !== "undefined") {

			const tree = upload_plan['treeRecord']['ranks'];
			const new_tree = {};

			Object.keys(tree).forEach((rank_name) => {
				const new_rank_name = mappings.tree_symbol + rank_name;
				new_tree[new_rank_name] = {'name': tree[rank_name]};
			});

			return new_tree;

		}

		Object.keys(upload_plan).forEach((plan_node_name) => {

			if (plan_node_name === 'wbcols') {

				const workbench_headers = upload_plan[plan_node_name];

				Object.keys(workbench_headers).forEach((data_model_header_name) => {
					tree[data_model_header_name] = workbench_headers[data_model_header_name];
				});

			} else if (plan_node_name === 'static') {

				const static_headers = upload_plan[plan_node_name];

				Object.keys(static_headers).forEach((data_model_header_name) => {
					tree[data_model_header_name] = {'static': static_headers[data_model_header_name]};
				});

			} else if (plan_node_name === 'toOne') {

				const to_one_headers = upload_plan[plan_node_name];

				Object.keys(to_one_headers).forEach((data_model_header_name) => {
					tree[data_model_header_name] = mappings.upload_plan_to_mappings_tree(to_one_headers[data_model_header_name], true);
				});

			} else if (plan_node_name === 'toMany') {

				const to_many_headers = upload_plan[plan_node_name];

				Object.keys(to_many_headers).forEach((table_name) => {

					const final_mappings = {};
					const original_mappings = to_many_headers[table_name];
					let i = 1;

					Object.values(original_mappings).forEach((mapping) => {
						const final_mappings_key = mappings.reference_symbol + i;
						final_mappings[final_mappings_key] = mappings.upload_plan_to_mappings_tree(mapping, true);
						i++;
					});

					tree[table_name] = final_mappings;

				});

			}

		});

		return tree;

	},

	cycle_though_fields: (mappings_array = [], mappings_path = '') => {

		const lines = Object.values(mappings.lines);
		const lines_count = lines.length;
		for (let i = 0; i < lines_count; i++) {

			const data_field = lines[i].getAttribute('data-field');
			if (data_field !== 'relationship') {//field is not a relationship

				if (i + 1 < lines_count && lines[i + 1].getAttribute('data-field') === 'relationship') {//next field exists and is relationship
					const first_line = lines[i].parentElement;
					mappings.update_fields(first_line, mappings_array);

				} else if (mappings_array.length === 1 && mappings_path === data_field)//re_enable base table field if it was unmapped
					lines[i].removeAttribute('disabled');

			}

		}

	},

	is_selected_field_in_relationship: () => {

		if (mappings.selected_field.tagName === 'INPUT') {

			const label = mappings.selected_field.parentElement;
			const name = label.getElementsByClassName('row_name')[0];

			return name.innerText.substr(0, mappings.reference_indicator.length) === mappings.reference_indicator;

		}

		return mappings.selected_field.value[0] === mappings.reference_symbol ||
			mappings.selected_field.value[0] === mappings.tree_symbol ||
			mappings.selected_field.selectedIndex === -1 ||
			mappings.selected_field.options[mappings.selected_field.selectedIndex].text.substr(0, mappings.reference_indicator.length) === mappings.reference_indicator;

	},

	update_buttons: () => {

		mappings.button__map.disabled =
			typeof mappings.selected_header === "undefined" ||
			typeof mappings.selected_field === "undefined" ||
			mappings.selected_field.getAttribute('disabled') !== null ||
			(
				mappings.selected_field.tagName === 'SELECT' &&
				mappings.selected_field.options[mappings.selected_field.selectedIndex].getAttribute('disabled')===''
			) ||
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

	array_to_tree: (array, tree = {}) => {

		if (array.length === 0)
			return false;
		const node = array.shift();
		const data = mappings.array_to_tree(array);

		if (data === false)
			return node;

		tree[node] = data;
		return tree;

	},

	deep_merge_object: (target, source) => {

		Object.keys(source).forEach((source_property) => {
			if (typeof target[source_property] === "undefined")
				target[source_property] = source[source_property];
			else
				target[source_property] = mappings.deep_merge_object(target[source_property], source[source_property]);
		});

		return target;

	},

	traverse_tree: (full_mappings_tree, node_mappings_tree) => {

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

	},

	mappings_tree_to_array_of_mappings: (mappings_tree, result = [], path=[]) => {
		Object.keys(mappings_tree).forEach((tree_node_name) => {
			const tree_node = mappings_tree[tree_node_name];
			const local_path = path.slice();
			local_path.push(tree_node_name);
			if(typeof tree_node !== 'object'){

				let mapping_type;

				if(mappings.raw_headers.indexOf(tree_node)!==-1)
					mapping_type = 'existing_header';
				else if (tree_node_name==='static'){
					mapping_type = 'new_static_header';
					local_path.pop();
				}
				else
					mapping_type = 'new_header';

				result.push([mapping_type,tree_node,local_path]);
			}
			else
				result = mappings.mappings_tree_to_array_of_mappings(tree_node,result,local_path);
		});

		return result;
	},
};

module.exports = mappings;
