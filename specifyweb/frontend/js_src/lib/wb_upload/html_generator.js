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
		return '<a class="wbplanview_table" href="#' + table_name + '" data-table_name="' + table_name + '">' + table_friendly_name + '</a>';
	},

	mapping_line(mappings_line_data){
		/*
		* mappings_line_data {array}:
		* 	mapping_element_type: 'simple'||'to_many'||'tree'
		*
		* */

		console.log(mappings_line_data);

		const {line_data, header_data: {mapping_type, header_name}} = mappings_line_data;

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
				` + html_generator.mapping_path(line_data) + `
			</div>`;
	},

	mapping_path(mappings_line_data){
		return mappings_line_data.map(html_generator.mapping_element).join('');
	},

	mapping_element(mapping_details){

		const {name, friendly_name, fields_data, table_name, mapping_element_type} = mapping_details;

		const field_group_labels = {
			required_fields: 'Required Fields',
			optional_fields: 'Optional Fields',
			hidden_fields: 'Hidden Fields',
		};

		const field_groups = Object.fromEntries(Object.entries(field_group_labels).map(([field_group_label,]) =>
			[field_group_label, []]
		));

		for (const [field_name, field_data] of Object.entries(fields_data)) {

			const field_html = html_generator.table_field(field_name, field_data);

			let field_category = 'optional_fields';
			if (field_data['is_required'])
				field_category = 'required_fields';
			else if (field_data['is_hidden'])
				field_category = 'hidden_fields';

			field_groups[field_category].push(field_html);

		}

		const table_fields =  Object.entries(field_groups).map(([group_name, group_fields]) => {

			if (group_fields.length !== 0)
				return `<optgroup class="wbplanview_field_group"
							data-field_group="` + group_name + `"
							label="` + field_group_labels[group_name] + `"
						>
						` + group_fields.join('') + `						
					</optgroup>`;

		}).join('');

		return `<select data-type="` + mapping_element_type + `"
						name="` + name + `"
						data-type="` + mapping_element_type + `"
						data-table="` + table_name + `"
						title="` + friendly_name + `">
					<option value="0"></option>`
					+ table_fields +
				`</select>`;

	},

	table_field(field_name, field_data){
		const {field_friendly_name, is_enabled, is_default} = field_data;

		const attributes = [];

		if(!is_enabled)
			attributes.push('disabled');
		if(is_default)
			attributes.push('selected');

		return '<option value="' + field_name + '" ' + attributes.join(' ') + '>' + field_friendly_name + '</option>';
	},

	static_header(default_value){
		return `<textarea>`+default_value+`</textarea>`;
	},

};

module.exports = html_generator;