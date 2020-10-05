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
	* @param {string} table_friendly_name - Human-friendly table name (from schema_localization or helper.get_friendly_name())
	* @return {string} HTML for table
	* */
	table(table_name, table_friendly_name){
		return '<a class="wbplanview_table" href="#'+table_name+'" data-table_name="'+table_name+'">'+table_friendly_name+'</a>';
	},

	mapping_line(mappings_line_data){
		/*
		* mappings_line_data {array}:
		* 	mapping_type: 'table'||'tree'||'headers'||'textarea'
		* 	if mapping_type=='table' || mapping_type=='field':
		*
		* */
		return `<div class="wbplanview_mappings_line">
			<div class="wbplanview_mappings_line_controls">
				<button class="wbplanview_mappings_line_delete" title="Delete mapping"><img src="../../../static/img/delete.svg" alt="Delete"></button>
				<button class="wbplanview_mappings_line_duplicate" title="Duplicate mapping"><img src="../../../static/img/copy.svg" alt="Duplicate"></button>
				<button class="wbplanview_mappings_line_move_up" title="Move mapping up"><img src="../../../static/img/arrow.svg" class="rotate-270" alt="Move up"></button>
				<button class="wbplanview_mappings_line_move_down" title="Move mapping down"><img src="../../../static/img/arrow.svg" class="rotate-90" alt="Move down"></button>
			</div>
			<div class="wbplanview_mappings_line_elements">
				`+html_generator.mapping_path(mappings_line_data)+`
			</div>`;
	},

	mapping_path(mappings_line_data){
		return mappings_line_data.map(html_generator.mapping_element).join('');
	},

	mapping_element(mapping_details) {

		const {mapping_type} = mapping_details;

		if (mapping_type === 'static_value'){
			const {static_value} = mapping_details
			return `<textarea>`+static_value+`</textarea>`;
		}

		let attributes='';
		let children='';

		if(mapping_type === 'table' || mapping_type === 'tree'){
			const {name, friendly_name, fields_data} = mapping_details;

			attributes = 'data-name="'+name+'" title="'+friendly_name+'"';
			children = html_generator.table_fields(fields_data);
		}

		else if(mapping_type === 'headers'){
			const {headers_data} = mapping_details;
			children = html_generator.headers(headers_data);
		}

		return `<select data-type="`+mapping_type+`" `+attributes+`>`
				+ `<option value="0"></option>`
				+ children
			+ `</select>`;

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

		for(const [field_name,field_data] of Object.entries(fields_data)){

			const field_html = html_generator.table_field(field_name,field_data);

			let field_category = 'optional_fields';
			if(field_data['is_required'])
				field_category = 'required_fields';
			else if(field_data['is_hidden'])
				field_category = 'hidden_fields';

			field_groups[field_category].push(field_html);

		}

		return html_generator.render_groups(field_groups, field_group_labels);

	},

	table_field(field_name,field_data){
		const {field_friendly_name, is_enabled} = field_data;

		const is_enabled_string = is_enabled ? '' : 'disabled';

		return '<option value="'+field_name+'" '+is_enabled_string+'>'+field_friendly_name+'</option>';
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

		for(const [header_name,header_data] of Object.entries(headers_data)){

			const header_html = html_generator.table_field(header_name);

			let header_category = 'unmapped_headers';
			if(header_html['is_mapped'])
				header_category = 'mapped_headers';
			else if(header_html['is_recommended'])
				header_category = 'recommended_headers';

			header_groups[header_category].push(header_html);

		}

		return html_generator.render_groups(header_groups, header_group_labels);

	},

	header(header_name, header_data){
		const {header_friendly_name, is_mapped} = header_data;

		const is_mapped_string = is_mapped ? '' : 'disabled';

		return '<option value="'+header_name+'" '+is_mapped_string+'>'+header_friendly_name+'</option>';
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