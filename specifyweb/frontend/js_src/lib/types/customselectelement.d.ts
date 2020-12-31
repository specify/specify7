// the type of the select element
// Available types:
//  - opened_list - used in the mapping view - list without an `input` box but with always opened list of options and a table name on top
//  - closed_list - used on mapping line - list with an `input` box and a list of options that can be opened
//  - preview_list - used in the mapping validation results - list with an `input` box but with no list of options
//  - suggestion_list - used on the suggestion lines - list with an `input` box but with no list of options
type custom_select_type = 'opened_list' | 'closed_list' | 'preview_list' | 'suggestion_list'

type custom_select_subtype = 'simple' | 'to_many' | 'tree'  // the type of select element. Can be either `simple` (for fields and relationships), `to_many` (for reference items) or `tree` (for tree ranks)

type default_value = '0'

interface CustomSelectElementIconProps {
	is_relationship :boolean,  // False only if icon is going to be used next to an option label and option is not a relationship
	table_name :string  // The name of the table to generate icon for
}

interface CustomSelectElementOptionProps {
	readonly option_name? :string,  // the name of the option. Would be used as a label (visible to the user)
	is_enabled? :boolean,  // True if option can be selected. False if option can not be selected because it was already selected
	readonly is_relationship? :boolean,  // whether the option is a relationship (False for fields, true for relationships, tree ranks and reference items)
	readonly is_default? :boolean,  // whether the option is currently selected
	readonly table_name? :string,  // the name of the table this option represents
}

interface CustomSelectElementOptionGroupProps {
	readonly select_group_label :string,  // group label (shown to the user)
	readonly select_options_data :CustomSelectElementOptionProps[]  // list of options data. See custom_select_element.get_select_option_html() for the data structure
}

interface CustomSelectElementProps {
	readonly select_label? :string,  // the label to sue for the element
	readonly select_groups_data :CustomSelectElementOptionGroupProps[],  // list of option group objects. See custom_select_element.get_select_group_html() for more info
	readonly custom_select_type: custom_select_type,
	readonly custom_select_subtype: custom_select_subtype,
}

interface custom_select_element_change_payload {
	readonly changed_list :HTMLSpanElement,  // the list that was changed
	readonly selected_option :HTMLSpanElement,  // the option that was changed
	readonly new_value :string,  // the new value of the list
	readonly list_type :string,  // the type of the changed list
	readonly previous_value :string | default_value,  // previous value of this select_element
	readonly previous_previous_value :string | default_value,  // previous previous value of this select_element
	readonly is_relationship :boolean,  // whether new value is a relationship
	readonly custom_select_type :string,  // the type of the custom select element
	readonly list_table_name :string,  // the name of the table the list belongs too
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