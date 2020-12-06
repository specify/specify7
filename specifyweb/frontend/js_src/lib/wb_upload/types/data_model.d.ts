interface navigator_parameters {
	readonly callbacks :navigator_callbacks,  // Callbacks can be modified depending on the need to make navigator very versatile
	readonly recursive_payload? :navigator_recursive_payload | undefined  // {object|undefined} used internally to make navigator call itself multiple times
	readonly internal_payload? :object  // payload that is shared between the callback functions only and is not modified by the navigator
	readonly config :{
		readonly use_cache? :boolean  // whether to use cached values
		readonly cache_name :string  // the name of the cache bucket to use
		readonly base_table_name? :string  // the name of the base table to use
	}
}

type internal_payload = any;


interface navigator_callback_payload {
	table_name :string,
	data? :any,
	parent_relationship_type? :relationship_type | '',
	parent_table_name? :string,
}

interface navigator_next_path_element {
	next_path_element_name :string,  // the name of the next path element
	next_path_element :data_model_relationship,  // if the next path element is not a field nor a relationship, {undefined}. Else, {object} the information about a field from data_model.tables
	next_real_path_element_name :string,  // If next_path_element_name is not a field nor a relationships, {string} current path element name. Else next_path_element_name
}

interface navigator_callbacks {
	iterate :(internal_payload :internal_payload) => boolean,  // should return {boolean} specifying whether to run data_model.navigator_instance() for a particular mapping path part
	get_next_path_element :(internal_payload :internal_payload, callback_payload :navigator_callback_payload) => navigator_next_path_element | undefined,  // should return undefined if there is no next path element
	get_final_data :(internal_payload :internal_payload) => any,  // formats internal_payload and returns it. Would be used as a return value for the navigator
	get_instance_data :(internal_payload :internal_payload, callback_payload :navigator_callback_payload) => any,  // commits callback_payload.data to internal_payload and returns committed data
	commit_instance_data :(internal_payload :internal_payload, callback_payload :navigator_callback_payload) => void,  // commits callback_payload.data to internal_payload and returns committed data
	navigator_instance_pre :(internal_payload :internal_payload, callback_payload :navigator_callback_payload) => void,  // called inside of navigator_instance before it calls callbacks for tree ranks / reference items / simple fields
	handle_to_many_children :(internal_payload :internal_payload, callback_payload :navigator_callback_payload) => void,  // handles to_many children
	handle_tree_ranks :(internal_payload :internal_payload, callback_payload :navigator_callback_payload) => void,  // handles tree ranks children
	handle_simple_fields :(internal_payload :internal_payload, callback_payload :navigator_callback_payload) => void,  // handles fields and relationships
}

interface navigator_recursive_payload {
	table_name :string,
	parent_table_name :string,
	parent_table_relationship_name :string,
	parent_path_element_name :string,
}

interface navigator_instance_parameters {
	readonly table_name :string,  // the name of the current table
	readonly internal_payload :object,  // internal payload (described in navigator)
	readonly parent_table_name? :string,  // parent table name
	readonly parent_table_relationship_name? :string,  // next_real_path_element_name as returned by callbacks.get_next_path_element
	readonly parent_path_element_name? :string,  // next_path_element_name as returned by callbacks.get_next_path_element
	readonly use_cache? :boolean  // whether to use cache
	readonly cache_name? :string | false  // the name of the cache bucket to use
	readonly callbacks :navigator_callbacks  // callbacks (described in navigator)
	readonly callback_payload :navigator_callback_payload  // callbacks payload (described in navigator)
}