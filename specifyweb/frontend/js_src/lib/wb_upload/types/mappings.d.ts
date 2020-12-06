interface header_data {
	readonly mapping_type :mapping_type,
	header_name :string
}

interface add_new_mapping_line_parameters {
	readonly position? :number,  // position of the new line. If negative, start from the back
	readonly mapping_path? :mapping_path,  // mapping path to use for the new mapping line
	readonly header_data :header_data,  // {'mapping_type':<mapping_type>,{'header_name'}:<header_name>} where mapping_type is `existing_header`/`new_column`/`new_static_column` and header_name is the value of the static column or the name of the header
	readonly blind_add_back? :boolean,  // whether to add to the back without checking if the header already exists
	readonly line_attributes? :string[],  // array of classes to append to each line's classname
	readonly scroll_down? :boolean  // whether to scroll the list of mapping lines down to make the newly created line visible on the screen
	readonly update_all_lines? :boolean  // whether to update all lines
}

interface get_mapping_line_data_from_mapping_path_internal_payload {
	readonly mapping_path :mapping_path,
	readonly generate_last_relationship_data :boolean,
	readonly mapping_path_position :number,
	readonly iterate :boolean,
	readonly mapping_line_data :[],
}

interface get_mapping_path_parameters {
	readonly line_elements_container :HTMLElement,  // line elements container
	readonly mapping_path_filter? :HTMLElement | mapping_path,  // {mixed} if is {array} mapping path and mapping path of this line does begin with mapping_path_filter, get_mapping_path would return ["0"]
	//													  if is {HTMLElement}, then stops when reaches a given element in a line_elements_container
	readonly include_headers? :boolean  // whether to include mapping type and header_name / static column value in the result
	readonly exclude_unmapped? :boolean,  // whether to replace incomplete mapping paths with ["0"]
	readonly exclude_non_relationship_values? :boolean,  // whether to exclude simple fields from the resulting path
}