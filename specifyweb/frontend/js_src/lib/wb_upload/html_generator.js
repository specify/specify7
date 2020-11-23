"use strict";

const custom_select_element = require('./custom_select_element.js');


/*
*
* Generate HTML for various control elements created during mapping process
*
* */
const html_generator = {

	/*
	* Generates HTML for a list of tables
	* @return {string} HTML for a list of tables
	* */
	tables(
		/* array */ list_of_tables  // a dictionary like table_name==>table_friendly_name
	){

		const fields_data = Object.fromEntries(Object.entries(list_of_tables).map(([table_name, table_label]) =>
																					  [
																						  table_name,
																						  {
																							  field_friendly_name: table_label,
																							  table_name: table_name,
																							  is_relationship: true
																						  }
																					  ]
		));

		const mapping_details = {
			name: 'list_of_base_tables',
			friendly_name: 'Select a base table:',
			fields_data: fields_data,
			mapping_element_type: 'list_of_tables',
		};

		return html_generator.mapping_element(mapping_details, 'opened_list');

	},

	/*
	* Generates HTML for a mapping view
	* @return {string} HTML for a mapping view
	* */
	mapping_view(
		/* array */ mappings_view_data,  // mapping path data. See html_generator.mapping_path() for data structure
		/* boolean */ use_cached  // whether to use a cached version of the mapping view
	){
		return html_generator.mapping_path(mappings_view_data, 'opened_list', use_cached);
	},

	/*
	* Generates HTML for a mapping line
	* @return {string} HTML for a mapping line
	* */
	mapping_line(
		/* object */ mappings_line_data,  // described in the method definition
		/* boolean */ use_cached  // whether to use a cached version of the mapping line
	){
		/*
		* mappings_line_data {array}:
		* 	mapping_element_type: 'simple'||'to_many'||'tree'
		*
		* */

		const {
			line_data,  // {array} mapping path data. See html_generator.mapping_path() for data structure
			header_data: {
				mapping_type,  // {string} type of the header ('existing_header'/'new_column'/'new_static_column')
				header_name  // {string} if mapping_type is 'new_static_column' - the value of a static filed. Else, the name of the header
			},
			line_attributes = [],  // {array} list of classes to be appended to this line
		} = mappings_line_data;

		let header_html;
		if (mapping_type === 'new_static_column')
			header_html = html_generator.static_header(header_name);
		else
			header_html = header_name;

		return `<div class="wbplanview_mappings_line ` + line_attributes.join(' ') + `">
					<div class="wbplanview_mappings_line_controls">
						<button class="wbplanview_mappings_line_delete" title="Clear mapping"><img src="../../../static/img/discard.svg" alt="Clear mapping"></button>
					</div>
					<div class="wbplanview_mappings_line_header" data-mapping_type="${mapping_type}">` + header_html + `</div>
					<div class="wbplanview_mappings_line_elements">
						` + html_generator.mapping_path(line_data, 'closed_list', use_cached) + `
					</div>
				</div>`;
	},

	/*
	* Generates HTML for a given mapping path data
	* @return {string} HTML for a given mapping path data
	* */
	mapping_path: (
		/* array */ mappings_line_data,  // list of mapping_element data. See html_generator.mapping_element() for data structure.
		/* string */ custom_select_type = 'closed_list',  // the type of the custom select elements to use. See custom_select_element.get_element_html for more info
		/* boolean */ use_cached = false  // whether to use cached value for this mapping path
	) =>
		mappings_line_data.map(mapping_details =>
								   html_generator.mapping_element(
									   mapping_details,
									   custom_select_type,
									   use_cached,
								   )
		).join(''),

	/*
	* Generates HTML for a new mapping element
	* @returns HTML for a new mapping element
	* */
	mapping_element(
		/* object */ mapping_details,  // described in the method definition
		/* string */ custom_select_type = 'closed_list', // the type of the custom select elements to use. See custom_select_element.get_element_html for more info
		/* boolean */ use_cached = false  // whether to use cached value for this mapping element
	){

		const {
			/* string */ name,  // the name of this mapping element
			/* string */ friendly_name,  // the friendly name for this mapping element
			/* object */ fields_data,  // fields data. See more info later in this method
			/* string */ table_name = '',  // the name of the table this mapping element belongs too
			/* string */ mapping_element_type = 'simple'  // the type of this mapping element. Can be either `simple` (for fields and relationships), `to_many` (for reference items) or `tree` (for tree ranks)
		} = mapping_details;

		const field_group_labels = {
			required_fields: 'Required Fields',
			optional_fields: 'Optional Fields',
			hidden_fields: 'Hidden Fields',
		};

		const field_groups = Object.fromEntries(Object.keys(field_group_labels).map((field_group_label) =>
																						[field_group_label, []]
		));

		for (const [field_name, field_data] of Object.entries(fields_data)) {

			const {
				field_friendly_name,  // {string} field label
				is_enabled = true, // {bool} whether field is enabled (not mapped yet)
				is_default = false, // {bool} whether field is selected by default
				table_name = '', // {string} table name for this option
				is_relationship = false // {bool} whether this field is relationship, tree rank or reference item
			} = field_data;

			const field_data_formatted = {
				option_name: field_friendly_name,
				option_value: field_name,
				is_enabled: is_enabled,
				is_relationship: is_relationship,
				is_default: is_default,
				table_name: table_name,
			};

			let field_category = 'optional_fields';
			if (field_data['is_required'])
				field_category = 'required_fields';
			else if (field_data['is_hidden'])
				field_category = 'hidden_fields';

			field_groups[field_category].push(field_data_formatted);

		}


		const table_fields = [];
		for (const [group_name, group_fields] of Object.entries(field_groups))
			if (group_fields.length !== 0)
				table_fields.push({
									  select_group_name: group_name,
									  select_group_label: field_group_labels[group_name],
									  select_options_data: group_fields
								  });

		const select_data = {
			select_type: mapping_element_type,
			select_name: name,
			select_label: friendly_name,
			select_table: table_name,
			select_groups_data: table_fields,
		};

		return custom_select_element.get_element_html(select_data, custom_select_type, use_cached);

	},

	/*
	* Return HTML for a textarea with a given value for a new static header
	* @return {string} HTML for a textarea with a given value for a new static header
	* */
	static_header(
		/* string */ default_value = ''  // the default value of a textarea
	){
		return `<textarea>` + default_value + `</textarea>`;
	},

};

module.exports = html_generator;