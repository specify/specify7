// the type of the select element
// Available types:
//  - opened_list - used in the mapping view - list without an `input` box but with always opened list of options and a table name on top
//  - closed_list - used in mapping lines - list with an `input` box and a list of options that can be opened
//  - preview_list - used in the mapping validation results - list with an `input` box but with no list of options
//  - suggestion_list - used on the suggestion lines - list with an `input` box but with no list of options
type custom_select_type = 'opened_list' | 'closed_list' | 'preview_list' | 'suggestion_list'

type custom_select_subtype = 'simple' | 'to_many' | 'tree'  // the type of select element. Can be either `simple` (for fields and relationships), `to_many` (for reference items) or `tree` (for tree ranks)


type handleOptionChange = ()=>void;
type handleElementChange = (new_value:string)=>void;
type handleMappingLineChange = (index: number, new_value: string)=>void;
type handleMappingChange = (line: 'mapping_view'|number, index: number, new_value: string)=>void;
type handleElementOpen = ()=>void;
type handleMappingLineOpen = (index: number)=>void;
type handleMappingOpen = (line: |number,index: number)=>void;

type default_value = '0'

interface CustomSelectElementIconProps {
	is_relationship? :boolean,  // False only if icon is going to be used next to an option label and option is not a relationship
	table_name? :string  // The name of the table to generate icon for
}

interface CustomSelectElementOptionProps {
	readonly option_label? :string|react_element,  // the name of the option. Would be used as a label (visible to the user)
	readonly is_enabled? :boolean,  // True if option can be selected. False if option can not be selected because it was already selected
	readonly is_relationship? :boolean,  // whether the option is a relationship (False for fields, true for relationships, tree ranks and reference items)
	readonly is_default? :boolean,  // whether the option is currently selected
	readonly table_name? :string,  // the name of the table this option represents
	readonly handleClick? :handleOptionChange,
}

interface CustomSelectElementDefaultOptionProps {
	readonly option_name :string
	readonly option_label :string|react_element
	readonly table_name? :string
}

interface CustomSelectElementOptions extends WritableDictionary<CustomSelectElementOptionProps> {}

interface CustomSelectElementOptionGroupProps {
	readonly select_group_label? :string,  // group label (shown to the user)
	readonly select_options_data :CustomSelectElementOptions  // list of options data. See custom_select_element.get_select_option_html() for the data structure
	readonly handleClick? :handleElementChange,
}

interface CustomSelectElementPropsBase {
	readonly select_label? :string,  // the label to use for the element
	readonly custom_select_type :custom_select_type,
	readonly custom_select_subtype? :custom_select_subtype,
	readonly default_option?: undefined|CustomSelectElementDefaultOptionProps,
	readonly is_open: boolean,
	readonly table_name?: string,

	readonly handleOpen?: handleElementOpen,

	readonly handleChange?: handleElementChange,
	readonly handleClose?: ()=>void,
	readonly custom_select_option_groups?: CustomSelectElementOptionGroupProps[],
	readonly automapper_suggestions?: react_element,
}

interface CustomSelectElementPropsClosed extends CustomSelectElementPropsBase {
	readonly is_open: false,
	readonly handleOpen: handleElementOpen,
}

interface CustomSelectElementPropsOpenBase extends CustomSelectElementPropsBase {
	readonly is_open: true,
	readonly handleChange?: handleElementChange
	readonly handleClose?: ()=>void,
}

interface CustomSelectElementPropsOpen extends CustomSelectElementPropsOpenBase {
	readonly custom_select_option_groups: CustomSelectElementOptionGroupProps[],  // list of option group objects. See custom_select_element.get_select_group_html() for more info
	readonly automapper_suggestions?: react_element,
}

type CustomSelectElementProps = CustomSelectElementPropsClosed | CustomSelectElementPropsOpen;