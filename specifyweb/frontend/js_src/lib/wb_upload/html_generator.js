"use strict";


/*
*
* Generate HTML for various control elements created during mapping process
*
* */
const html_generator = {

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

			return `<select data-type="`+mapping_type+`"
						data-table_name="`+table_name+`"
						title="`+friendly_table_name+`"
					>`+
						html_generator.table_fields(fields_data).join('')+
					`</select>`;
		}

		else if(mapping_type === 'headers'){
			const headers_data = mapping_details['headers_data'];
			return html_generator.headers(headers_data).join('');
		}

		else
			return '';

	},

	table_fields(fields_data){

		const field_group_labels = {
			'required_fields': 'Required Fields',
			'optional_fields': 'Optional Fields',
			'hidden_fields': 'Hidden Fields',
		};

		const field_groups = Object.fromEntries(Object.entries(field_group_labels).map(([field_group_label,])=>
			[field_group_label,[]]
		));

		for(const field_data in fields_data){

			const field_html = html_generator.table_field(field_data);

			let field_category = 'optional_fields';
			if(field_data['is_required'])
				field_category = 'required_fields';
			else if(field_data['is_hidden'])
				field_category = 'hidden_fields';

			field_groups[field_category].push(field_html);

		}

		return html_generator.render_groups(field_groups, field_group_labels);

	},

	table_field(field_data){
		const {field_name, field_friendly_name, is_enabled} = field_data;

		const is_enabled_string = is_enabled ? '' : 'disabled';

		return '<option data-field_name="'+field_name+'" '+is_enabled_string+'>'+field_friendly_name+'</option>';
	},

	headers(headers_data){

		const header_group_labels = {
			'recommended_headers': 'Recommended headers',
			'unmapped_headers': 'Unmapped headers',
			'add_new_column': 'Add New Column',
			'mapped_headers': 'Mapped Headers',
		};

		const header_groups = Object.fromEntries(Object.entries(header_group_labels).map(([header_group_label,])=>
			[header_group_label,[]]
		));

		header_groups['add_new_column'] = [
			{
				'header_name': 'new_column',
				'header_friendly_name': 'New Column',
				'is_mapped': false,
			},
			{
				'header_name': 'new_static_column',
				'header_friendly_name': 'New Static Column',
				'is_mapped': false,
			},
		];

		for(const header_data in headers_data){

			const header_html = html_generator.table_field(header_data);

			let header_category = 'unmapped_headers';
			if(header_html['is_mapped'])
				header_category = 'mapped_headers';
			else if(header_html['is_recommended'])
				header_category = 'recommended_headers';

			header_groups[header_category].push(header_html);

		}

		return html_generator.render_groups(header_groups, header_group_labels);

	},

	header(header_data){
		const {header_name, header_friendly_name, is_mapped} = header_data;

		const is_mapped_string = is_mapped ? '' : 'disabled';

		return '<option data-field_name="'+header_name+'" '+is_mapped_string+'>'+header_friendly_name+'</option>';
	},

	render_groups(groups, group_labels){
		return Object.entries(groups).map(([group_name,group_fields])=>{

			if(group_fields.length!==0)
				return `<optgroup class="wbplanview_field_group"
							data-field_group="`+group_name+`"
							label="`+group_labels[group_name]+`"
						>
						`+group_fields.join('')+`						
					</optgroup>`;

		}).join('');
	},

};

module.exports = html_generator;