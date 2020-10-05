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
		if(typeof event === "object"){
			const radio = event.target;
			table_name = dom_helper.get_table_name(radio);
		}
		else
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

	add_new_mapping_line(position=-1, mappings_path = []){

		const new_mapping_line = document.createElement('div');

		const lines = mappings.list__mappings.childNodes;

		if(position===0 && lines.length!==0)
			lines[0].before(new_mapping_line);
		else if(position===-1 || position>lines.length || lines.length===0)
			mappings.list__mappings.append(new_mapping_line);
		else
			lines[position].after(new_mapping_line)

		const mapping_line_data = mappings.get_mapping_line_data(mappings_path, true);
		new_mapping_line.outerHTML = html_generator.mapping_line(mapping_line_data);

	},


	// GETTERS


	get_mapping_line_data(mappings_path,recursive=true, mappings_path_position=-1, parent_table='', parent_relationship=''){

		if(mappings_path.length===0){

			const table_name = mappings.base_table_name;

			const mapped_fields = Object.keys(mappings.get_mapped_fields(mappings_path));

			const result_fields={};

			for(const [field_name, field_data] of Object.entries(mappings.tables[table_name]['fields'])){

				const {is_relationship, relationship_type, is_hidden, is_required, friendly_name} = field_data;

				const is_enabled = (
					(
						!is_relationship && mapped_fields.indexOf(field_name) === -1
					) ||
					(
						is_relationship &&
						relationship_type !== 'one-to-one' &&
						relationship_type !== 'one-to-many'
					)
				)

				const final_friendly_name =  (is_relationship ? mappings.reference_indicator : '') + friendly_name;

				result_fields[field_name] = {
					'field_friendly_name': final_friendly_name,
					'is_enabled': is_enabled,
					'is_required': is_required,
					'is_hidden': is_hidden,
				};

			}

			let mapping_type = 'table';
			if(mappings.data_model_handler.is_table_a_tree(table_name))
				mapping_type = 'tree';

			return [{
				'mapping_type': 'table',
				'name': '',
				'friendly_name': '',
				'fields_data': result_fields
			}];

		}


		// if(mappings_path_position===-1){
		//
		// 	parent_table = mappings.base_table_name;
		//
		// 	if(!recursive && mappings_path.length!==0)
		// 		mappings_path_position=mappings_path.length-1;
		// 	else
		// 		mappings_path_position=0;
		// }
		//
		// const mappings_path_part = mappings_path[mappings_path_position];
		//
		// const result_fields = [];


		// const table_name = mappings.base_table_name;
		// //const relationship_type = '';
		//
		// for(const mapping_path of mappings_path){
		//
		// }
		//
		// const result_fields = [];
		//
		//
		//
		// return result_fields;

	},

	get_mapped_fields(mappings_path){

		const lines_elements_container = dom_helper.get_lines(mappings.list__mappings, true);

		const mappings_paths = lines_elements_container.map(line_elements_container=>
			mappings.get_mappings_path(line_elements_container,mappings_path)
		);

		return tree_helpers.array_to_tree(mappings_paths);

	},

	get_mappings_path(line_elements_container, mapping_path_filter=[]){

		const elements = dom_helper.get_line_elements(line_elements_container);

		const mappings_path = [];
		let is_mapped = false;

		for(const element of elements){

			const element_type = element.getAttribute('data_type');

			let result_name='';

			if(element_type === 'table')
				result_name = element.getAttribute('data-name');
			else if(element_type === 'tree')
				result_name = mappings.tree_symbol+element.getAttribute('data-name');
			else if(element_type === 'headers'){
				if(mapping_path_filter.length!==0 && mapping_path_filter.join('_')!==mappings_path.join('_'))
					return [];
				else {
					result_name = element.value;
					is_mapped = true;
				}
			}

			mappings_path.push(result_name);

			if(is_mapped)
				return mappings_path;

		}

		if(!is_mapped)
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


		let relationship_type='';
		if (previous_table !== '' && typeof mappings.tables[previous_table]['relationships'][foreign_name] !== "undefined")
			relationship_type = mappings.tables[previous_table]['relationships'][foreign_name]['type'];


		let mapped_nodes = mappings.get_mapped_children(current_line);

		if (index === false) {

			const ranks = mappings.ranks[table_name];

			if (typeof ranks !== "undefined")
				for(const [rank_name,is_required] of Object.entries(ranks)){

					const data = [this.tree_symbol + rank_name, mappings.reference_indicator + rank_name, true];

					if(is_required)
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

		if(required_fields.length === 0 && optional_fields.length === 0) {

			// build a list of fields and relationships
			const rows = Object.entries(mappings.tables[table_name]['fields']).reduce((rows,[field_key,field_data]) => {

				const is_field_hidden = field_data['is_hidden'];

				if (is_field_hidden && this.hide_hidden_fields)
					return rows;  // hide fields designated as hidden when `hide_hidden_fields` is checked

				const field_name = field_data['friendly_name'];

				if(field_data['is_relationship']){

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

				}

				else {
					const enabled = !mapped_nodes.includes(field_key);
					rows[field_name] = [field_key, enabled, 'field', field_data['is_required']];
				}

				return rows;

			},{});

			// sort && display fields
			for(let row_name of Object.keys(rows).sort()){

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
	* Get the list of elements of this line that are mapped
	* @param {DOMElement} current_line - select that would be used as a basis for checking
	* @return {array} Returns array of fields that are already mapped and should be disabled
	* */
	get_mapped_children(current_line){
		const previous_line = current_line.previousElementSibling;

		const previous_element = dom_helper.get_control_element(previous_line)[0];

		const mappings_array = mappings.get_field_path(previous_element);
		const node_mappings_tree = tree_helpers.array_to_tree(mappings_array);
		const full_mappings_tree = mappings.get_mappings_tree();

		const tree = tree_helpers.traverse_tree(full_mappings_tree, node_mappings_tree);

		return Object.keys(tree);

	},

	/* Returns a mappings path for a particular control element
	* @param {DOMElement} [target_field=undefined] Control element (input or select). this.selected_field is used if undefined
	* @return {array} Returns array of strings that represent the mapping path
	* Example output:
	* 	['Accession','Accession Agents','#1', 'Remarks']
	* */
	get_field_path(target_field = undefined){

		const path = [];

		if (typeof target_field === "undefined") {
			if (typeof this.selected_field === "undefined")
				return '';
			target_field = this.selected_field;
		}

		let line = dom_helper.get_line_element(target_field);

		while (true) {

			let [control_element, control_element_type] = dom_helper.get_control_element(line);

			if (control_element_type === 'select')
				path.push(control_element.value);
			else {
				path.push(dom_helper.get_field_name(control_element));
				break;
			}

			line = line.previousElementSibling;

		}


		if (path.length === 0 && path[0] === null)
			return [];

		return path.reverse();

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
			if(field_data['is_relationship'])
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
	* Turns the result of get_field_path and get_friendly_field_path into a human-friendly path preview that can be used as a text for header's label
	* @param {array} friendly_field_path - result of get_friendly_field_path
	* @param {array} field_path - result of get_field_path
	* @return {string} - human-friendly path preview that can be used as a text for header's label
	* */
	get_friendly_field_path_preview(friendly_field_path, field_path){
		friendly_field_path = friendly_field_path.splice(1);  //remove the base table from the friendly path
		const path_length = friendly_field_path.length;

		if (path_length === 0 || path_length !== field_path.length)
			return '';

		let result = friendly_field_path[path_length - 1];

		if (path_length === 1)
			return result;

		//if base table is a tree and path length == 2
		if (path_length === 2 && typeof mappings.ranks[this.base_table_name] !== "undefined")
			return friendly_field_path[0] + ' ' + result;  //e.x. for `Kingdom > Name` return `Kingdom Name`

		//detect previous field being a -to-many object
		if (friendly_field_path[path_length - 2].substr(0, mappings.reference_symbol.length) === mappings.reference_symbol)
			return friendly_field_path[path_length - 2] + ' ' + result;  //e.x. for `... > #1 > Name` return `#1 Name`

		//detect previous field being a tree rank
		if (field_path[path_length - 2].substr(0, this.tree_symbol.length) === this.tree_symbol)
			return field_path[path_length - 2].substr(this.tree_symbol.length) + ' ' + result;  //e.x. for `$Kingdom > Name` return `Kingdom Name`


		return result;
	},

	/*
	* Traverses the existing mapping to create a mappings tree
	* @return {object} Returns mappings tree
	* */
	get_mappings_tree(){

		if (this.changes_made===false)
			return this.tree;

		this.tree = Object.values(this.headers).reduce((tree,header) => {

			const raw_path = dom_helper.get_mapping_path(header);

			if (raw_path == null)
				return tree;

			const path = raw_path.split(mappings.level_separator);

			const next_heading_line = header.nextElementSibling;

			let [header_control_element, header_type] = dom_helper.get_header_control_element(next_heading_line);

			if (header_type === 'static')
				path.push({'static': header_control_element.value});
			else
				path.push(header_control_element.getAttribute('data-original_value'));

			const branch = tree_helpers.array_to_tree(path);

			return tree_helpers.deep_merge_object(tree, branch);

		},{});


		this.changes_made = false;

		return this.tree;

	},


	//CHANGE CALLBACKS

	/*
	* Callback for handling change to direct child of a base table
	* */
	change_selected_field(event){

		const radio = event.target;
		const label = radio.parentElement;
		const field_key = dom_helper.get_field_name(radio);

		this.selected_field = radio;

		dom_helper.close_open_lists(this.list__data_model);

		if (mappings.is_selected_field_in_relationship()) {

			const select_line = document.createElement('div');
			this.list__data_model.insertBefore(select_line, label.nextElementSibling);

			let target_table_name;
			let index = field_key.substr(0, this.tree_symbol.length) === this.tree_symbol;
			if (index)
				target_table_name = this.base_table_name;
			else {
				const relationship = mappings.tables[this.base_table_name]['relationships'][field_key];
				target_table_name = relationship['table_name'];
			}

			select_line.outerHTML = mappings.get_html_for_table_fields(target_table_name, this.base_table_name, field_key, select_line, index);
			dom_helper.get_control_element(label.nextElementSibling)[0].checked = true;

		}

		mappings.update_all_mapping_lines();

	},

	/*
	* Callback for handling the change to the value of <select>
	* */
	change_option_field(event){
		const select = event.target;
		const value = select.value;
		const label = select.parentElement;
		const line = label.parentElement;
		const radio = dom_helper.get_control_element(line)[0];
		radio.checked = true;

		this.selected_field = select;

		let element = line.nextElementSibling;  //remove all <select> elements following this one
		while (true) {

			if (element === null || !element.classList.contains('table_relationship'))
				break;

			let next_element = element.nextElementSibling;

			this.list__data_model.removeChild(element);

			element = next_element;
		}


		if (mappings.is_selected_field_in_relationship() && value !== '' && value !== "0") {

			const select_line = document.createElement('div');
			this.list__data_model.insertBefore(select_line, line.nextElementSibling);

			let current_table_name;
			let relationship_key;
			let index = false;

			if (value.substr(0, this.tree_symbol.length) === this.tree_symbol) {  //previous_selected_field was part of a tree structure

				const table_name = dom_helper.get_relationship_name(select);
				select_line.outerHTML = mappings.get_html_for_table_fields(table_name, '', '', select_line, true);

			} else {

				if (value.substr(0, mappings.reference_symbol.length) === mappings.reference_symbol) {  //previous_selected_field was a o-m or m-m multiple

					const parent_line = line.previousElementSibling;
					let [parent_control_element, parent_control_element_type] = dom_helper.get_control_element(parent_line);

					if (parent_control_element_type === 'select') {
						current_table_name = dom_helper.get_relationship_name(parent_control_element);
						relationship_key = parent_control_element.value;
					} else {
						current_table_name = this.base_table_name;
						relationship_key = dom_helper.get_field_name(parent_control_element);
					}

					index = value;

				} else {
					current_table_name = dom_helper.get_relationship_name(select);
					relationship_key = value;
				}

				const relationship = mappings.tables[current_table_name]['relationships'][relationship_key];
				const target_table_name = relationship['table_name'];
				select_line.outerHTML = mappings.get_html_for_table_fields(target_table_name, current_table_name, relationship_key, select_line, index);

			}


			dom_helper.get_control_element(line.nextElementSibling)[0].checked = true;

		}

		mappings.update_all_mapping_lines();

	},

	//HELPERS

};

module.exports = mappings;
