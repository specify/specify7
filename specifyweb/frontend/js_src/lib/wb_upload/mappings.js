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
			mappings.add_new_mapping_line(-1, header_data['mapping_path'], header_data['header_data'], false)
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
	set_table(table_name, headers_to_shadow_define=[]){

		this.container.classList.remove('loaded');

		new Promise((resolve) => {

			this.title__table_name.innerText = data_model.tables[table_name]['table_friendly_name'];

			this.base_table_name = table_name;

			this.tree = {};
			this.changes_made = true;

			const base_table_fields = mappings.get_mapping_line_data_from_mappings_path({
				mappings_path: [],
				use_cached: true,
			});
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

					if(headers_to_shadow_define.indexOf(header) !== -1)
						mapping_line_data['line_data'] = [];

					const mapping_line_html = html_generator.mapping_line(mapping_line_data, true);

					result_lines.push(mapping_line_html);

				}

				mappings.list__mappings.innerHTML = result_lines.join('');

			}

			if (mappings.need_to_run_automapper) {
				const mappings_object = auto_mapper.map(Object.keys(this.headers), this.base_table_name);
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

			resolve();

		}).then(() => {
			this.container.classList.add('loaded');
			this.container.classList.add('table_selected');

			custom_select_element.onload(mappings.list__mappings);
		});

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

			mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree(upload_plan);
			const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree);
			const defined_headers = array_of_mappings.filter(({header_data: {mapping_type}})=>
				mapping_type==="existing_header"
			).map(({header_data: {header_name}})=>
				header_name
			);

			mappings.set_table(base_table_name, defined_headers);
			mappings.implement_array_of_mappings(array_of_mappings);
		} else
			mappings.need_to_define_lines = true;

		mappings.need_to_run_automapper = headers_defined && upload_plan === false;

	},

	/*
	* Resets the currently mapped fields and presents the option to chose base table again
	* */
	reset_table(){

		if (typeof this.base_table_name === "undefined")
			return;

		this.container.classList.remove('table_selected');
		this.title__table_name.innerText = '';

		this.list__mappings.innerHTML = '';

		this.base_table_name = undefined;

		//TODO: uncomment this before production
		//navigation.removeUnloadProtect(this);

		mappings.need_to_define_lines = true;
		mappings.need_to_run_auto_mapper = true;

	},


	// FUNCTIONS

	add_new_mapping_line(position = -1, mappings_path = [], header_data, blind_add_back = false){

		const lines = dom_helper.get_lines(mappings.list__mappings);

		let new_mapping_line;

		if(blind_add_back){
			new_mapping_line = document.createElement('div');
			mappings.list__mappings.appendChild(new_mapping_line);
		}
		else {
			//before adding new header, check if it is already present
			const {header_name} = header_data;
			const header_index = Object.keys(this.headers).indexOf(header_name);
			new_mapping_line = lines[header_index];

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
	get_mapping_line_data_from_mappings_path(payload){

		const {
			mappings_path = [],
			iterate = true,
			use_cached = false,
			generate_last_relationship_data = true,
		} = payload;

		const internal_payload = {
			mappings_path: mappings_path,
			generate_last_relationship_data: generate_last_relationship_data,
			mappings_path_position: -1,
			iterate: iterate,
			mapping_line_data: [],
		};

		const callbacks = {
			get_base_table: () =>
				mappings.base_table_name,

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

				return {
					next_path_elements_name: next_path_element_name,
					next_path_elements: data_model.tables[table_name]['fields'][next_path_element_name]
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
							typeof data_model.tables[parent_table_name]['fields'][foreign_name] !== "undefined" &&
							data_model.tables[parent_table_name]['fields'][foreign_name]['foreign_name'] === field_name
						) ||
						(  // skip -to-many inside of -to-many
							is_relationship &&
							relationship_type.indexOf('-to-many') !== -1 &&
							parent_relationship_type.indexOf('-to-many') !== -1
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
						table_name: table_name,
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

		return data_model.schema_navigator({
			callbacks: callbacks,
			internal_payload: internal_payload,
			config: {
				use_cache: use_cached,
				cache_name: 'mapping_line_data',
			}
		});

	},

	get_array_of_mappings(include_headers = false, skip_empty = true){

		if (!include_headers && !mappings.changes_made)
			return mappings.mapped_fields;

		const lines_elements_containers = dom_helper.get_lines(mappings.list__mappings, true);

		return mappings.mapped_fields = lines_elements_containers.reduce((mapped_fields, line_elements_container) => {

			const mappings_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
				include_headers: include_headers
			});

			if (
				!skip_empty ||
				mappings_path[mappings_path.length-1] !== "0"
			)
				mapped_fields.push(mappings_path);

			return mapped_fields;
		}, []);

	},

	get_mappings_tree(include_headers = false){
		if (!include_headers && !mappings.changes_made)
			return mappings.mappings_tree;

		return mappings.mappings_tree = tree_helpers.array_of_mappings_to_mappings_tree(
			mappings.get_array_of_mappings(include_headers),
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

			else if(path.length === 0)
				path = ["0"];


			if (exclude_non_relationship_values) {
				const is_relationship = custom_select_element.element_is_relationship(element);

				if (!is_relationship)
					path.pop();
			}

			if (include_headers) {
				const line = line_elements_container.parentElement;
				const header_name = dom_helper.get_line_header(line);
				return [...path, header_name];
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

		return return_path(mappings_path);

	},


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
			custom_select_type,
			list_table_name,
		} = custom_select_change_payload;

		const line_elements_container = changed_list.parentElement;

		let previous_value_is_relationship = true;

		if (list_type === 'list_of_tables')
			return mappings.set_table(new_value);

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

		} else {

			const remove_block_to_the_right = //remove all elements to the right
				list_type === 'simple' || //if the list is not a `tree` and not a `to_many`
				new_value === '0'; // or if list's value is unset;
			if (remove_block_to_the_right && dom_helper.remove_elements_to_the_right(changed_list))
					mappings.changes_made = true;

			previous_value_is_relationship =
				list_type !== 'simple' ||
				(
					previous_value !== "0" &&
					data_model.tables[list_table_name]['fields'][previous_value]['is_relationship']
				);

		}

		const mappings_path = mappings.get_mappings_path({
			line_elements_container: line_elements_container,
			mapping_path_filter: changed_list,
		});


		//add block to the right if there aren't any and selected field is a relationship
		if (dom_helper.has_next_sibling(changed_list) && is_relationship) {
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
			custom_select_element.resize_elements(
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

	update_all_lines(mapping_path_filter = null)	{

		new Promise((resolve) => {
			const lines = dom_helper.get_lines(mappings.list__mappings, true);

			//update the mapping view too if it is not hidden
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
					mappings.update_line(line, filter);

			resolve();

		});

	},

	update_line(line_elements_container, filter_mapping_path = null){

		new Promise((resolve) => {
			const mapping_path = mappings.get_mappings_path({
				line_elements_container: line_elements_container,
			});
			const select_elements = dom_helper.get_line_elements(line_elements_container);

			if(select_elements.length === 0)
				return resolve();

			const update_mapped_fields = (select_element, mapped_fields) => {
				custom_select_element.enable_disabled_options(select_element);
				for (const mapped_field of Object.keys(mapped_fields))
					custom_select_element.toggle_option(select_element, mapped_field, 'disable');
			};

			if (filter_mapping_path === null)
				for (const [position, select_element] of select_elements.entries()) {
					const local_mapping_path = mapping_path.slice(0, position);
					const mapped_fields = mappings.get_mapped_fields(local_mapping_path);
					update_mapped_fields(select_element, mapped_fields);
				}

			else {

				const intersection_point = helper.find_array_divergence_point(mapping_path, filter_mapping_path);
				if (intersection_point === -1)
					return resolve();

				const mapped_fields = mappings.get_mapped_fields(filter_mapping_path);
				const target_select_element = select_elements[intersection_point];
				update_mapped_fields(target_select_element, mapped_fields);

				if (custom_select_element.get_list_mapping_type(target_select_element) === 'to_many') {
					const options = target_select_element.getElementsByClassName('custom_select_option');
					const option_values = Object.values(options).map(option => custom_select_element.get_option_value(option));
					let max_value = mappings.get_max_to_many_value(option_values);
					const max_mapped_value = mappings.get_max_to_many_value(Object.keys(mapped_fields));

					max_value++;
					while (max_mapped_value >= max_value) {

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

						max_value++;

					}
				}


			}

			resolve();

		});

	},

	focus_line(line){

		const lines = dom_helper.get_lines(mappings.list__mappings);

		// don't do anything if selected line is already focused
		const selected_lines = lines.filter(mapping_line =>
			mapping_line.classList.contains('wbplanview_mappings_line_focused')
		);
		if(selected_lines.length === 0 && selected_lines[0]===line)
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
					html_generator.mapping_path(
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

		const array_of_mappings = mappings.get_array_of_mappings(false, false);
		const duplicate_mapping_indexes = helper.find_duplicate_mappings(array_of_mappings);
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

};

module.exports = mappings;
