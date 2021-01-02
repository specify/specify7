interface ListOfBaseTablesProps {
	list_of_tables: data_model_list_of_tables
}

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

interface MappingLineProps {
	readonly line_data :MappingElementProps[],  // mapping path data. See html_generator.mapping_path() for data structure
	readonly header_data :{
		readonly mapping_type :mapping_type,
		readonly header_name :string,  // if mapping_type is 'new_static_column' - the value of a static filed. Else, the name of the header
	},
	readonly line_attributes? :string[]  // list of classes to be appended to this line
}

interface MappingPathProps {
	mappings_line_data :MappingElementProps[]
}

interface MappingElementProps extends Omit<CustomSelectElementProps, 'select_groups_data'> {
	readonly fields_data :html_generator_fields_data  // fields data. See more info later in this method
}