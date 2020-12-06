// the type of the select element
// Available types:
//  - opened_list - used in the mapping view - list without an `input` box but with always opened list of options and a table name on top
//  - closed_list - used on mapping line - list with an `input` box and a list of options that can be opened
//  - preview_list - used in the mapping validation results - list with an `input` box but with no list of options
//  - suggestion_list - used on the suggestion lines - list with an `input` box but with no list of options
type custom_select_type = 'opened_list'|'closed_list'|'preview_list'|'suggestion_list'

type select_element_type = 'simple'|'to_many'|'tree'  // the type of select element. Can be either `simple` (for fields and relationships), `to_many` (for reference items) or `tree` (for tree ranks)

type default_value = '0'

interface custom_select_element_parameters {
	readonly select_type? :select_element_type,
	readonly select_name? :string,  // the name of the element. used when constructing a mapping path. NOTE: the first element of the line does not have a name as its name is inherited from the base table
	readonly select_label? :string,  // the label to sue for the element
	readonly select_table? :string,  // the name of the table that was used
	readonly select_groups_data :custom_select_element_options_group[],  // list of option group objects. See custom_select_element.get_select_group_html() for more info
}

interface custom_select_element_options_group {
	readonly select_group_name :string,  // group name (used in css and js)
	readonly select_group_label :string,  // group label (shown to the user)
	readonly select_options_data :custom_select_element_option[]  // list of options data. See custom_select_element.get_select_option_html() for the data structure
}

interface custom_select_element_option {
	readonly option_name :string,  // the name of the option. Would be used as a label (visible to the user)
	readonly option_value :string,  // the value of the option. Would be used to construct a mapping path
	is_enabled? :boolean,  // True if option can be selected. False if option can not be selected because it was already selected
	readonly is_relationship? :boolean,  // whether the option is a relationship (False for fields, true for relationships, tree ranks and reference items)
	readonly is_default? :boolean,  // whether the option is currently selected
	readonly table_name? :string,  // the name of the table this option represents
}

interface custom_select_element_change_payload {
	changed_list: HTMLSpanElement,  // the list that was changed
	selected_option: HTMLSpanElement,  // the option that was changed
	new_value: string,  // the new value of the list
	list_type: string,  // the type of the changed list
	previous_value: string|default_value,  // previous value of this select_element
	previous_previous_value: string|default_value,  // previous previous value of this select_element
	is_relationship: boolean,  // whether new value is a relationship
	custom_select_type: string,  // the type of the custom select element
	list_table_name: string,  // the name of the table the list belongs too
	/*
	* if value not changed or option not found or option is disabled:
	* 	return undefined
	* else if clicked on suggested mapping line:
	* 	return {
	*       changed_list: target_list,
	*       selected_option: target_option,
	*       new_value: custom_select_option_value,
	*       list_type: 'suggested_mapping',
	*       previous_value: '',
	*       previous_previous_value: '',
	*       is_relationship: '',
	*       custom_select_type: '',
	*       list_table_name: '',
	*	}
	* else:
	* 	{
	*       changed_list: target_list,
	*       selected_option: target_option,
	*       new_value: custom_select_option_value,
	*       previous_value: previous_list_value,
	*       previous_previous_value: previous_previous_value,
	*       is_relationship: is_relationship,
	*       list_type: list_type,
	*       custom_select_type: custom_select_type,
	*       list_table_name: list_table_name,
	*	}
	* */
}