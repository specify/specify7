"use strict";

const tree_helpers = require('./tree_helpers.js');
const dom_helper = require('./dom_helper.js');
const helper = require('./helper.js');
const html_generator = require('./html_generator.js');
const navigation = require('../navigation.js');

const mappings = {

	get_html_generator(){
		return html_generator;
	},


	/*
	* Implements array of mappings
	* @param {array} array_of_mappings - Array of arrays of mappings like [mapping_type,header_name,mapping_path] where
	* 									 @param {string} mapping_type - existing_header / new_header / new_static_header
	* 									 @param {mixed} header_element - {DOMElement} header_element - <input type="radio"> if mapping type is `existing_header`
	* 								  									 {string} header_name - Name of the header if mapping type is `new_header`
	* 								  									 {string} static_value - Value of a static field if mapping type is `static_value`
	* 									 @param {array} mapping_path - Mapping path array
	* */
	implement_array_of_mappings(array_of_mappings){

		if (array_of_mappings.length === 0)
			return false;

		Object.values(array_of_mappings).map(header_data =>
			mappings.add_new_mapping_line(-1, header_data['mapping_path'], header_data['header_data'])
		);

		this.changes_made = true;
		mappings.update_all_lines();

	},


	// SETTERS

	/* Select table
	* @param {mixed} - {Object} event - event object. Only event.target property is used
	* 					OR
	* 				   {string} event - name of the table to set
	* */
	set_table(event){

		let table_name;
		if (typeof event === "object") {
			const radio = event.target;
			table_name = dom_helper.get_table_name(radio);
		} else
			table_name = event;

		this.list__tables.style.display = 'none';
		this.list__mappings.style.display = '';
		this.mapping_view.style.display = '';

		this.wbplanview_table_header_content.style.display = '';

		this.title__table_name.classList.remove('undefined');
		this.title__table_name.innerText = mappings.tables[table_name]['table_friendly_name'];

		this.base_table_name = table_name;

		this.tree = {};
		this.changes_made = true;

		const base_table_fields = [mappings.get_fields_for_table({
			table_name: this.base_table_name,
			use_cached: true,
		})];
		mappings.mapping_view.innerHTML = html_generator.mapping_view(base_table_fields, true);

		//TODO: uncomment this before production
		//navigation.addUnloadProtect(this, "This mapping has not been saved.");

		if (mappings.need_to_define_lines) {
			mappings.need_to_define_lines = false;

			const result_lines = [];
			for (const header of Object.keys(this.headers)) {

				const mapping_line_data = {
					line_data: base_table_fields,
					header_data: {
						mapping_type: 'existing_header',
						header_name: header,
					},
				};
				const mapping_line_html = html_generator.mapping_line(mapping_line_data, true);

				result_lines.push(mapping_line_html);

			}

			mappings.list__mappings.innerHTML = result_lines.join('');

		}

		if (mappings.need_to_run_automapper) {
			const mappings_object = mappings.auto_mapper_run(Object.keys(this.headers), this.base_table_name);
			const array_of_mappings = mappings_object.map(([header_name, mapping_path]) => {
				return {
					mapping_path: mapping_path,
					header_data: {
						mapping_type: 'existing_header',
						header_name: header_name,
					}
				};
			});
			this.need_to_run_auto_mapper = false;
			mappings.implement_array_of_mappings(array_of_mappings);
		}

		mappings.update_all_lines([]);

	},

	/*
	* Updates the list of headers
	* @param {array} [headers=[]] - List of headers as strings
	* @param {object} [upload_plan=false] - Upload plan as an object or {bool} false for none
	* @param {bool} [headers_defined=true] - Whether CSV file had headers in the first line
	* */
	set_headers: function(headers = [], upload_plan = false, headers_defined = true){

		//remove all existing lines
		mappings.list__mappings.innerHTML = '';


		tree_helpers.raw_headers = headers;
		this.headers = Object.fromEntries(headers.map(header_name => [header_name, false]));

		if (upload_plan !== false) {
			let mappings_tree = '';
			const {baseTableName: base_table_name} = upload_plan;

			mappings.set_table(base_table_name);

			mappings_tree = mappings.upload_plan_to_mappings_tree(upload_plan);
			const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree);
			mappings.implement_array_of_mappings(array_of_mappings);
		} else
			mappings.need_to_define_lines = true;

		mappings.need_to_run_automapper = headers_defined;

	},

	/*
	* Resets the currently mapped fields and presents the option to chose base table again
	* */
	reset_table(){

		if (typeof this.base_table_name === "undefined")
			return;

		this.title__table_name.classList.add('undefined');
		this.title__table_name.innerText = '';

		this.list__tables.style.display = '';
		this.list__mappings.style.display = 'none';
		this.mapping_view.style.display = 'none';

		this.list__mappings.innerHTML = '';

		this.wbplanview_table_header_content.style.display = 'none';
		this.base_table_name = undefined;

		//TODO: uncomment this before production
		//navigation.removeUnloadProtect(this);

		mappings.need_to_define_lines = true;
		mappings.need_to_run_auto_mapper = true;

	},


	// FUNCTIONS

	add_new_mapping_line(position = -1, mappings_path = [], header_data){

		const lines = dom_helper.get_lines(mappings.list__mappings);

		//before adding new header, check if it already present
		const {header_name} = header_data;
		const header_index = Object.keys(this.headers).indexOf(header_name);
		let new_mapping_line = lines[header_index];

		//find position for new header
		if (typeof new_mapping_line === "undefined") {

			new_mapping_line = document.createElement('div');

			if (position < -1)
				position = lines.length + 1 + position;

			if (position >= lines.length)
				mappings.list__mappings.appendChild(new_mapping_line);
			else
				mappings.list__mappings.insertBefore(new_mapping_line, lines[position]);

		}

		const line_data = mappings.get_mapping_line_data_from_mappings_path({
			mappings_path: mappings_path,
			use_cached: true,
		});

		const mapping_line_data = {
			line_data: line_data,
			header_data: header_data,
		};

		new_mapping_line.outerHTML = html_generator.mapping_line(mapping_line_data, true);

		mappings.update_all_lines(mappings_path);

	},


	// GETTERS

	//mapping_path should not include fields, only relationships
	get_mapping_line_data_from_mappings_path(payload){

		const {
			mappings_path = [],
			iterate = true,
			use_cached = false,
			recursive_payload = undefined,
			generate_last_relationship_data = true,
		} = payload;

		let table_name = '';
		let parent_table_name = '';
		let parent_table_relationship_name = '';
		let mapping_line_data = [];
		let mappings_path_position = -1;

		if (typeof recursive_payload !== "undefined") {
			({
				table_name,
				parent_table_name,
				parent_table_relationship_name,
				mapping_line_data,
				mappings_path_position
			} = recursive_payload);
		} else
			table_name = mappings.base_table_name;


		if (
			(
				iterate ||
				mappings_path.length === 0 ||
				mappings_path_position + 1 === mappings_path.length
			) && (
				!generate_last_relationship_data ||
				mappings_path_position + 1 !== mappings_path.length
				//or last part isn't a relationship
			)
		)
			mapping_line_data.push(
				mappings.get_fields_for_table({
					table_name: table_name,
					mappings_path: mappings_path,
					mappings_path_position: mappings_path_position,
					parent_table_name: parent_table_name,
					parent_table_relationship_name: parent_table_relationship_name,
					use_cached: use_cached,
				})
			);


		const next_path_index = mappings_path_position + 1;
		const next_path_element_name = mappings_path[next_path_index];
		if (typeof next_path_element_name !== "undefined") {

			let next_table_name = '';
			let next_parent_table_name = '';
			const next_path_element = mappings.tables[table_name]['fields'][next_path_element_name];

			const next_is_tree_rank = next_path_element_name.substring(0, mappings.reference_symbol.length) === mappings.reference_symbol;
			const next_is_to_many_instance = next_path_element_name.substring(0, mappings.tree_symbol.length) === mappings.tree_symbol;

			if (next_is_tree_rank || next_is_to_many_instance) {
				next_table_name = table_name;
				next_parent_table_name = parent_table_name;
			} else if (typeof next_path_element !== "undefined" && next_path_element['is_relationship']) {
				next_table_name = next_path_element['table_name'];
				next_parent_table_name = table_name;
			}

			if (next_table_name !== '') {
				const new_recursive_payload = {
					table_name: next_table_name,
					parent_table_name: next_parent_table_name,
					parent_table_relationship_name: next_path_element_name,
					mapping_line_data: mapping_line_data,
					mappings_path_position: next_path_index,
				};

				return mappings.get_mapping_line_data_from_mappings_path({
					mappings_path: mappings_path,
					iterate: iterate,
					use_cached: use_cached,
					recursive_payload: new_recursive_payload
				});
			}
		}

		return mapping_line_data;

	},

	get_fields_for_table(payload){

		const {
			table_name,
			mappings_path = [],
			mappings_path_position: original_mappings_path_position = -2,
			parent_table_name = '',
			parent_table_relationship_name = '',
			use_cached = false,
		} = payload;

		const json_payload = JSON.stringify(payload);
		if (use_cached) {
			if (typeof mappings.cached_mappings_line_data[json_payload] !== "undefined")
				return mappings.cached_mappings_line_data[json_payload];
		}

		let mappings_path_position = original_mappings_path_position;

		let mapping_element_type = 'simple';

		if (mappings_path_position === -2)
			mappings_path_position = mappings_path.length - 1;
		const next_mappings_path_position = mappings_path_position + 1;
		const local_mappings_path = mappings_path.slice(0, next_mappings_path_position);
		const next_mapping_path_element = mappings_path[next_mappings_path_position];
		const default_value = (typeof next_mapping_path_element !== "undefined" ? next_mapping_path_element : "0");

		let current_mapping_path_part = mappings_path[mappings_path_position];

		const parent_relationship_type =
			(
				typeof mappings.tables[parent_table_name] !== "undefined" &&
				typeof mappings.tables[parent_table_name]['fields'][parent_table_relationship_name] !== "undefined"
			) ? mappings.tables[parent_table_name]['fields'][parent_table_relationship_name]['type'] : '';
		const children_are_to_many_elements =
			(
				parent_relationship_type === 'one-to-many' ||
				parent_relationship_type === 'many-to-many'
			) &&
			parent_table_relationship_name.substring(0, mappings.reference_symbol.length) !== mappings.reference_symbol;

		const table_ranks = mappings.ranks[table_name];
		const children_are_ranks =
			typeof table_ranks !== "undefined" &&
			parent_table_relationship_name.substring(0, mappings.tree_symbol.length) !== mappings.tree_symbol;

		const mapped_fields = Object.keys(mappings.get_mapped_fields(local_mappings_path));

		const result_fields = {};

		if (children_are_to_many_elements) {

			mapping_element_type = 'to_many';

			if (typeof next_mapping_path_element !== "undefined")
				mapped_fields.push(next_mapping_path_element);

			const max_mapped_element_number = mapped_fields.reduce((max_mapped_element_number, mapped_field) => {
				const mapped_element_number = parseInt(mapped_field.substring(mappings.reference_symbol.length));
				if (mapped_element_number > max_mapped_element_number)
					return mapped_element_number;
				else
					return max_mapped_element_number;
			}, 0);


			for (let i = 1; i <= max_mapped_element_number; i++) {
				const mapped_object_name = mappings.reference_symbol + i;

				result_fields[mapped_object_name] = {
					field_friendly_name: mapped_object_name,
					is_enabled: true,
					is_required: false,
					is_hidden: false,
					is_relationship: true,
					is_default: mapped_object_name === default_value,
					table_name: table_name,
				};
			}
			result_fields['add'] = {
				field_friendly_name: 'Add',
				is_enabled: true,
				is_required: false,
				is_hidden: false,
				is_relationship: true,
				is_default: false,
				table_name: table_name,
			};

		} else if (children_are_ranks) {

			mapping_element_type = 'tree';

			for (const [rank_name, is_required] of Object.entries(table_ranks)) {
				const formatted_rank_name = mappings.tree_symbol + rank_name;
				result_fields[formatted_rank_name] = {
					field_friendly_name: rank_name,
					is_enabled: true,
					is_required: is_required,
					is_hidden: false,
					is_relationship: true,
					is_default: formatted_rank_name === default_value,
					table_name: table_name,
				};
			}

		} else

			for (const [field_name, field_data] of Object.entries(mappings.tables[table_name]['fields'])) {


				const {
					is_relationship,
					type: relationship_type,
					is_hidden, is_required,
					foreign_name,
					friendly_name,
					table_name
				} = field_data;

				if (
					(  // skip circular relationships
						is_relationship &&
						table_name === parent_table_name &&
						typeof foreign_name !== "undefined" &&
						typeof mappings.tables[parent_table_name]['fields'][foreign_name] !== "undefined" &&
						mappings.tables[parent_table_name]['fields'][foreign_name]['foreign_name'] === field_name
					) ||
					(  // skip -to-many inside of -to-many
						is_relationship &&
						relationship_type.indexOf('-to-many') !== -1 &&
						parent_relationship_type.indexOf('-to-many') !== -1
					)
				)
					continue;


				const is_enabled = (// disable field
					(
						mapped_fields.indexOf(field_name) === -1 ||  // if it is mapped
						is_relationship  // or is a relationship
					) && ( //TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
						typeof table_ranks !== "undefined" ||
						field_name !== 'name'
					)
				);


				const is_default = field_name === default_value;

				result_fields[field_name] = {
					field_friendly_name: friendly_name,
					is_enabled: is_enabled,
					is_required: is_required,
					is_hidden: is_hidden,
					is_default: is_default,
					is_relationship: is_relationship,
					table_name: table_name,
				};


			}


		return mappings.cached_mappings_line_data[json_payload] = {
			mapping_element_type: mapping_element_type,
			name: current_mapping_path_part,
			friendly_name: mappings.tables[table_name]['table_friendly_name'],
			table_name: table_name,
			fields_data: result_fields,
		};

	},

	get_all_mapped_fields(include_headers = false){

		if (!include_headers && !mappings.changes_made)
			return mappings.mapped_fields;

		const lines_elements_containers = dom_helper.get_lines(mappings.list__mappings, true);

		const unmapped_path_length = 1 + include_headers;

		return mappings.mapped_fields = lines_elements_containers.reduce((mapped_fields, line_elements_container) => {

			const mappings_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
				include_headers: include_headers
			});

			if (mappings_path.length > unmapped_path_length || mappings_path[0] !== "0")
				mapped_fields.push(mappings_path);

			return mapped_fields;
		}, []);

	},

	get_mappings_tree(include_headers = false){
		if (!include_headers && !mappings.changes_made)
			return mappings.mappings_tree;

		return mappings.mappings_tree = tree_helpers.array_of_mappings_to_mappings_tree(
			mappings.get_all_mapped_fields(include_headers),
			include_headers
		);
	},

	get_mapped_fields(mappings_path_filter){
		return tree_helpers.traverse_tree(
			mappings.get_mappings_tree(),
			tree_helpers.array_to_tree([...mappings_path_filter]),
		);
	},

	get_mappings_path(payload){

		const {
			line_elements_container,
			mapping_path_filter = [],
			include_headers = false,
			exclude_unmapped = false,
			exclude_non_relationship_values = false,
		} = payload;

		const elements = dom_helper.get_line_elements(line_elements_container);

		const mappings_path = [];
		let position = 0;

		const return_path = (path, element) => {

			if (exclude_unmapped && path[path.length - 1] === "0")
				path = [];

			if (exclude_non_relationship_values) {
				const is_relationship = element.getAttribute('data_value_is_relationship') === 'true';

				if (!is_relationship)
					path.pop();
			}

			if (include_headers) {
				const line = line_elements_container.parentElement;
				const line_header = line.getElementsByClassName('wbplanview_mappings_line_header')[0];
				const header_name = line_header.innerText;
				return [...path, header_name];
			}
			return path;
		};

		for (const element of elements) {

			const result_name = element.getAttribute('data-value');

			if (result_name !== null)
				mappings_path.push(result_name);

			if (typeof mapping_path_filter[position] === "string" && result_name !== mapping_path_filter[position])
				return return_path([], element);

			else if (typeof mapping_path_filter === "object" && element === mapping_path_filter)
				return return_path(mappings_path, element);

			position++;

		}

		return return_path(mappings_path);

	},

	/*/!*
	* Turns a mapping path (array) into a friendly mapping path (array)
	* @param {array} path - mapping path
	* @param {array} [friendly_names=[]] - Used by recursion to store intermediate result
	* @param {string} [table_name=''] - Used by recursion to store temporary data
	* *!/
	get_friendly_field_path(path, friendly_names = [], table_name = ''){

		//return result after path is processed
		if (path.length === 0)
			return friendly_names;

		//detects the first execution
		if (friendly_names.length === 0) {
			const base_table_friendly_name = mappings.tables[this.base_table_name]['table_friendly_name'];
			return mappings.get_friendly_field_path(path, [base_table_friendly_name], this.base_table_name);
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
			friendly_names.push(field_data['friendly_name']);
			if (field_data['is_relationship'])
				return mappings.get_friendly_field_path(path, friendly_names, field_data['table_name']);
			else
				return friendly_names;
		}

		//detects a tree
		if (field_name.substr(0, this.tree_symbol.length) === this.tree_symbol) {
			const new_rank_name = field_name.substr(this.tree_symbol.length);
			friendly_names.push(new_rank_name);
			return mappings.get_friendly_field_path(path, friendly_names, table_name);
		}

	},*/


	//CHANGE CALLBACKS

	custom_select_change_event(custom_select_change_payload){

		const {
			changed_list,
			selected_option,
			new_value,
			previous_value,
			previous_previous_value,
			is_relationship,
			list_type,
			custom_select_type
		} = custom_select_change_payload;

		const line_elements_container = changed_list.parentElement;

		const list_table_name = changed_list.getAttribute('data-table');

		let need_to_add_block = false;
		let previous_value_is_relationship = true;

		if (list_type === "to_many") {

			//add new -to-many element
			if (new_value === 'add') {

				const previous_element = selected_option.previousElementSibling;
				let last_index = 0;
				if (previous_element.classList.contains('custom_select_option')) {
					const last_index_string = selected_option.previousElementSibling.getAttribute('data-value');
					last_index = parseInt(last_index_string.substr(mappings.reference_symbol.length));
				}

				const new_index = last_index + 1;
				const new_option_name = mappings.reference_symbol + new_index;

				const option_data = {
					option_name: new_option_name,
					option_value: new_option_name,
					is_enabled: true,
					is_relationship: true,
					is_default: false,
					table_name: list_table_name,
				};

				mappings.custom_select_element.add_option(changed_list, -2, option_data, true);

				mappings.changes_made = true;

			}

			//add block to the right if there aren't any
			need_to_add_block = changed_list.nextElementSibling === null;

		} else {

			const remove_block_to_the_right = //remove all elements to the right
				list_type === 'simple' || //if the list is not a `tree` and not a `to_many`
				new_value === '0'; // or if list's value is unset;
			if (remove_block_to_the_right)
				while (changed_list.nextElementSibling !== null) {
					changed_list.nextElementSibling.remove();
					mappings.changes_made = true;
				}

			previous_value_is_relationship =
				list_type !== 'simple' ||
				(
					previous_value !== "0" &&
					mappings.tables[list_table_name]['fields'][previous_value]['is_relationship']
				);

			//add block to the right if selected field is a relationship
			need_to_add_block = remove_block_to_the_right && is_relationship;

		}

		const mappings_path = mappings.get_mappings_path({
			line_elements_container: line_elements_container,
			mapping_path_filter: changed_list,
		});

		if (need_to_add_block) {
			mappings.changes_made = true;

			const new_line_element = document.createElement('span');
			line_elements_container.appendChild(new_line_element);

			const last_element_is_not_relationship = changed_list.getAttribute('data_value_is_relationship') === 'false';
			const trimmed_mappings_path = [...mappings_path];
			if (last_element_is_not_relationship)
				trimmed_mappings_path.pop();

			const mapping_details = mappings.get_mapping_line_data_from_mappings_path({
				mappings_path: trimmed_mappings_path,
				iterate: false,
				use_cached: true
			})[0];
			new_line_element.outerHTML = html_generator.mapping_element(mapping_details, custom_select_type, true);
			mappings.custom_select_element.resize_elements(
				[line_elements_container.children[line_elements_container.children.length - 1]]
			);
		}

		//update fields that match certain mappings path's
		mappings_path.pop();
		const paths_to_update = [
			mappings_path,
		];

		if (is_relationship)
			paths_to_update.push([...mappings_path, new_value]);

		if (list_type === "to_many" && new_value === 'add')
			paths_to_update.push([...mappings_path, previous_previous_value]);

		else if (previous_value_is_relationship)
			paths_to_update.push([...mappings_path, previous_value]);

		mappings.deduplicate_mappings();

		mappings.update_all_lines(paths_to_update);
	},

	clear_line(wbplanview_mappings_line_delete){

		const line = wbplanview_mappings_line_delete.closest('.wbplanview_mappings_line');

		const base_table_fields = [mappings.get_fields_for_table({
			table_name: this.base_table_name,
			use_cached: true,
		})];

		const line_elements_container = dom_helper.get_line_elements_container(line);
		const mappings_path = mappings.get_mappings_path({
			line_elements_container: line_elements_container,
			exclude_unmapped: true,
		});
		line_elements_container.innerHTML = html_generator.mapping_path(base_table_fields, 'closed_list', true);

		mappings.changes_made = true;
		mappings.update_all_lines(mappings_path);

	},

	mapping_view_map_button_callback(){

		//find selected line
		const lines = dom_helper.get_lines(mappings.list__mappings);
		let selected_line;

		for (const line of lines)
			if (line.classList.contains('wbplanview_mappings_line_focused')) {
				selected_line = line;
				break;
			}


		//don't do anything if no line is selected
		if (typeof selected_line === "undefined")
			return;


		//don't map the last node if it is already mapped
		//e.g convert `Accession > Accession Number` to `Accession`  if `Accession Number` is a field and is mapped
		const is_mapped = !mappings.custom_select_element.is_selected_option_enabled(
			mappings.mapping_view.childNodes[mappings.mapping_view.childNodes.length - 1]
		);

		//implement the mapping path on the selected field
		const mappings_path = mappings.get_mappings_path({
			line_elements_container: mappings.mapping_view
		});

		if (is_mapped)
			mappings_path.pop();

		const mapping_line_data = mappings.get_mapping_line_data_from_mappings_path({
			mappings_path: mappings_path,
			use_cached: true,
		});
		const select_line_elements_container = dom_helper.get_line_elements_container(selected_line);

		const previous_mapping_path = mappings.get_mappings_path({
			line_elements_container: select_line_elements_container,
			include_headers: false,
			exclude_unmapped: true,
			exclude_non_relationship_values: true,
		});

		select_line_elements_container.innerHTML = html_generator.mapping_path(mapping_line_data, 'closed_list', true);

		mappings.update_all_lines([mappings_path, previous_mapping_path]);

	},

	//HELPERS

	update_all_lines(mapping_path_filter = null){

		new Promise((resolve) => {
			const lines = dom_helper.get_lines(mappings.list__mappings, true);

			//don't update the mapping view if it is hidden
			if (!mappings.hide_mapping_view)
				lines.push(mappings.mapping_view);

			let filters;
			if (mapping_path_filter !== null && typeof mapping_path_filter[0] === "string")
				filters = [mapping_path_filter];
			else if (mapping_path_filter !== null && typeof mapping_path_filter[0] !== "undefined" && mapping_path_filter[0].constructor === Array)
				filters = mapping_path_filter;
			else
				filters = [mapping_path_filter];

			for (const filter of filters)
				for (const line of lines)
					mappings.update_line(line, mapping_path_filter);

			resolve();

		});

	},

	update_line(line_elements_container, filter_mapping_path = null){

		new Promise((resolve) => {
			const mapping_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
			});
			const select_elements = dom_helper.get_line_elements(line_elements_container);

			const update_mapped_fields = (select_element, mapped_fields) => {
				mappings.custom_select_element.enable_disabled_options(select_element);
				for (const mapped_field of Object.keys(mapped_fields))
					mappings.custom_select_element.toggle_option(select_element, mapped_field, 'disable');
			};

			if (filter_mapping_path === null)
				for (const [position, select_element] of select_elements.entries()) {
					const local_mapping_path = mapping_path.slice(0, position);
					const mapped_fields = mappings.get_mapped_fields(local_mapping_path);
					update_mapped_fields(select_element, mapped_fields);
				}

			else {

				const intersection_point = helper.find_array_divergence_point(mapping_path, filter_mapping_path);
				if (intersection_point === -1) {
					resolve();
					return;
				}

				const mapped_fields = mappings.get_mapped_fields(filter_mapping_path);
				const target_select_element = select_elements[intersection_point];
				update_mapped_fields(target_select_element, mapped_fields);

				if (target_select_element.getAttribute('data-type') === 'to_many') {
					const options = target_select_element.getElementsByClassName('custom_select_option');
					const option_values = Object.values(options).map(option => option.getAttribute('data-value'));
					let max_value = mappings.get_max_to_many_value(option_values);
					const max_mapped_value = mappings.get_max_to_many_value(Object.keys(mapped_fields));

					max_value++;
					while (max_mapped_value >= max_value) {

						const new_option_name = mappings.reference_symbol + max_value;
						const list_table = target_select_element.getAttribute('data-table');

						const option_data = {
							option_name: new_option_name,
							option_value: new_option_name,
							is_enabled: true,
							is_relationship: true,
							is_default: false,
							table_name: list_table,
						};

						mappings.custom_select_element.add_option(target_select_element, -2, option_data, false);

						max_value++;

					}
				}


			}

			resolve();

		});

	},

	get_max_to_many_value(values){
		return values.reduce((max, value) => {

			//skip `add` values and other possible NaN cases
			if (value.substr(0, mappings.reference_symbol.length) !== mappings.reference_symbol)
				return max;

			const number = parseInt(value.substr(mappings.reference_symbol.length));

			if (number > max)
				return number;

			return max;

		}, 0);
	},

	focus_line(line){

		//deselect all lines
		const lines = dom_helper.get_lines(mappings.list__mappings);
		for (const mapping_line of lines)
			if (mapping_line !== line)
				mapping_line.classList.remove('wbplanview_mappings_line_focused');


		//select the current line
		line.classList.add('wbplanview_mappings_line_focused');


		//don't update the mapping view if it is hidden
		if (mappings.hide_mapping_view)
			return;

		mappings.update_mapping_view(line);

	},

	update_mapping_view(line = false){

		if (!line)
			line = dom_helper.get_lines(mappings.list__mappings).filter(mapping_line => mapping_line.classList.contains('wbplanview_mappings_line_focused'));

		let mappings_path = [];
		if (line.length !== 0) {//get mapping path
			const line_elements_container = dom_helper.get_line_elements_container(line);
			mappings_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
			});
		}

		//if line is mapped, update the mapping view
		if (mappings_path[mappings_path.length - 1] !== "0") {
			const mapping_line_data = mappings.get_mapping_line_data_from_mappings_path({
				mappings_path: mappings_path,
			});
			mappings.mapping_view.innerHTML = html_generator.mapping_view(mapping_line_data);
		}

	},

	format_validation_results(validation_results){

		return 'The following fields should be mapped before you are able to upload the dataset:<br>' +
			'<div class="list_of_mappings">' +
			(
				validation_results.map(field_path =>
					'<div class="wbplanview_mappings_line_elements">' +
					mappings.get_html_generator().mapping_path(
						mappings.get_mapping_line_data_from_mappings_path({
							mappings_path: field_path,
							use_cached: true,
							generate_last_relationship_data: false,
						}),
						'preview_list',
						true
					) +
					'</div>'
				).join('')
			) +
			'</div>' +
			'<br>Are you sure you want to save the mapping anyway?';

	},

	deduplicate_mappings(){

		const array_of_mappings = mappings.get_all_mapped_fields();
		const duplicate_mapping_indexes = helper.find_duplicate_mappings(array_of_mappings);
		const lines = dom_helper.get_lines(mappings.list__mappings, true);

		let index = -1;
		for (const line of lines) {

			index++;

			if (duplicate_mapping_indexes.indexOf(index) === -1)
				continue;

			const line_elements = dom_helper.get_line_elements(line);
			const last_custom_select = line_elements.pop();

			this.custom_select_element.change_selected_option(last_custom_select, '0');

		}

	},
};

module.exports = mappings;
