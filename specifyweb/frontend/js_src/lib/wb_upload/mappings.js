"use strict";

const tree_helpers = require('./tree_helpers.js');
const dom_helper = require('./dom_helper.js');
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

		console.log(array_of_mappings);

		Object.values(array_of_mappings).map(header_data =>
			mappings.add_new_mapping_line(-1, header_data['mapping_path'], header_data['header_data'])
		);

		this.changes_made = true;

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

		//TODO: uncomment this before production
		//navigation.addUnloadProtect(this, "This mapping has not been saved.");

	},

	/*
	* Updates the list of headers
	* @param {array} [headers=[]] - List of headers as strings
	* @param {object} [upload_plan=false] - Upload plan as an object or {bool} false for none
	* @param {bool} [headers_defined=true] - Whether CSV file had headers in the first line
	* */
	set_headers: function(headers = [], upload_plan = false, headers_defined = true){

		tree_helpers.raw_headers = headers;
		this.headers = Object.fromEntries(headers.map(header_name=>[header_name,false]));

		if (upload_plan !== false) {
			let mappings_tree = '';
			const {baseTableName: base_table_name} = upload_plan;

			mappings.set_table(base_table_name);

			mappings_tree = mappings.upload_plan_to_mappings_tree(upload_plan);
			const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree);
			mappings.implement_array_of_mappings(array_of_mappings);
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

		//TODO: uncomment this before production
		//navigation.removeUnloadProtect(this);

	},


	// FUNCTIONS

	add_new_mapping_line(position = -1, mappings_path = [], header_data){

		const new_mapping_line = document.createElement('div');

		const lines = mappings.list__mappings.children;

		if (position === 0 && lines.length !== 0)
			lines[0].before(new_mapping_line);
		else if (position === -1 || position > lines.length || lines.length === 0)
			mappings.list__mappings.append(new_mapping_line);
		else
			lines[position].after(new_mapping_line);

		const line_data = mappings.get_mapping_line_data_from_mappings_path(mappings_path);

		const mapping_line_data = {
			line_data: line_data,
			header_data: header_data,
		}

		new_mapping_line.outerHTML = html_generator.mapping_line(mapping_line_data);

	},


	// GETTERS

	get_mapping_line_data_from_mappings_path(mappings_path=[], recursive_payload=undefined){

		let table_name = '';
		let parent_table_name = '';
		let parent_table_relationship_name = '';
		let mapping_line_data = [];
		let mappings_path_position = -1;

		if(typeof recursive_payload !== "undefined") {
			({table_name,
				parent_table_name,
				parent_table_relationship_name,
				mapping_line_data,
				mappings_path_position
			} = recursive_payload);
		}

		else
			table_name = mappings.base_table_name;

		//mapping_line_data.push('getting fields for ' + table_name + ' with default_value: '+default_value+' and with parent_table: ' + parent_table_name + ' and parent_table_relationship: ' + parent_table_relationship_name)
		mapping_line_data.push(mappings.get_fields_for_table(table_name, mappings_path, mappings_path_position, parent_table_name, parent_table_relationship_name));


		const next_path_index = mappings_path_position+1;
		const next_path_element_name = mappings_path[next_path_index];
		if(typeof next_path_element_name !== "undefined"){

			let next_table_name = '';
			let next_parent_table_name = '';
			const next_path_element = mappings.tables[table_name]['fields'][next_path_element_name];

			const next_is_tree_rank = next_path_element_name.substring(0,mappings.reference_symbol.length)===mappings.reference_symbol;
			const next_is_to_many_instance = next_path_element_name.substring(0,mappings.tree_symbol.length)===mappings.tree_symbol;

			if(next_is_tree_rank || next_is_to_many_instance) {
				next_table_name = table_name;
				next_parent_table_name = parent_table_name;
			}
			else if(typeof next_path_element !== "undefined" && next_path_element['is_relationship']) {
				next_table_name = next_path_element['table_name'];
				next_parent_table_name = table_name;
			}

			if(next_table_name !== ''){
				const new_recursive_payload = {
					table_name: next_table_name,
					parent_table_name: next_parent_table_name,
					parent_table_relationship_name: next_path_element_name,
					mapping_line_data: mapping_line_data,
					mappings_path_position: next_path_index,
				};

				return mappings.get_mapping_line_data_from_mappings_path(mappings_path,new_recursive_payload);
			}
		}

		return mapping_line_data;

	},


	get_fields_for_table(table_name, mappings_path=[], mappings_path_position=-2, parent_table_name='', parent_table_relationship_name=''){

		let mapping_element_type = 'simple';

		if(mappings_path_position === -2)
			mappings_path_position = mappings_path.length-1;
		const next_mappings_path_position = mappings_path_position + 1;
		const local_mappings_path = mappings_path.slice(next_mappings_path_position);
		const next_mapping_path_element = mappings_path[next_mappings_path_position];
		const default_value = (typeof next_mapping_path_element !== "undefined" ? next_mapping_path_element : "0");
		const current_mapping_path_part = mappings_path[mappings_path_position];


		const parent_relationship_type =
			(
				typeof mappings.tables[parent_table_name] !== "undefined" &&
				typeof mappings.tables[parent_table_name]['fields'][parent_table_relationship_name] !== "undefined"
			) ? mappings.tables[parent_table_name]['fields'][parent_table_relationship_name]['type'] : '';
		const children_are_to_many_elements =
			(
				parent_relationship_type==='one-to-many' ||
				parent_relationship_type==='many-to-many'
			) &&
			parent_table_relationship_name.substring(0,mappings.reference_symbol.length)!==mappings.reference_symbol;

		const table_ranks = mappings.ranks[table_name];
		const children_are_ranks =
			typeof table_ranks !== "undefined" &&
			parent_table_relationship_name.substring(0,mappings.tree_symbol.length)!==mappings.tree_symbol;

		const mapped_fields = Object.keys(mappings.get_mapped_fields(local_mappings_path));

		const result_fields = {};


		if(children_are_to_many_elements){

			mapping_element_type = 'to_many';

			const max_mapped_element_number = mapped_fields.reduce((max_mapped_element_number,mapped_field)=>{
				const mapped_element_number = parseInt(mapped_field.substring(mappings.reference_symbol.length));
				if(mapped_element_number > max_mapped_element_number)
					return mapped_element_number;
				else
					return max_mapped_element_number;
			}, 0);

			for(let i=1; i<=(max_mapped_element_number+1); i++){
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

		}
		else if(children_are_ranks){

			mapping_element_type = 'tree';

			for(const [rank_name, is_required] of Object.entries(table_ranks)) {
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

		}

		else

			for (const [field_name, field_data] of Object.entries(mappings.tables[table_name]['fields'])) {

				const {is_relationship, relationship_type, is_hidden, is_required, friendly_name} = field_data;

				const is_enabled = (//disable field
					mapped_fields.indexOf(field_name) !== -1 ||//if it is mapped
					(
						!is_relationship ||//and is not a relationship
						(//or is of -to-one type
							relationship_type !== 'one-to-one' &&
							relationship_type !== 'many-to-one'
						)
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


		return {
			mapping_element_type: mapping_element_type,
			name: current_mapping_path_part,
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
			else
				continue;

			mappings_path.push(result_name);

			if (is_mapped)
				return mappings_path;

		}

		if (!is_mapped)
			return [];

	},

	//TODO: fix deprecated
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

				const {friendly_name: field_name} = field_data;

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

	//TODO: fix deprecated
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

	//TODO: fix deprecated
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
			const mapping_details = mappings.get_mapping_line_data_from_mappings_path(mapping_path, false);
			line_elements_container.append(html_generator.mapping_element(mapping_details));
		}


	},

	//HELPERS

	update_all_lines(mapping_path_filter){

	},

	update_line(line, mapping_path){

	},

	run_automapper(select_elements, headers_data){

	},

};

module.exports = mappings;
