"use strict";

const custom_select_element = require('./custom_select_element.js');


/*
*
* Generate HTML for various control elements created during mapping process
*
* */
const html_generator = {

	/*
	* Generates HTML for table (for table selection screen)
	* @param {string} table_name - Official name of the table (from data model)
	* @param {string} table_friendly_name - Human-friendly table name (from schema_localization or helper.get_friendly_name())
	* @return {string} HTML for table
	* */
	table(table_name, table_friendly_name){
		return '<a class="wbplanview_table" href="#' + table_name + '" data-table_name="' + table_name + '">' + table_friendly_name + '</a>';
	},

	tables(list_of_tables){

		const fields_data = Object.fromEntries(Object.entries(list_of_tables).map(([table_name, table_label])=>
			[
				table_name,
				{
					field_friendly_name: table_label,
					table_name: table_name,
					is_relationship:true
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

	mapping_view(mappings_view_data, use_cached){
		return html_generator.mapping_path(mappings_view_data, 'opened_list', use_cached);
	},

	mapping_line(mappings_line_data, use_cached){
		/*
		* mappings_line_data {array}:
		* 	mapping_element_type: 'simple'||'to_many'||'tree'
		*
		* */

		const {
			line_data,
			header_data: {
				mapping_type,
				header_name
			}
		} = mappings_line_data;

		let header_html;
		if(mapping_type === 'new_static_column')
			header_html = html_generator.static_header(header_name);
		else
			header_html = header_name;

		return `<div class="wbplanview_mappings_line">
					<div class="wbplanview_mappings_line_controls">
						<button class="wbplanview_mappings_line_delete" title="Clear mapping"><img src="../../../static/img/discard.svg" alt="Clear mapping"></button>
					</div>
					<div class="wbplanview_mappings_line_header">`+header_html+`</div>
					<div class="wbplanview_mappings_line_elements">
						` + html_generator.mapping_path(line_data, 'closed_list', use_cached) + `
					</div>
				</div>`;
	},

	mapping_path: (mappings_line_data, custom_select_type='closed_list', use_cached=false) =>
		mappings_line_data.map(mapping_details =>
			html_generator.mapping_element(
				mapping_details,
				custom_select_type,
				use_cached,
			)
		).join(''),

	mapping_element(mapping_details, custom_select_type='closed_list', use_cached=false){

		const {
			name,
			friendly_name,
			fields_data,
			table_name='',
			mapping_element_type='simple'
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
				field_friendly_name,
				is_enabled= true,
				is_default= false,
				table_name='',
				is_relationship=false
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
		for(const [group_name, group_fields] of Object.entries(field_groups))
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

		return custom_select_element.new_select_html(select_data, custom_select_type, use_cached);

	},

	static_header(default_value){
		return `<textarea>`+default_value+`</textarea>`;
	},

};

module.exports = html_generator;