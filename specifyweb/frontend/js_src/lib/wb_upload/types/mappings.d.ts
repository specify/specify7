interface header_data {
	mapping_type :mapping_type,
	header_name :string
}

interface add_new_mapping_line_parameters {
	position? :number,
	mapping_path? :mapping_path,
	header_data :header_data,
	blind_add_back? :boolean,
	line_attributes? :string[],
	scroll_down? :boolean
}

interface get_mapping_line_data_from_mapping_path_parameters {
	mapping_path? :mapping_path,
	iterate? :boolean,
	use_cached? :boolean,
	generate_last_relationship_data? :boolean
}

interface get_mapping_line_data_from_mapping_path_internal_payload {
	mapping_path :mapping_path,
	generate_last_relationship_data :boolean,
	mapping_path_position :number,
	iterate :boolean,
	mapping_line_data :[],
}

interface get_mapping_path_parameters {
	line_elements_container :HTMLElement,
	mapping_path_filter? :HTMLElement | mapping_path,
	include_headers? :boolean
	exclude_unmapped? :boolean,
	exclude_non_relationship_values? :boolean,
}

interface custom_select_change_event_parameters {
	changed_list :HTMLElement,
	selected_option :HTMLElement,
	new_value :string,
	is_relationship :boolean,
	list_type :string,
	custom_select_type :string,
	list_table_name :string,
}