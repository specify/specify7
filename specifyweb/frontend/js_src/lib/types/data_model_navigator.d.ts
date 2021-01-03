interface navigator_parameters<RETURN_STRUCTURE> {
	readonly callbacks :navigator_callbacks<RETURN_STRUCTURE>,  // Callbacks can be modified depending on the need to make navigator very versatile
	readonly recursive_payload? :navigator_recursive_payload  // {object|undefined} used internally to make navigator call itself multiple times
	readonly config :{
		readonly use_cache? :boolean  // whether to use cached values
		readonly cache_name :string  // the name of the cache bucket to use
		readonly base_table_name? :string  // the name of the base table to use
	}
}

interface navigator_callback_payload {
	table_name :string,
	data? :any,
	parent_relationship_type? :relationship_type | '',
	parent_table_name? :string,
}

interface readonly_navigator_callback_payload extends Readonly<navigator_callback_payload> {
}

interface navigator_next_path_element {
	readonly next_path_element_name :string,  // the name of the next path element
	readonly next_path_element :data_model_relationship,  // if the next path element is not a field nor a relationship, {undefined}. Else, {object} the information about a field from data_model.tables
	readonly next_real_path_element_name :string,  // If next_path_element_name is not a field nor a relationships, {string} current path element name. Else next_path_element_name
}

type navigator_callback_function<RETURN_TYPE> = (callback_payload :readonly_navigator_callback_payload) => RETURN_TYPE;

interface navigator_callbacks<RETURN_STRUCTURE> {
	readonly iterate :navigator_callback_function<boolean>,  // should return {boolean} specifying whether to run data_model.navigator_instance() for a particular mapping path part
	readonly get_next_path_element :navigator_callback_function<navigator_next_path_element | undefined>,  // should return undefined if there is no next path element
	readonly get_final_data :navigator_callback_function<RETURN_STRUCTURE[]>,  // formats internal_payload and returns it. Would be used as a return value for the navigator
	readonly get_instance_data :navigator_callback_function<RETURN_STRUCTURE>,  // commits callback_payload.data to internal_payload and returns committed data
	readonly commit_instance_data :navigator_callback_function<void>,  // commits callback_payload.data to internal_payload and returns committed data
	readonly should_custom_select_element_be_open :navigator_callback_function<boolean>  // called inside of navigator_instance to determine if current mapping_path part should result in an open custom select element
	readonly navigator_instance_pre :navigator_callback_function<void>,  // called inside of navigator_instance before it calls callbacks for tree ranks / reference items / simple fields
	readonly handle_to_many_children :navigator_callback_function<void>,  // handles to_many children
	readonly handle_tree_ranks :navigator_callback_function<void>,  // handles tree ranks children
	readonly handle_simple_fields :navigator_callback_function<void>,  // handles fields and relationships
}

interface navigator_recursive_payload {
	readonly table_name :string,
	readonly parent_table_name :string,
	readonly parent_table_relationship_name :string,
	readonly parent_path_element_name :string,
}

interface navigator_instance_parameters<RETURN_STRUCTURE> {
	readonly table_name :string,  // the name of the current table
	readonly parent_table_name? :string,  // parent table name
	readonly parent_table_relationship_name? :string,  // next_real_path_element_name as returned by callbacks.get_next_path_element
	readonly parent_path_element_name? :string,  // next_path_element_name as returned by callbacks.get_next_path_element
	readonly use_cache? :boolean  // whether to use cache
	readonly cache_name? :string | false  // the name of the cache bucket to use
	readonly callbacks :navigator_callbacks<RETURN_STRUCTURE>  // callbacks (described in navigator)
	readonly callback_payload :navigator_callback_payload  // callbacks payload (described in navigator)
}

interface get_mapping_line_data_from_mapping_path_parameters {
	readonly mapping_path? :mapping_path,  // the mapping path
	readonly open_path_element_index? :number  // index of custom select element that should be open
	readonly iterate? :boolean,  // {bool} if False, returns data only for the last element of the mapping path only, Else returns data for each mapping path part
	readonly use_cached? :boolean,  // {bool} whether to use cache if exists
	readonly generate_last_relationship_data? :boolean  // {bool} whether to generate data for the last element of the mapping path if the last element is a relationship
	readonly custom_select_type :custom_select_type,
	readonly handleChange? : handleCustomSelectElementChange
	readonly handleOpen? : handleCustomSelectElementOpen
}

interface get_mapping_line_data_from_mapping_path_internal_state {
	mapping_path_position :number,
	mapping_line_data :MappingElementProps[],
	custom_select_type:custom_select_type,
	custom_select_subtype?:custom_select_subtype
	is_open?:boolean,
	next_mapping_path_element?:string,
	default_value?:string,
	current_mapping_path_part? :string,
	result_fields: {[field_name:string]:html_generator_field_data}
	mapped_fields: string[],
}