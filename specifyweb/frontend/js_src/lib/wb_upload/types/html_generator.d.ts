interface html_generator_field_data {
	readonly field_friendly_name :string,
	readonly is_enabled? :boolean,
	readonly is_required? :boolean,
	readonly is_hidden? :boolean,
	readonly is_default? :boolean,
	readonly is_relationship? :boolean,
	readonly table_name? :string,
}

interface html_generator_fields_data {
	readonly [field_name :string] :html_generator_field_data
}

interface mapping_element_parameters {
	readonly name :string,  // the name of this mapping element
	readonly friendly_name :string,  // the friendly name for this mapping element
	readonly fields_data :html_generator_fields_data  // fields data. See more info later in this method
	readonly table_name? :string  // the name of the table this mapping element belongs too
	readonly mapping_element_type? :string  // the type of this mapping element. Can be either `simple` (for fields and relationships), `to_many` (for reference items) or `tree` (for tree ranks)
}

interface mapping_line_parameters {
	readonly line_data :mapping_element_parameters[],  // mapping path data. See html_generator.mapping_path() for data structure
	readonly header_data :{
		readonly mapping_type :mapping_type,
		readonly header_name :string,  // if mapping_type is 'new_static_column' - the value of a static filed. Else, the name of the header
	},
	readonly line_attributes? :string[]  // list of classes to be appended to this line
}