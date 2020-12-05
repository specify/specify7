interface get_element_html_parameters {
	readonly select_type? :string,
	readonly select_name? :string,
	readonly select_label? :string,
	readonly select_table? :string,
	readonly select_groups_data? :get_select_group_html_parameters[],
}

interface get_select_group_html_parameters {
	readonly select_group_name :string,
	readonly select_group_label :string,
	readonly select_options_data :get_select_option_html_parameters[]
}

interface get_select_option_html_parameters {
	readonly option_name :string,
	readonly option_value :string,
	readonly is_enabled? :boolean,
	readonly is_relationship? :boolean,
	readonly is_default? :boolean,
	readonly table_name? :string,
}