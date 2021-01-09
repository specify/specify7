// the type of the select element
// Available types:
//  - opened_list - used in the mapping view - list without an `input` box but with always opened list of options and a table name on top (has onChange event)
//  - closed_list - used in mapping lines - list with an `input` box and a list of options that can be opened (has onOpen/onClose and onChange events)
//  - preview_list - used in the mapping validation results - list with an `input` box but with no list of options (has no events)
//  - suggestion_list - used to display a list of automapper suggestions. like opened_list, but without a table name on top (has onChange event)
//  - suggestion_line_list - used inside of `suggestion_list` to display a mapping path element for a single suggestion line - list with an `input` box but with no list of options (has no events)
//  - base_table_selection_list - used for base table selection - similar to opened_list, but without header and option group labels (has onChange event)
type custom_select_type = 'opened_list' | 'closed_list' | 'preview_list' | 'suggestion_list' | 'suggestion_line_list' | 'base_table_selection_list'

type custom_select_subtype = 'simple' | 'to_many' | 'tree'  // the type of select element. Can be either `simple` (for fields and relationships), `to_many` (for reference items) or `tree` (for tree ranks)


type handleOptionChange = ()=>void;
type handleElementChange = (new_value:string, is_relationship: boolean)=>void;
type handleMappingLineChange = (index: number, new_value: string, is_relationship: boolean)=>void;
type handleMappingChange = (line: 'mapping_view'|number, index: number, new_value: string, is_relationship: boolean)=>void;
type handleElementOpen = ()=>void;
type handleMappingLineOpen = (index: number)=>void;
type handleMappingOpen = (line: |number,index: number)=>void;

type default_value = '0'

interface CustomSelectElementIconProps {
	readonly is_relationship? :boolean,  // whether the option is a relationship (False for fields, true for relationships, tree ranks and reference items)
	readonly is_default? :boolean,  // whether the option is currently selected
	readonly table_name? :string,  // the name of the table this option represents
	readonly option_label? :string|react_element,  // the name of the option. Would be used as a label (visible to the user)
	readonly is_enabled? :boolean,  // True if option can be selected. False if option can not be selected because it was already selected
}

interface CustomSelectElementOptionProps extends CustomSelectElementIconProps{
	readonly handleClick? :handleOptionChange,
}

interface CustomSelectElementDefaultOptionProps {
	readonly option_name :string
	readonly option_label :string|react_element
	readonly table_name? :string
	readonly is_relationship? :boolean
}

interface CustomSelectElementOptions extends Record<string, CustomSelectElementOptionProps> {}

interface CustomSelectElementOptionGroupProps {
	readonly select_group_name?: string,  // group's name (used for styling)
	readonly select_group_label? :string,  // group's label (shown to the user)
	readonly select_options_data :CustomSelectElementOptions  // list of options data. See custom_select_element.get_select_option_html() for the data structure
	readonly handleClick? :handleElementChange,
}

interface ShadowListOfOptionsProps {
	readonly field_names: string[],
}

interface CustomSelectElementOptionGroups extends Record<string,CustomSelectElementOptionGroupProps> {}

interface CustomSelectElementPropsBase {
	readonly select_label? :string,  // the label to use for the element
	readonly custom_select_type :custom_select_type,
	readonly custom_select_subtype? :custom_select_subtype,
	readonly default_option?: CustomSelectElementDefaultOptionProps,
	readonly is_open: boolean,
	readonly table_name?: string,

	readonly handleOpen?: handleElementOpen,
	readonly field_names?: string[],

	readonly handleChange?: handleElementChange,
	readonly handleClose?: ()=>void,
	readonly autoscroll?: boolean,
	readonly custom_select_option_groups?: CustomSelectElementOptionGroups,
	readonly automapper_suggestions?: react_element,
}

interface CustomSelectElementPropsClosed extends CustomSelectElementPropsBase {
	readonly is_open: false,
	readonly handleOpen: handleElementOpen,
	readonly field_names: string[],
}

interface CustomSelectElementPropsOpenBase extends CustomSelectElementPropsBase {
	readonly is_open: true,
	readonly handleChange?: handleElementChange
	readonly handleClose?: ()=>void,
	readonly autoscroll?: boolean,
}

interface CustomSelectElementPropsOpen extends CustomSelectElementPropsOpenBase {
	readonly custom_select_option_groups: CustomSelectElementOptionGroups,  // list of option group objects. See custom_select_element.get_select_group_html() for more info
	readonly automapper_suggestions?: react_element,
}

type CustomSelectElementProps = CustomSelectElementPropsClosed | CustomSelectElementPropsOpen;

interface SuggestionBoxProps extends Partial<CustomSelectElementPropsOpen> {
	readonly select_options_data: CustomSelectElementOptions,
	readonly handleAutomapperSuggestionSelection: (suggestion:string)=>void,
}