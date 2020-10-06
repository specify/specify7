"use strict";

const tree_helpers = require('./tree_helpers.js');
const dom_helper = require('./dom_helper.js');
const html_generator = require('./html_generator.js');
const navigation = require('../navigation.js');

const mappings = {


	/*
	* Maps a field
	* @param {string} mapping_type - existing_header / new_header / new_static_header
	* @param {mixed} header_element - {DOMElement} header_element - <input type="radio"> if mapping type is `existing_header`
	* 								  {string} header_name - Name of the header if mapping type is `new_header`
	* 								  {string} static_value - Value of a static field if mapping type is `static_value`
	* @param {array} mapping_path - Mapping path array
	* @return {DOMElement} Returns header_element if mapping type is `existing_header`
	* 					   Else, returns <input type="radio"> for a newly created element
	* */
	map_field(mapping_type, header_element, mapping){

		let heading_mapping;

		if (mapping_type === 'existing_header') {
			const label = header_element.parentElement;
			heading_mapping = dom_helper.get_mappping_friendly_name_element(label);
			heading_mapping.classList.remove('undefined');
		} else {

			const header_line__element = document.createElement('div');
			this.list__headers.appendChild(header_line__element);

			if (mapping_type === 'new_header') {
				let header_name;

				if (header_element === '')
					header_name = 'New Column ' + this.new_header_id;
				else
					header_name = header_element;

				header_line__element.innerHTML += html_generator.new_header(header_name, 'mapped_header');

				this.new_header_id++;
			} else if (mapping_type === 'new_static_header')
				header_line__element.innerHTML += html_generator.new_header(header_element, 'static_header');

			const new_header_label = this.list__headers.lastElementChild;
			header_element = dom_helper.get_control_element(new_header_label)[0];
			header_element.checked = true;
			heading_mapping = dom_helper.get_mappping_friendly_name_element(new_header_label);

		}

		const mapping_path = mapping.join(mappings.level_separator);

		header_element.setAttribute('data-path', mapping_path);

		if (mapping.length === 1 && typeof this.selected_field !== "undefined")
			this.selected_field.setAttribute('disabled', '');

		const friendly_field_path_array = mappings.get_friendly_field_path(mapping.slice());
		const friendly_field_path = friendly_field_path_array.join(mappings.friendly_level_separator);

		heading_mapping.innerText = mappings.get_friendly_field_path_preview(friendly_field_path_array, mapping);
		heading_mapping.setAttribute('title', friendly_field_path);

		return heading_mapping;

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
			mappings.map_field(...header_data)
		);

		this.changes_made = true;
		mappings.update_mapping_line();

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

		this.button__change_table.style.display = '';

		this.title__table_name.classList.remove('undefined');
		this.title__table_name.innerText = mappings.tables[table_name]['table_friendly_name'];

		this.base_table_name = table_name;

		this.tree = {};
		this.changes_made = true;

		navigation.addUnloadProtect(this, "This mapping has not been saved.");

	},

	/*
	* Updates the list of headers
	* @param {array} [headers=[]] - List of headers as strings
	* @param {object} [upload_plan=false] - Upload plan as an object or {bool} false for none
	* @param {bool} [headers_defined=true] - Whether CSV file had headers in the first line
	* */
	set_headers: function(headers = [], upload_plan = false, headers_defined = true){

		this.raw_headers = headers;

		tree_helpers.raw_headers = this.raw_headers;

		if (upload_plan !== false) {
			let mappings_tree = '';
			const base_table_name = upload_plan['baseTableName'];

			mappings.set_table(base_table_name);

			mappings_tree = mappings.upload_plan_to_mappings_tree(upload_plan);
			const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree);
			//mappings.implement_array_of_mappings(array_of_mappings);//TODO: uncomment this
		}

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

		this.list__mappings.innerHTML = '';

		this.button__change_table.style.display = 'none';
		this.base_table_name = undefined;

		navigation.removeUnloadProtect(this);

	},


	// FUNCTIONS

	/*
	* Callback for when user presses the `map` button
	* This function calls `map_field` with necessary parameters
	* */
	map_field_callback(){

		if (typeof this.selected_field === "undefined" ||
			dom_helper.is_field_disabled(this.selected_field)
		)
			return;

		let mapping_type;
		let header;
		let mapping;

		const label = this.selected_header.parentElement;
		let heading_mapping = dom_helper.get_mappping_friendly_name_element(label);

		header = this.selected_header;
		mapping = mappings.get_field_path();

		if (typeof heading_mapping === "undefined") {
			mapping_type = dom_helper.get_header_name(this.selected_header);
			header = '';
		} else {
			mapping_type = 'existing_header';
			mappings.unmap_field_callback();
		}

		this.selected_header = mappings.map_field(mapping_type, header, mapping);

		this.changes_made = true;
		mappings.update_buttons();
		mappings.update_mapping_line();

	},

	/*
	* Callback for when users presses the `unmap` button
	* */
	unmap_field_callback(){

		const label = this.selected_header.parentElement;
		const heading_mapping = dom_helper.get_mappping_friendly_name_element(label);

		const mappings_path = dom_helper.get_mapping_path(this.selected_header);

		if (mappings_path === null)
			return;

		const mappings_array = mappings_path.split(mappings.level_separator);

		heading_mapping.classList.add('undefined');
		this.selected_header.removeAttribute('data-path');
		heading_mapping.removeAttribute('title');
		heading_mapping.innerText = '';

		this.changes_made = true;

		// go through each field and update it's status
		mappings.update_all_mapping_lines(mappings_array, mappings_path);

		mappings.update_all_mapping_lines();


	},

	add_new_mapping_line(position = -1, mappings_path = []){

		const new_mapping_line = document.createElement('div');

		const lines = mappings.list__mappings.childNodes;

		if (position === 0 && lines.length !== 0)
			lines[0].before(new_mapping_line);
		else if (position === -1 || position > lines.length || lines.length === 0)
			mappings.list__mappings.append(new_mapping_line);
		else
			lines[position].after(new_mapping_line);

		const mapping_line_data = mappings.get_field_from_mappings_path(mappings_path);
		new_mapping_line.outerHTML = html_generator.mapping_line(mapping_line_data);

	},


	// GETTERS

	get_field_from_mappings_path(mappings_path=[], recursive_payload=undefined){

		let table_name = '';
		let parent_table_name = '';
		let parent_table_relationship_name = '';
		let mapping_line_data = [];
		let mappings_path_position = -1;
		let local_mappings_path = [];

		if(typeof recursive_payload !== "undefined") {
			table_name = recursive_payload['table_name'];
			parent_table_name = recursive_payload['parent_table_name'];
			parent_table_relationship_name = recursive_payload['parent_table_relationship_name'];
			mapping_line_data = recursive_payload['mapping_line_data'];
			mappings_path_position = recursive_payload['mappings_path_position'];
			local_mappings_path = mappings_path.slice(0,mappings_path_position);
		}

		else
			table_name = mappings.base_table_name;

		//mapping_line_data.push('getting fields for ' + table_name + ' with parent_table: ' + parent_table_name + ' and parent_table_relationship: ' + parent_table_relationship_name)
		mapping_line_data.push(mappings.get_fields_for_table(table_name, local_mappings_path, parent_table_name, parent_table_relationship_name));


		const next_path_index = mappings_path_position+1;
		const next_path_element_name = mappings_path[next_path_index];
		if(typeof next_path_element_name !== "undefined"){

			const next_path_element = mappings.tables[table_name]['fields'][next_path_element_name]

			if(next_path_element['is_relationship']){

				const next_table_name = next_path_element['table_name'];

				const new_recursive_payload = {
					table_name: next_table_name,
					parent_table_name: table_name,
					parent_table_relationship_name: next_path_element_name,
					mapping_line_data: mapping_line_data,
					mappings_path_position: next_path_index,
				};

				return mappings.get_field_from_mappings_path(mappings_path,new_recursive_payload);
			}
		}

		return mapping_line_data;

	},


	get_fields_for_table(table_name, mappings_path=[], parent_table_name='', parent_table_relationship_name=''){

		const mapped_fields = Object.keys(mappings.get_mapped_fields(mappings_path));

		const result_fields = {};

		for (const [field_name, field_data] of Object.entries(mappings.tables[table_name]['fields'])) {

			const {is_relationship, relationship_type, is_hidden, is_required, friendly_name} = field_data;

			const is_enabled = (//disable field
				mapped_fields.indexOf(field_name) === -1 ||//if it is mapped
				(
					!is_relationship ||//and is not a relationship
					(//or is of -to-one type
						relationship_type !== 'one-to-one' &&
						relationship_type !== 'many-to-one'
					)
				)
			);

			const final_friendly_name = (is_relationship ? mappings.reference_indicator : '') + friendly_name;

			result_fields[field_name] = {
				field_friendly_name: final_friendly_name,
				is_enabled: is_enabled,
				is_required: is_required,
				is_hidden: is_hidden,
			};

		}

		let mapping_subtype = 'simple';
		if (mappings.data_model_handler.is_table_a_tree(table_name))
			mapping_subtype = 'tree';

		return {
			mapping_type: 'table',
			mapping_subtype: mapping_subtype,
			name: '',
			friendly_name: mappings.tables[table_name]['table_friendly_name'],
			table_name: table_name,
			fields_data: result_fields,
		};


	},

	get_mapped_fields(mappings_path){

		const lines_elements_container = dom_helper.get_lines(mappings.list__mappings, true);

		const mappings_paths = lines_elements_container.map(line_elements_container =>
			mappings.get_mappings_path(line_elements_container, mappings_path)
		);

		return tree_helpers.array_to_tree(mappings_paths);

	},

	get_mappings_path(line_elements_container, mapping_path_filter = []){

		const elements = dom_helper.get_line_elements(line_elements_container);

		const mappings_path = [];
		let is_mapped = false;

		for (const element of elements) {

			const element_type = element.getAttribute('data_type');

			let result_name = '';

			if (element_type === 'table') {
				const element_subtype = element.getAttribute('data_subtype');
				const name = element.getAttribute('name');

				if (element_subtype === 'simple')
					result_name = name;
				else if (element_subtype === 'tree')
					result_name = mappings.tree_symbol + name;
				else if (element_subtype === 'to_many')
					result_name = mappings.reference_symbol + name;
			} else if (element_type === 'headers') {
				if (mapping_path_filter.length !== 0 && mapping_path_filter.join('_') !== mappings_path.join('_'))
					return [];
				else {
					result_name = element.value;
					is_mapped = true;
				}
			}

			mappings_path.push(result_name);

			if (is_mapped)
				return mappings_path;

		}

		if (!is_mapped)
			return [];

	},

	/*
	* Puts HTML for a particular relationship line into `current_line` outerHTML
	* @param {string} table_name - Official target table name (from data model)
	* @param {string{ previous_table - Official name for the current table (a.k.a parent of to table_name) (from data model)
	* @param {string} foreign_name - Name of this relationship in previous_table
	* @param {DOMElement} current_line - Element which would have it's outerHTML replaced with the result of this function
	* @param {bool} index - A terrible name for a variable that tells whether to check if this relationship is -to-many or a tree. If set to false, relationship would be treated as -to-one
	*
	* */
	get_html_for_table_fields(table_name, previous_table, foreign_name, current_line, index = false){

		const required_fields = [];
		const optional_fields = [];


		let relationship_type = '';
		if (previous_table !== '' && typeof mappings.tables[previous_table]['relationships'][foreign_name] !== "undefined")
			relationship_type = mappings.tables[previous_table]['relationships'][foreign_name]['type'];


		let mapped_nodes = mappings.get_mapped_children(current_line);

		if (index === false) {

			const ranks = mappings.ranks[table_name];

			if (typeof ranks !== "undefined")
				for (const [rank_name, is_required] of Object.entries(ranks)) {

					const data = [this.tree_symbol + rank_name, mappings.reference_indicator + rank_name, true];

					if (is_required)
						required_fields.push(data);
					else
						optional_fields.push(data);

				}

			if (required_fields.length === 0 && optional_fields.length === 0 && (relationship_type.indexOf('-to-many') !== -1)) {
				let mapped_nodes_count = mapped_nodes.length;

				if (mapped_nodes === false)
					mapped_nodes_count = 0;

				const table_friendly_name = mappings.tables[table_name]['table_friendly_name'];

				for (let i = 1; i < mapped_nodes_count + 2; i++)
					optional_fields.push([mappings.reference_symbol + i, i + '. ' + table_friendly_name, true]);
			}


		}

		if (required_fields.length === 0 && optional_fields.length === 0) {

			// build a list of fields and relationships
			const rows = Object.entries(mappings.tables[table_name]['fields']).reduce((rows, [field_key, field_data]) => {

				if (field_data['is_hidden'] && this.hide_hidden_fields)
					return rows;  // hide fields designated as hidden when `hide_hidden_fields` is checked

				const field_name = field_data['friendly_name'];

				if (field_data['is_relationship']) {

					if (
						(  // hide -to-many relationships inside of -to-many relationships
							relationship_type.indexOf('-to-many') !== -1 &&
							field_data['type'].indexOf('-to-many') !== -1
						) ||
						(  // disables circular relationships
							field_data['foreign_name'] === foreign_name &&
							field_data['table_name'] === previous_table
						)
					)
						return rows;

					rows[field_name] = [field_key, true, 'relationship', field_data['is_required']];

				} else {
					const enabled = !mapped_nodes.includes(field_key);
					rows[field_name] = [field_key, enabled, 'field', field_data['is_required']];
				}

				return rows;

			}, {});

			// sort && display fields
			for (let row_name of Object.keys(rows).sort()) {

				let [row_key, row_enabled, row_type, is_required] = rows[row_name];

				if (row_type === 'relationship')
					row_name = mappings.reference_indicator + row_name;

				if (  // TODO: remove this to enable all fields for trees (once upload plan starts supporting that)
					typeof mappings.ranks[table_name] !== "undefined" &&
					row_name !== 'Name'
				)
					row_enabled = false;

				const result = [row_key, row_name, row_enabled];

				if (is_required)
					required_fields.push(result);
				else
					optional_fields.push(result);

			}

		}

		return html_generator.new_relationship_fields(table_name, optional_fields, required_fields);

	},

	/*
	* Turns a mapping path (array) into a friendly mapping path (array)
	* @param {array} path - mapping path
	* @param {array} [friendly_names=[]] - Used by recursion to store intermediate result
	* @param {string} [table_name=''] - Used by recursion to store temporary data
	* */
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

	},

	/*
	* Traverses the existing mapping to create a mappings tree
	* @return {object} Returns mappings tree
	* */
	get_mappings_tree(){

		if (this.changes_made === false)
			return this.tree;

		this.tree = Object.values(this.headers).reduce((tree, header) => {

			const raw_path = dom_helper.get_mapping_path(header);

			if (raw_path == null)
				return tree;

			const path = raw_path.split(mappings.level_separator);

			const next_heading_line = header.nextElementSibling;

			let [header_control_element, header_type] = dom_helper.get_header_control_element(next_heading_line);

			if (header_type === 'static')
				path.push({static: header_control_element.value});
			else
				path.push(header_control_element.getAttribute('data-original_value'));

			const branch = tree_helpers.array_to_tree(path);

			return tree_helpers.deep_merge_object(tree, branch);

		}, {});


		this.changes_made = false;

		return this.tree;

	},


	//CHANGE CALLBACKS

	field_change_callback(event){

		const field_select_element = event.target;
		const selected_field = field_select_element.value;

		if (selected_field === "0")
			return;

		const table_name = field_select_element.getAttribute('data-table_name');
		const field_data = mappings.tables[table_name][selected_field];
		const {is_relationship} = field_data;

		if (is_relationship) {
			const line_elements_container = dom_helper.get_line_elements_container(field_select_element);
			const mapping_path = mappings.get_mappings_path(line_elements_container);
			const mapping_details = mappings.get_field_from_mappings_path(mapping_path, false);
			line_elements_container.append(html_generator.mapping_element(mapping_details));
		}


	},

	header_change_callback(event){

		const headers_select_element = event.target;
		const selected_header = headers_select_element.value;

		function delete_textarea(){
			const next_element = headers_select_element.nextElementSibling;
			if (next_element.tagName === 'TEXTAREA')
				next_element.remove();
		}

		if (selected_header === "0") {
			delete_textarea();
			return;
		}

		const line_elements_container = dom_helper.get_line_elements_container(headers_select_element);

		if (selected_header === 'new_static_column') {
			const mapping_details = {
				mapping_type: 'static_value',
				static_value: '',
			};
			line_elements_container.append(html_generator.mapping_element(mapping_details));
		} else
			delete_textarea();

	}

	//HELPERS

};

module.exports = mappings;
