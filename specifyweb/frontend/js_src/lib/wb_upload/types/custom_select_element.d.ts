interface custom_select_element {
	readonly select_type? :string,
	readonly select_name? :string,
	readonly select_label? :string,
	readonly select_table? :string,
	readonly select_groups_data :custom_select_element_options_group[],
}

interface custom_select_element_options_group {
	readonly select_group_name :string,
	readonly select_group_label :string,
	readonly select_options_data :custom_select_element_option[]
}

interface custom_select_element_option {
	readonly option_name :string,
	readonly option_value :string,
	is_enabled? :boolean,
	readonly is_relationship? :boolean,
	readonly is_default? :boolean,
	readonly table_name? :string,
}