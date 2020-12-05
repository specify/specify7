interface navigator_parameters {
	readonly callbacks :object,
	readonly recursive_payload? :object | undefined
	readonly internal_payload? :object
	readonly config :{
		readonly use_cache? :boolean
		readonly cache_name :string
		readonly base_table_name :string
	}
}

interface navigator_instance_parameters {
	readonly table_name :string,
	readonly internal_payload :object,
	readonly parent_table_name? :string,
	readonly parent_table_relationship_name? :string,
	readonly parent_path_element_name? :string,
	readonly use_cache? :boolean
	readonly cache_name? :string | false
	readonly callbacks :object
	readonly callback_payload :object
}