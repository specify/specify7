interface header_data {
	mapping_type :mapping_type,
	header_name :string
}

interface add_new_mapping_line_parameters {
	position? :number,  // position of the new line. If negative, start from the back
	mapping_path? :mapping_path,  // mapping path to use for the new mapping line
	header_data :header_data,  // {'mapping_type':<mapping_type>,{'header_name'}:<header_name>} where mapping_type is `existing_header`/`new_column`/`new_static_column` and header_name is the value of the static column or the name of the header
	blind_add_back? :boolean,  // whether to add to the back without checking if the header already exists
	line_attributes? :string[],  // array of classes to append to each line's classname
	scroll_down? :boolean  // whether to scroll the list of mapping lines down to make the newly created line visible on the screen
	update_all_lines? :boolean  // whether to update all lines
}

interface get_mapping_line_data_from_mapping_path_parameters {
	mapping_path? :mapping_path,  // {array} the mapping path
	iterate? :boolean,  // {bool} if False, returns data only for the last element of the mapping path only, Else returns data for each mapping path part
	use_cached? :boolean,  // {bool} whether to use cache if exists
	generate_last_relationship_data? :boolean  // {bool} whether to generate data for the last element of the mapping path if the last element is a relationship
}

interface get_mapping_line_data_from_mapping_path_internal_payload {
	mapping_path :mapping_path,
	generate_last_relationship_data :boolean,
	mapping_path_position :number,
	iterate :boolean,
	mapping_line_data :[],
}

interface get_mapping_path_parameters {
	line_elements_container :HTMLElement,  // line elements container
	mapping_path_filter? :HTMLElement | mapping_path,  // {mixed} if is {array} mapping path and mapping path of this line does begin with mapping_path_filter, get_mapping_path would return ["0"]
	//													  if is {HTMLElement}, then stops when reaches a given element in a line_elements_container
	include_headers? :boolean  // whether to include mapping type and header_name / static column value in the result
	exclude_unmapped? :boolean,  // whether to replace incomplete mapping paths with ["0"]
	exclude_non_relationship_values? :boolean,  // whether to exclude simple fields from the resulting path
}