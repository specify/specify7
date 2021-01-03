interface ListOfBaseTablesProps {
	list_of_tables: data_model_list_of_tables
	handleChange: handleChange,
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

interface MappingLineProps {
	readonly line_data :MappingElementProps[],
	readonly mapping_type :mapping_type,
	readonly header_name :string,
	readonly is_focused :boolean,
	readonly handleFocus : ()=>void,
}

interface MappingPathProps {
	mappings_line_data :MappingElementProps[]
}

interface html_generator_fields_data extends Dictionary<html_generator_field_data>{
}

interface MappingElementPropsOpen extends Omit<CustomSelectElementPropsOpen, 'custom_select_option_groups'>  {
	readonly fields_data :html_generator_fields_data
}

type MappingElementProps = MappingElementPropsOpen | CustomSelectElementPropsClosed;