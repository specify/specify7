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
	new_table: (table_name, friendly_table_name) => {

		return '<label>' +
			'		<input type="radio" name="table" class="radio__table" data-table="' + table_name + '">' +
			'		<div tabindex="0" class="line">' +
			'			<div class="mapping">' + friendly_table_name + '</div>' +
			'		</div>' +
			'	</label>';

	},

	/*
	* Generates HTML for a new header (either static or not)
	* @param {string} header_name - name of the header / value of a static field
	* @param {string} [header_type='unmapped_header'] - unmapped_header (default) / mapped_header / static_header
	* @return {string} HTML for a new header
	* */
	new_header: (header_name, header_type = 'unmapped_header') => {

		let control_element;
		let header_name_attribute = '';
		let mapping_element = html_generator.mapped_header_mapping;

		if (header_type === 'static_header')
			control_element = '<textarea class="value">' + header_name + '</textarea>';
		else {
			control_element = '<div class="header">' + header_name + '</div>';

			if (header_type === 'mapped_header')
				header_name_attribute = ' data-header="' + header_name + '"';
			else if (header_type === 'unmapped_header')
				mapping_element = html_generator.unmapped_header_mapping;
		}

		return '<label>' +
			'		<input type="radio" name="header" class="radio__header" ' + header_name_attribute + '>' +
			'		<div tabindex="0" class="line">' +
			'			' + mapping_element +
			'			' + control_element +
			'		</div>' +
			'	</label>';
	},

	/*
	* Generates HTML for field or relationship of base table
	* @param {string} field_name - Official name of the field (from data model)
	* @param {string} friendly_field_name - Human-friendly field name (from schema_localization or helper.get_friendly_name())
	* @param {bool} [is_tree=true] - Whether base table is a tree
	* @param {string} [class_append=''] - Classes to append to the resulting line. E.x `relationship` to identify relationships
	* @return {string} HTML for field or relationship of base table
	* */
	new_base_field: (field_name, friendly_field_name, is_tree = false, class_append = '') => {

		const is_tree_class = is_tree ? ' tree' : '';

		if (is_tree)
			class_append = 'relationship';

		return '<label class="table_fields">' +
			'		<input type="radio" name="field" class="radio__field ' + is_tree_class + '" data-field="' + field_name + '">' +
			'		<div tabindex="0" class="line ' + class_append + '">' +
			'			<div class="row_name">' + friendly_field_name + '</div>' +
			'		</div>' +
			'	</label>';
	},

	/*
	* Generates HTML for relationship with depth of 2 or more (by creating <select> element)
	* @param {string} table_name - Official name of the parent table this relationship belongs to (from data model)
	* @param {array} optional_fields_array - Array of optional fields. Format: [field_value, field_name, is_enabled]
	* 								{string} Official name of the field (from data model)
	* 								{string} Human-friendly field name (from schema_localization or helper.get_friendly_name())
	* 								{bool} Whether this field is enabled
	* @param {array} required_fields_array - same as fields_array, but consists of required fields
	* @return {string} HTML for relationship with depth of 2 or more
	* */
	new_relationship_fields: (table_name, optional_fields_array, required_fields_array = []) => {

		function fields_array_to_html(fields_data, label, other_fields_length) {

			let result = fields_data.map((field_data) => {

				let [field_value, field_name, is_enabled] = field_data;

				let field_enabled_attribute = is_enabled ? '' : ' disabled';

				return '<option value="' + field_value + '"' + field_enabled_attribute + '>' + field_name + '</option>';

			}).join('');

			if (result === '')
				return '';

			if(other_fields_length===0)
				return result;

			return '<optgroup label="' + label + '">' + result + '</optgroup>';

		}


		return '<div class="table_relationship">' +
			'<input type="radio" name="field" class="radio__field" data-field="relationship">' +
			'<label class="line">' +
			'	<select name="' + table_name + '" class="select__field">' +
			'		<option value="0"></option>' +
			'		' + fields_array_to_html(required_fields_array, 'Required Fields', optional_fields_array.length) +
			'		' + fields_array_to_html(optional_fields_array, 'Optional Fields', required_fields_array.length) +
			'	</select>' +
			'</label>' +
			'</div>';
	},

};

module.exports = html_generator;