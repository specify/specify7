interface find_next_navigation_direction_base {
	finished: boolean,
}

interface find_next_navigation_direction_finished<RETURN_STRUCTURE> extends find_next_navigation_direction_base {
	finished: true,
	final_data: RETURN_STRUCTURE[],
}

interface find_next_navigation_direction_not_finished extends find_next_navigation_direction_base {
	finished: false,
	payload: find_next_navigation_direction_not_finished_payload,
}

interface find_next_navigation_direction_not_finished_payload {
	next_table_name: string,
	next_parent_table_name: string,
	next_real_path_element_name: string,
	next_path_element_name: string,
}

type find_next_navigation_direction<RETURN_STRUCTURE> = find_next_navigation_direction_finished<RETURN_STRUCTURE> |
	find_next_navigation_direction_not_finished;

interface navigator_parameters<RETURN_STRUCTURE> {
	// Callbacks can be modified depending on the need to make navigator versatile
	readonly callbacks: navigator_callbacks<RETURN_STRUCTURE>,
	// {object|undefined} used internally to make navigator call itself multiple times
	readonly recursive_payload?: navigator_recursive_payload
	readonly config: {
		readonly base_table_name?: string  // the name of the base table to use
	}
}

interface navigator_callback_payload<RETURN_TYPE> {
	table_name: string,
	data?: RETURN_TYPE,
	parent_relationship_type?: relationship_type,
	parent_table_name?: string,
}

type readonly_navigator_callback_payload<RETURN_TYPE> = Readonly<navigator_callback_payload<RETURN_TYPE>>

interface navigator_next_path_element {
	readonly next_path_element_name: string,  // the name of the next path element
	// if the next path element is not a field nor a relationship, {undefined}.
	// Else, {object} the information about a field from data_model.tables
	readonly next_path_element: data_model_field,
	// If next_path_element_name is not a field nor a relationships, {string} current path element name.
	// Else next_path_element_name
	readonly next_real_path_element_name: string,
}

type navigator_callback_function<RETURN_STRUCTURE, RETURN_TYPE> = (
	callback_payload: readonly_navigator_callback_payload<RETURN_STRUCTURE>
) => RETURN_TYPE;

interface navigator_callbacks<RETURN_STRUCTURE> {
	// should return {boolean} specifying whether to run data_model.navigator_instance() for a particular mapping path part
	readonly iterate: navigator_callback_function<RETURN_STRUCTURE,boolean>,
	// should return undefined if next element does not exist
	readonly get_next_path_element: navigator_callback_function<RETURN_STRUCTURE,navigator_next_path_element | undefined>,
	// formats internal_payload and returns it. Would be used as a return value for the navigator
	readonly get_final_data: navigator_callback_function<RETURN_STRUCTURE,RETURN_STRUCTURE[]>,
	// commits callback_payload.data to internal_payload and returns committed data
	readonly get_instance_data: navigator_callback_function<RETURN_STRUCTURE,RETURN_STRUCTURE>,
	// commits callback_payload.data to internal_payload and returns committed data
	readonly commit_instance_data: navigator_callback_function<RETURN_STRUCTURE,RETURN_STRUCTURE>,
	// called inside of navigator_instance before it calls callbacks for tree ranks / reference items / simple fields
	readonly navigator_instance_pre: navigator_callback_function<RETURN_STRUCTURE,void>,
	// handles to_many children
	readonly handle_to_many_children: navigator_callback_function<RETURN_STRUCTURE,void>,
	// handles tree ranks children
	readonly handle_tree_ranks: navigator_callback_function<RETURN_STRUCTURE,void>,
	// handles fields and relationships
	readonly handle_simple_fields: navigator_callback_function<RETURN_STRUCTURE,void>,
}

interface navigator_recursive_payload {
	readonly table_name: string,
	readonly parent_table_name: string,
	readonly parent_table_relationship_name: string,
	readonly parent_path_element_name: string,
}

interface navigator_instance_parameters<RETURN_STRUCTURE> {
	readonly table_name: string,  // the name of the current table
	readonly parent_table_name?: string,  // parent table name
	// next_real_path_element_name as returned by callbacks.get_next_path_element
	readonly parent_table_relationship_name?: string,
	readonly parent_path_element_name?: string,  // next_path_element_name as returned by callbacks.get_next_path_element
	readonly callbacks: navigator_callbacks<RETURN_STRUCTURE>  // callbacks (described in the navigator)
	// callbacks payload (described in the navigator)
	readonly callback_payload: navigator_callback_payload<RETURN_STRUCTURE>
}

interface get_mapping_line_data_from_mapping_path_parameters {
	readonly base_table_name: string,
	readonly mapping_path?: mapping_path,  // the mapping path
	readonly open_select_element?: open_select_element  // index of custom select element that should be open
	// {bool} if False, returns data only for the last element of the mapping path only
	// Else returns data for each mapping path part
	readonly iterate?: boolean,
	// {bool} whether to generate data for the last element of the mapping path if the last element is a relationship
	readonly generate_last_relationship_data?: boolean
	readonly custom_select_type: custom_select_type,
	readonly show_hidden_fields?: boolean,
	readonly handleChange?: handleMappingLineChange
	readonly handleOpen?: handleMappingLineOpen
	readonly handleClose?: handleMappingLineOpen
	readonly handleAutomapperSuggestionSelection?: (suggestion: string) => void,
	readonly get_mapped_fields: get_mapped_fields_bind,
	readonly automapper_suggestions?: automapper_suggestion[],
}

interface get_mapping_line_data_from_mapping_path_internal_state {
	mapping_path_position: number,
	mapping_line_data: MappingElementProps[],
	custom_select_type: custom_select_type,
	custom_select_subtype?: custom_select_subtype
	is_open?: boolean,
	next_mapping_path_element?: string,
	default_value?: string,
	current_mapping_path_part?: string,
	result_fields: {[field_name: string]: html_generator_field_data}
	mapped_fields: string[],
}