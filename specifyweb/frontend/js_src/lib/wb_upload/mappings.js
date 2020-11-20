"use strict";

const tree_helpers = require('./tree_helpers.js');
const dom_helper = require('./dom_helper.js');
const helper = require('./helper.js');
const html_generator = require('./html_generator.js');
const navigation = require('../navigation.js');
const data_model = require('./data_model.js');
const auto_mapper = require('./auto_mapper.js');
const custom_select_element = require('./custom_select_element.js');
const upload_plan_converter = require('./upload_plan_converter.js');

const mappings = {

	max_suggestions_count: 3, // the maximum number of suggestions to show in the suggestions box


	// SETTERS

	/* Select table
	* */
	set_table(
		/* string */ table_name,  // the name of the table to set
		/* array */ headers_to_shadow_define = []  // a list of headers that would be fully defined at a later pointer
	){

		new Promise((resolve) => {

			const loaded = mappings.loading_screen();

			this.title__table_name.innerText = data_model.tables[table_name]['table_friendly_name'];

			data_model.base_table_name = table_name;

			this.tree = {};
			this.changes_made = true;
			this.validation_results.innerHTML = '';
			this.validation_results.classList.add('hidden');

			const base_table_fields = mappings.get_mapping_line_data_from_mappings_path({
				mappings_path: [],
				use_cached: true,
			});
			mappings.mapping_view.innerHTML = html_generator.mapping_view(base_table_fields, true);

			navigation.addUnloadProtect(this, "This mapping has not been saved.");

			if (mappings.need_to_define_lines) {
				mappings.need_to_define_lines = false;

				const result_lines = [];
				for (const header of data_model.headers) {

					const mapping_line_data = {
						line_data: base_table_fields,
						header_data: {
							mapping_type: 'existing_header',
							header_name: header,
						},
					};

					if (headers_to_shadow_define.indexOf(header) !== -1)
						mapping_line_data['line_data'] = [];

					const mapping_line_html = html_generator.mapping_line(mapping_line_data, true);

					result_lines.push(mapping_line_html);

				}

				mappings.list__mappings.innerHTML = result_lines.join('');

			}

			if (mappings.need_to_run_automapper) {
				const mappings_object = auto_mapper.map({
					headers: data_model.headers,
					base_table: data_model.base_table_name,
					scope: 'automapper',
				});
				const array_of_mappings = mappings_object.map(([header_name, mapping_path]) =>
					[...mapping_path, 'existing_header', header_name]
				);
				this.need_to_run_auto_mapper = false;
				mappings.implement_array_of_mappings(array_of_mappings);
			}

			resolve();

			this.container.classList.add('table_selected');

			loaded();

		});

	},

	/*
	* Sets a lit of headers
	* */
	set_headers(
		/* array */ headers = [],  // list of headers as strings
		/* object */ upload_plan = false,  // upload plan as an object or {bool} false for none
		/* boolean */ headers_defined = true  // whether CSV file had headers in the first line
	){

		//remove all existing lines
		mappings.list__mappings.innerHTML = '';


		tree_helpers.raw_headers = headers;
		data_model.headers = headers;

		if (upload_plan !== false) {

			let mappings_tree = '';
			const {baseTableName: base_table_name} = upload_plan;

			mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree(upload_plan);
			const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree);

			const defined_headers = [];
			for (const mapping_path of array_of_mappings) {
				const [mapping_type, header_name] = helper.deconstruct_mapping_path(mapping_path, true).slice(-2);
				if (mapping_type === 'existing_header')
					defined_headers.push(header_name);
			}

			mappings.set_table(base_table_name, defined_headers);
			mappings.implement_array_of_mappings(array_of_mappings);
		}
		else
			mappings.need_to_define_lines = true;

		mappings.need_to_run_automapper = headers_defined && upload_plan === false;
		mappings.new_column_index = 0;

	},

	/*
	* Resets the currently mapped fields and presents the option to chose base table again
	* */
	reset_table(){

		if (typeof data_model.base_table_name === "undefined")
			return;

		this.container.classList.remove('table_selected');
		this.title__table_name.innerText = '';

		this.list__mappings.innerHTML = '';

		data_model.base_table_name = undefined;

		navigation.removeUnloadProtect(this);

		mappings.need_to_define_lines = true;
		mappings.need_to_run_auto_mapper = true;

	},


	// FUNCTIONS

	/*
	* Implements array of mappings
	* */
	implement_array_of_mappings(
		/* array */ array_of_mappings  // array of mapping_path's (with mapping types and header names / static column values)
	){

		if (array_of_mappings.length === 0)
			return false;

		Object.values(array_of_mappings).map(mappings_path => {
			const [parsed_mappings_path, mapping_type, header_name] = helper.deconstruct_mapping_path(mappings_path, true);
			const header_data = {
				mapping_type: mapping_type,
				header_name: header_name,
			};
			mappings.add_new_mapping_line({
				mappings_path: parsed_mappings_path,
				header_data: header_data
			});
		});

		this.changes_made = true;
		mappings.update_all_lines();

	},

	/*
	* Adds new mapping line
	* */
	add_new_mapping_line(
		/* object */ payload  // object structure in the method description
	){

		const {
			/* int */ position = -1, // position of the new line. If negative, start from the back
			/* array */ mappings_path = [], // mapping path to use for the new mapping line
			/* object */ header_data, // {'mapping_type':<mapping_type>,{'header_name'}:<header_name>} where mapping_type is `existing_header`/`new_column`/`new_static_column` and header_name is the value of the static column or the name of the header
			/* boolean */ blind_add_back = false, // whether to add to the back without checking if the header already exists
			/* array */ line_attributes = [], // array of classes to append to each line's classname
			/* boolean */ scroll_down = false // whether to scroll the list of mapping lines down to make the newly created line visible on the screen
		} = payload;

		const lines = dom_helper.get_lines(mappings.list__mappings);

		const line_data = mappings.get_mapping_line_data_from_mappings_path({
			mappings_path: mappings_path,
			use_cached: true,
		});

		if (header_data['mapping_type'] === 'new_column' && header_data['header_name'] === '') {
			mappings.new_column_index++;
			header_data['header_name'] = `New Column ${mappings.new_column_index}`;
		}

		const mapping_line_data = {
			line_data: line_data,
			header_data: header_data,
			line_attributes: line_attributes,
		};

		let new_mapping_line;

		if (blind_add_back) {
			new_mapping_line = document.createElement('div');
			mappings.list__mappings.appendChild(new_mapping_line);
		}
		else {
			//before adding a header, check if it is already present
			const {header_name} = header_data;
			const header_index = data_model.headers.indexOf(header_name);
			new_mapping_line = lines[header_index];

			//find position for the new header
			if (typeof new_mapping_line === "undefined") {

				new_mapping_line = document.createElement('div');

				let final_position = position;
				if (position < -1)
					final_position = lines.length + 1 + position;

				if (final_position >= lines.length)
					mappings.list__mappings.appendChild(new_mapping_line);
				else
					mappings.list__mappings.insertBefore(new_mapping_line, lines[final_position]);

			}
		}

		if (// scroll down if told to and new line is not visible
			scroll_down &&
			mappings.list__mappings.offsetHeight < new_mapping_line.offsetTop + new_mapping_line.offsetHeight
		)
			mappings.list__mappings.scrollTop = new_mapping_line.offsetTop - new_mapping_line.offsetHeight;

		new_mapping_line.outerHTML = html_generator.mapping_line(mapping_line_data, true);

		mappings.update_all_lines(mappings_path);

	},


	// GETTERS

	/*
	* Returns mapping line data from mappings path
	* @return {array} list of mapping element data objects
	* */
	get_mapping_line_data_from_mappings_path(
		/* object*/ payload  // described in the method definition
	){

		const {
			mappings_path = [],  // {array} the mapping path
			iterate = true,  // {bool} if False, returns data only for the last element of the mapping path only, Else returns data for each mapping path part
			use_cached = false, // {bool} whether to use cache if exists
			generate_last_relationship_data = true, // {bool} whether to generate data for the last element of the mapping path if the last element is a relationship
		} = payload;

		const internal_payload = {
			mappings_path: mappings_path,
			generate_last_relationship_data: generate_last_relationship_data,
			mappings_path_position: -1,
			iterate: iterate,
			mapping_line_data: [],
		};

		const callbacks = {

			iterate: internal_payload =>
				(
					internal_payload.iterate ||
					internal_payload.mappings_path.length === 0 ||
					internal_payload.mappings_path_position + 1 === internal_payload.mappings_path.length
				) && (
					internal_payload.generate_last_relationship_data ||
					internal_payload.mappings_path_position + 1 !== internal_payload.mappings_path.length
				),

			get_next_path_element(internal_payload, callback_payload){

				if (internal_payload.mappings_path_position === -2)
					internal_payload.mappings_path_position = internal_payload.mappings_path.length - 1;

				internal_payload.mappings_path_position++;

				const {table_name} = callback_payload;
				const next_path_element_name = internal_payload.mappings_path[internal_payload.mappings_path_position];

				if (typeof next_path_element_name == "undefined")
					return undefined;

				let next_real_path_element_name;
				if (data_model.value_is_tree_rank(next_path_element_name) || data_model.value_is_reference_item(next_path_element_name))
					next_real_path_element_name = internal_payload.mappings_path[internal_payload.mappings_path_position - 1];
				else
					next_real_path_element_name = next_path_element_name;

				return {
					next_path_element_name: next_path_element_name,
					next_path_element: data_model.tables[table_name]['fields'][next_path_element_name],
					next_real_path_element_name: next_real_path_element_name,
				};

			},

			navigator_instance_pre(internal_payload){

				internal_payload.mapping_element_type = 'simple';

				const local_mappings_path = internal_payload.mappings_path.slice(0, internal_payload.mappings_path_position + 1);
				internal_payload.next_mapping_path_element = internal_payload.mappings_path[internal_payload.mappings_path_position + 1];
				internal_payload.default_value = (typeof internal_payload.next_mapping_path_element !== "undefined" ? internal_payload.next_mapping_path_element : "0");

				internal_payload.current_mapping_path_part = internal_payload.mappings_path[internal_payload.mappings_path_position];
				internal_payload.result_fields = {};
				internal_payload.mapped_fields = Object.keys(mappings.get_mapped_fields(local_mappings_path));
			},

			handle_to_many_children(internal_payload, callback_payload){

				const {table_name} = callback_payload;

				internal_payload.mapping_element_type = 'to_many';

				if (typeof internal_payload.next_mapping_path_element !== "undefined")
					internal_payload.mapped_fields.push(internal_payload.next_mapping_path_element);

				const max_mapped_element_number = data_model.get_max_to_many_value(internal_payload.mapped_fields);

				for (let i = 1; i <= max_mapped_element_number; i++) {
					const mapped_object_name = data_model.format_reference_item(i);

					internal_payload.result_fields[mapped_object_name] = {
						field_friendly_name: mapped_object_name,
						is_enabled: true,
						is_required: false,
						is_hidden: false,
						is_relationship: true,
						is_default: mapped_object_name === internal_payload.default_value,
						table_name: table_name,
					};
				}
				internal_payload.result_fields['add'] = {
					field_friendly_name: 'Add',
					is_enabled: true,
					is_required: false,
					is_hidden: false,
					is_relationship: true,
					is_default: false,
					table_name: table_name,
				};

			},

			handle_tree_ranks(internal_payload, callback_payload){

				const {table_name} = callback_payload;

				internal_payload.mapping_element_type = 'tree';

				const table_ranks = data_model.ranks[table_name];
				for (const [rank_name, is_required] of Object.entries(table_ranks)) {
					const formatted_rank_name = data_model.format_tree_rank(rank_name);
					internal_payload.result_fields[formatted_rank_name] = {
						field_friendly_name: rank_name,
						is_enabled: true,
						is_required: is_required,
						is_hidden: false,
						is_relationship: true,
						is_default: formatted_rank_name === internal_payload.default_value,
						table_name: table_name,
					};
				}

			},

			handle_simple_fields(internal_payload, callback_payload){

				const {
					table_name,
					parent_table_name,
					parent_relationship_type,
				} = callback_payload;

				for (const [field_name, field_data] of Object.entries(data_model.tables[table_name]['fields'])) {

					const {
						is_relationship,
						type: relationship_type,
						is_hidden,
						is_required,
						foreign_name,
						friendly_name,
						table_name: field_table_name
					} = field_data;

					if (
						is_relationship &&
						(  // skip circular relationships
							field_table_name === parent_table_name &&
							(
								(
									typeof foreign_name !== "undefined" &&
									typeof data_model.tables[parent_table_name]['fields'][foreign_name] !== "undefined" &&
									data_model.tables[parent_table_name]['fields'][foreign_name]['foreign_name'] === field_name
								) ||
								(
									data_model.tables[table_name]['fields'][field_name]['foreign_name'] === internal_payload.current_mapping_path_part
								)
							)
						) ||
						(  // skip -to-many inside of -to-many  //TODO: remove this once upload plan is ready
							typeof relationship_type !== "undefined" &&
							typeof parent_relationship_type !== "undefined" &&
							data_model.relationship_is_to_many(relationship_type) &&
							data_model.relationship_is_to_many(parent_relationship_type)
						)
					)
						continue;


					const is_enabled = // disable field
						internal_payload.mapped_fields.indexOf(field_name) === -1 ||  // if it is mapped
						is_relationship;  // or is a relationship


					const is_default = field_name === internal_payload.default_value;

					internal_payload.result_fields[field_name] = {
						field_friendly_name: friendly_name,
						is_enabled: is_enabled,
						is_required: is_required,
						is_hidden: is_hidden,
						is_default: is_default,
						is_relationship: is_relationship,
						table_name: field_table_name,
					};


				}

			},

			get_instance_data(internal_payload, callback_payload){

				const {table_name} = callback_payload;

				return {
					mapping_element_type: internal_payload.mapping_element_type,
					name: internal_payload.current_mapping_path_part,
					friendly_name: data_model.tables[table_name]['table_friendly_name'],
					table_name: table_name,
					fields_data: internal_payload.result_fields,
				};

			},

			commit_instance_data(internal_payload, callback_payload){
				internal_payload.mapping_line_data.push(callback_payload.data);
				return callback_payload.data;
			},

			get_final_data: internal_payload =>
				internal_payload.mapping_line_data,
		};

		return data_model.navigator({
			callbacks: callbacks,
			internal_payload: internal_payload,
			config: {
				use_cache: use_cached,
				cache_name: 'mapping_line_data',
				base_table_name: data_model.base_table_name,
			}
		});

	},

	/*
	* Returns array of mapping_paths
	* @return {array} array of mappings paths
	* */
	get_array_of_mappings(
		/* boolean */ include_headers = false,  // whether each mapping path should also have mapping type and header name at the end
		/* boolean */ skip_empty = true  // whether to skip incomplete mapping paths
	){

		if (!include_headers && !mappings.changes_made) {
			mappings.changes_made = false;
			return mappings.mapped_fields;
		}

		let index_shift = 1;
		if (include_headers)
			index_shift += 2;

		const line_elements_containers = dom_helper.get_lines(mappings.list__mappings, true);

		const results = mappings.mapped_fields = line_elements_containers.reduce((mapped_fields, line_elements_container) => {

			const mappings_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
				include_headers: include_headers
			});

			const is_finished = mappings_path[mappings_path.length - index_shift] !== "0";

			if (!is_finished && !skip_empty)
				mappings_path.pop();

			if (is_finished || !skip_empty)
				mapped_fields.push(mappings_path);

			return mapped_fields;
		}, []);

		if (skip_empty)
			return results;
		else // make results distinct
			return Array.from(new Set(results.map(JSON.stringify))).map(JSON.parse);

	},

	/*
	* Returns a mappings tree
	* @return {object} mappings tree
	* */
	get_mappings_tree(
		/* boolean */ include_headers = false,  // whether the last tree nodes of each branch should be mapping type and header name
		/* boolean */ skip_empty = true  // whether to include incomplete tree nodes
	){
		if (!include_headers && !mappings.changes_made)
			return mappings.mappings_tree;

		return mappings.mappings_tree = tree_helpers.array_of_mappings_to_mappings_tree(
			mappings.get_array_of_mappings(include_headers, skip_empty),
			include_headers
		);
	},

	/*
	* Get a mappings tree branch given a particular starting mappings path
	* @return {object} mappings tree starting from a given a particular starting mappings path
	* */
	get_mapped_fields(
		/* array */ mappings_path_filter,  // a mappings path that would be used as a filter
		/* boolean */ skip_empty = true  // whether to skip incomplete mappings
	){
		return tree_helpers.traverse_tree(
			mappings.get_mappings_tree(false, skip_empty),
			tree_helpers.array_to_tree([...mappings_path_filter]),
		);
	},

	/*
	* Returns a mappings path for a particular line elements container
	* @return {array} mappings path
	* */
	get_mappings_path(
		/* object */ payload  // described in the method definition
	){

		const {
			line_elements_container,  // {DOMElement} line elements container
			mapping_path_filter = [], // {mixed}
										// if is {array} mappings path and mappings path of this line does begin with mappings_path_filter, get_mappings_path would return ["0"]
										// if is {DOMElement}, then stops when reaches a given element in a line_elements_container
			include_headers = false,  // whether to include mapping type and header_name / static column value in the result
			exclude_unmapped = false, // whether to replace incomplete mappings paths with ["0"]
			exclude_non_relationship_values = false, // whether to exclude simple fields from the resulting path
		} = payload;

		const elements = dom_helper.get_line_elements(line_elements_container);

		const mappings_path = [];
		let position = 0;

		const return_path = (path, element) => {

			if (exclude_unmapped && path[path.length - 1] === "0")
				path = [];

			else if (path.length === 0)
				path = ["0"];


			if (exclude_non_relationship_values) {
				const is_relationship =
					typeof element === "undefined" ||
					custom_select_element.element_is_relationship(element);

				if (!is_relationship)
					path.pop();
			}

			if (include_headers) {
				const line = line_elements_container.parentElement;
				const line_header_element = dom_helper.get_line_header_element(line);
				const header_name = dom_helper.get_line_header_name(line_header_element);
				const mapping_type = dom_helper.get_line_mapping_type(line_header_element);
				return [...path, mapping_type, header_name];
			}

			return path;
		};

		for (const element of elements) {

			const result_name = custom_select_element.get_list_value(element);

			if (result_name !== null)
				mappings_path.push(result_name);

			if (typeof mapping_path_filter[position] === "string" && result_name !== mapping_path_filter[position])
				return return_path([], element);

			else if (typeof mapping_path_filter === "object" && element === mapping_path_filter)
				return return_path(mappings_path, element);

			position++;

		}

		return return_path(mappings_path, elements[elements.length - 1]);

	},


	//CHANGE CALLBACKS

	/*
	* Handles a change to the select element value
	* */
	custom_select_change_event(
		/* object */ custom_select_change_payload  // described in the method definition
	){

		const {
			/* DOMElement */ changed_list,  // the list that was changed
			/* DOMElement */ selected_option, // the option that was changed
			/* string */ new_value,  // the new value of the list
			/* boolean */ is_relationship, // whether new value is a relationship
			/* string */ list_type, // the type of the changed list
			/* string */ custom_select_type, // the type of the custom select element
			/* string */ list_table_name, // the name of the table the list belongs too
		} = custom_select_change_payload;

		const line_elements_container = changed_list.parentElement;

		if (list_type === 'list_of_tables')
			return mappings.set_table(new_value);
		else if (list_type === 'suggested_mapping') {

			const mapping_line_data = mappings.get_mapping_line_data_from_mappings_path({
				mappings_path: new_value.split(data_model.path_join_symbol),
			});

			line_elements_container.innerHTML = html_generator.mapping_path(mapping_line_data);

			return;

		}

		if (list_type === "to_many") {

			//add new -to-many element
			if (new_value === 'add') {

				const previous_element = selected_option.previousElementSibling;
				let last_index = 0;
				if (previous_element.classList.contains('custom_select_option')) {
					const last_index_string = custom_select_element.get_option_value(selected_option.previousElementSibling);
					last_index = data_model.get_index_from_reference_item_name(last_index_string);
				}

				const new_index = last_index + 1;
				const new_option_name = data_model.format_reference_item(new_index);

				const option_data = {
					option_name: new_option_name,
					option_value: new_option_name,
					is_enabled: true,
					is_relationship: true,
					is_default: false,
					table_name: list_table_name,
				};

				custom_select_element.add_option(changed_list, -2, option_data, true);

				mappings.changes_made = true;

			}

		}
		else {

			const remove_block_to_the_right = //remove all elements to the right
				list_type === 'simple' || //if the list is not a `tree` and not a `to_many`
				new_value === '0'; // or if list's value is unset;
			if (remove_block_to_the_right && dom_helper.remove_elements_to_the_right(changed_list))
				mappings.changes_made = true;

		}

		const mappings_path = mappings.get_mappings_path({
			line_elements_container: line_elements_container,
			mapping_path_filter: changed_list,
		});


		//add block to the right if there aren't any and selected field is a relationship
		if (!dom_helper.has_next_sibling(changed_list) && is_relationship) {
			mappings.changes_made = true;

			const new_line_element = document.createElement('span');
			line_elements_container.appendChild(new_line_element);

			const last_element_is_not_relationship = !custom_select_element.element_is_relationship(changed_list);
			const trimmed_mappings_path = [...mappings_path];
			if (last_element_is_not_relationship)
				trimmed_mappings_path.pop();

			const mapping_details = mappings.get_mapping_line_data_from_mappings_path({
				mappings_path: trimmed_mappings_path,
				iterate: false,
				use_cached: true
			})[0];
			new_line_element.outerHTML = html_generator.mapping_element(mapping_details, custom_select_type, true);
		}

		mappings.deduplicate_mappings();
		mappings_path.pop();
		mappings.update_all_lines(mappings_path);

		if (custom_select_type === 'closed_list')
			mappings.update_mapping_view(line_elements_container.parentElement);

	},

	/*
	* Unmap a particular header
	* */
	clear_line(
		/* DOMElement */ wbplanview_mappings_line_delete  // the `Delete` button that belongs to a particular line
	){

		const line = wbplanview_mappings_line_delete.closest('.wbplanview_mappings_line');

		const base_table_fields = mappings.get_mapping_line_data_from_mappings_path({
			mappings_path: [],
			use_cached: true,
		});

		const line_elements_container = dom_helper.get_line_elements_container(line);
		const mappings_path = mappings.get_mappings_path({
			line_elements_container: line_elements_container,
			exclude_unmapped: true,
		});
		line_elements_container.innerHTML = html_generator.mapping_path(base_table_fields, 'closed_list', true);

		mappings.changes_made = true;
		mappings.update_all_lines(mappings_path);

	},

	/*
	* The callback for when the `Map` button on the mapping view is pressed
	* */
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
		const is_mapped = !custom_select_element.is_selected_option_enabled(
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

	/*
	* Enables or disables the options and adds or removes -to-many extra -to-many reference items in all matching elements on all lines
	* */
	update_all_lines(
		/* array */ mapping_path_filter = null  // updates elements in the line only if their relative mappings path begins with mapping_path_filter
	){

		new Promise((resolve) => {
			resolve();

			const lines = dom_helper.get_lines(mappings.list__mappings, true);

			//update the mapping view too if it is not hidden
			if (!mappings.hide_mapping_view)
				lines.push(mappings.mapping_view);

			let filters;
			if (mapping_path_filter !== null && typeof mapping_path_filter[0] !== "undefined" && mapping_path_filter[0].constructor === Array)
				filters = mapping_path_filter;
			else
				filters = [mapping_path_filter];

			for (const filter of filters)
				for (const line of lines)
					mappings.update_line(line, filter);

		});

	},

	/*
	* Enables or disables the options and adds or removes -to-many extra -to-many reference items in all matching elements in the current line
	* */
	update_line(
		/* DOMElement */ line_elements_container,  // the line elements container whose elements would be updated
		/* array */ filter_mapping_path = null  // updates elements in the line only if their relative mappings path begins with mapping_path_filter
	){

		new Promise((resolve) => {

			resolve();

			const mapping_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
			});
			const select_elements = dom_helper.get_line_elements(line_elements_container);

			if (select_elements.length === 0)
				return;

			const update_element = (target_select_element, mapping_path, position) => {


				const local_mapping_path = mapping_path.slice(0, position);
				const mapped_fields = Object.keys(mappings.get_mapped_fields(local_mapping_path, false));

				if (custom_select_element.get_list_mapping_type(target_select_element) === 'to_many') {

					const options = target_select_element.getElementsByClassName('custom_select_option');
					const option_values = Object.values(options).map(option => custom_select_element.get_option_value(option));
					let max_value = data_model.get_max_to_many_value(option_values) + 1;
					const max_mapped_value = data_model.get_max_to_many_value(mapped_fields);

					for (; max_mapped_value >= max_value; max_value++) {

						const new_option_name = data_model.format_reference_item(max_value);
						const list_table = custom_select_element.get_list_table_name(target_select_element);

						const option_data = {
							option_name: new_option_name,
							option_value: new_option_name,
							is_enabled: true,
							is_relationship: true,
							is_default: false,
							table_name: list_table,
						};

						custom_select_element.add_option(target_select_element, -2, option_data, false);

					}
				}

				else {
					custom_select_element.enable_disabled_options(target_select_element);
					for (const mapped_field of mapped_fields)
						custom_select_element.toggle_option(target_select_element, mapped_field, 'disable');
				}

			};

			if (filter_mapping_path === null)
				for (const [position, select_element] of select_elements.entries())
					update_element(select_element, mapping_path, position);

			else {

				const intersection_point = helper.find_array_divergence_point(mapping_path, filter_mapping_path);
				if (intersection_point !== -1)
					for (let index = intersection_point; index < mapping_path.length; index++)
						update_element(select_elements[index], mapping_path, index);


			}

		});

	},

	/*
	* Adds a focus outline to a given line
	* */
	focus_line(
		/* DOMElement */ line  // the line to be focused
	){

		const lines = dom_helper.get_lines(mappings.list__mappings);

		// don't do anything if selected line is already focused
		const selected_lines = lines.filter(mapping_line =>
			mapping_line.classList.contains('wbplanview_mappings_line_focused')
		);
		if (selected_lines.length === 1 && selected_lines[0] === line)
			return;

		//deselect all lines
		for (const mapping_line of selected_lines)
			if (mapping_line !== line)
				mapping_line.classList.remove('wbplanview_mappings_line_focused');


		//select the current line
		line.classList.add('wbplanview_mappings_line_focused');

		//don't update the mapping view if it is hidden
		if (mappings.hide_mapping_view)
			return;

		mappings.update_mapping_view(line);

	},

	/*
	* Update the mapping view with the mapping path from a given line
	* */
	update_mapping_view(
		/* DOMElement */ line = false  // the line to be used as a source for mapping path
	){

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

	/*
	* Formats validation results
	* */
	format_validation_results(
		/* array */ validation_results  // list of mapping paths that are missing
	){

		if (validation_results.length === 0) {
			this.validation_results.classList.add('hidden');
			this.validation_results.innerHTML = ``;
			return false;
		}

		this.validation_results.classList.remove('hidden');
		this.validation_results.innerHTML = `
			<span>The following fields should be mapped before you are able to upload the dataset:</span>${
			validation_results.map(field_path =>
				`<div class="wbplanview_mappings_line_elements">
					${
					html_generator.mapping_path(
						mappings.get_mapping_line_data_from_mappings_path({
							mappings_path: field_path,
							use_cached: true,
							generate_last_relationship_data: false,
						}),
						'preview_list',
						true
					)}
					</div>`
			).join('')}`;

		return `Some required fields were not mapped yet. Do you want to continue editing or save changes and quit editing`;

	},

	/*
	* Unmap headers that have a duplicate mappings path
	* */
	deduplicate_mappings(){

		const array_of_mappings = mappings.get_array_of_mappings(false, false);
		const duplicate_mapping_indexes = helper.find_duplicate_mappings(array_of_mappings, false);
		const lines = dom_helper.get_lines(mappings.list__mappings, true);

		let index = -1;
		for (const line of lines) {

			index++;

			if (duplicate_mapping_indexes.indexOf(index) === -1)
				continue;

			const line_elements = dom_helper.get_line_elements(line);
			const last_custom_select = line_elements.pop();

			custom_select_element.change_selected_option(last_custom_select, '0');

		}

	},

	/*
	* Show automapper suggestion on top of an opened `closed_list`
	* The automapper suggestions are shown only if the current box doesn't have a value selected
	* */
	show_automapper_suggestions(
		/* DOMElement */ select_element,  // target list
		/* DOMElement */ custom_select_option  // the option that is currently selected
	){

		new Promise((resolve) => {

			//don't show suggestions if picklist has non null value
			if (
				typeof custom_select_option !== "undefined" &&
				custom_select_element.get_option_value(custom_select_option) !== "0"
			)
				return resolve();

			const line_elements_container = select_element.parentElement;

			const mapping_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
				mapping_path_filter: select_element,
				include_headers: true,
			});

			const header = mapping_path.pop();
			const header_type = mapping_path.pop();

			if (header_type !== 'existing_header')
				return resolve();

			mapping_path.pop();

			const mapping_line_data = mappings.get_mapping_line_data_from_mappings_path({
				mappings_path: mapping_path,
				iterate: false,
			});

			let path_offset = 0;
			const list_mapping_type = custom_select_element.get_list_mapping_type(select_element);
			if (list_mapping_type === 'to_many') {
				mapping_path.push('#1');
				path_offset = 1;
			}

			const table_name = mapping_line_data[mapping_line_data.length - 1].table_name;

			let automapper_results = auto_mapper.map({
				headers: [header],
				base_table: table_name,
				path: mapping_path,
				path_offset: path_offset,
				allow_multiple_mappings: true,
				commit_to_cache: false,
				check_for_existing_mappings: true,
				scope: 'suggestion',
			});

			if (automapper_results.length === 0)
				return resolve();

			automapper_results = automapper_results[0][1];

			if (automapper_results.length > mappings.max_suggestions_count)
				automapper_results = automapper_results.slice(0, 3);

			const select_options_data = automapper_results.map(automapper_result => {

				const mapping_line_data = mappings.get_mapping_line_data_from_mappings_path({
					mappings_path: automapper_result,
					use_cached: true,
				}).slice(mapping_path.length - path_offset);
				const mapping_path_html = html_generator.mapping_path(
					mapping_line_data,
					'suggestion_list',
					false,//TODO: enable cache here and fix resulting bugs
				);

				return {
					option_name: mapping_path_html,
					option_value: automapper_result.join(data_model.path_join_symbol),
				};
			});

			const suggested_mappings_html = custom_select_element.get_suggested_mappings_element_html(select_options_data);
			const span = document.createElement('span');
			select_element.insertBefore(span, select_element.children[0]);
			span.outerHTML = suggested_mappings_html;

			resolve();

		}).then();

	},

};

module.exports = mappings;
