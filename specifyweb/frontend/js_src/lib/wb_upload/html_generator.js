"use strict";


/*
*
* Generate HTML for various control elements created during mapping process
*
* */
const html_generator = {

	unmapped_header_mapping: '<div class="mapping undefined"></div>',
	mapped_header_mapping: '<div class="mapping"></div>',

	/*
	* Generates HTML for table (for table selection screen)
	* @param {string} table_name - Official name of the table (from data model)
	* @param {string} friendly_table_name - Human-friendly table name (from schema_localization or helper.get_friendly_name())
	* @return {string} HTML for table
	* */
	table(table_name, friendly_table_name){
		return '<a class="wbplanview_table" href="#'+table_name+'" data-table_name="'+table_name+'">'+friendly_table_name+'</a>';
	},

	mapping_line(mappings_path){
		/*
		* mappings_path {array}:
		* 	mapping_type: 'table'||'tree'||'headers'||'textarea'
		* 	if mapping_type=='table' || mapping_type=='field':
		*
		* */
		return `<div class="wbplanview_mappings_line">
			<div class="wbplanview_mappings_line_controls">
				<button class="wbplanview_mappings_line_delete" title="Delete mapping"><img src="../../../static/img/delete.svg" alt="Delete"></button>
				<button class="wbplanview_mappings_line_duplicate" title="Duplicate mapping"><img src="../../../static/img/duplicate.svg" alt="Duplicate"></button>
				<button class="wbplanview_mappings_line_move_up" title="Move mapping line up"><img src="../../../static/img/arrow.svg" alt="Duplicate" class="rotate-90-ccw"></button>
				<button class="wbplanview_mappings_line_move_down" title="Move mapping line down"><img src="../../../static/img/arrow.svg" alt="Duplicate" class="rotate-90"></button>
			</div>
			<div class="wbplanview_mappings_line_elements">
				`+html_generator.mapping_path(mappings_path)+`
			</div>`;
	},

	mapping_path(mappings_path){
		return mappings_path.map(html_generator.mapping_element).join('');
	},

	mapping_element(mapping_details){

		const mapping_type = mapping_details['mapping_type'];

		if(mapping_type === 'table' || mapping_type === 'tree'){

			const [table_name, friendly_table_name, fields_data] = mapping_details;

			return '<select data-type="'+mapping_type+'" data-table_name="'+table_name+'" title="'+friendly_table_name+'">'+
				html_generator.table_fields(fields_data).join('')+
				'</select>';
		}

		else if(mapping_type === 'headers'){
			const headers_data = mapping_details['headers_data'];
			return html_generator.headers(headers_data).join('');
		}

		else
			return '';

	},

	table_fields(fields_data){

		const field_groups = {
			'required_fields': [],
			'optional_fields': [],
			'hidden_fields': [],
		};

		const field_group_labels = {

		};

		for(const field_data in fields_data){

			const field_html = html_generator.table_field(field_data);

			let field_category = 'optional_fields';
			if(field_data['is_required'])
				field_category = 'required_fields';
			else if(field_data['is_hidden'])
				field_category = 'hidden_fields';

			field_groups['required_fields'].push(field_html);

		}

		const result = [];

		return result.join('');

	},

	table_field(field_data){
		//is_required
		//is_enabled
	},

	headers(headers_data){
		return headers_data.map(html_generator.header).join('');
	},

	header(header_data){
		//is_recommended
		//is_enabled
		const {header_name, header_friendly_name, header_type} = header_data;
	},

};

module.exports = html_generator;