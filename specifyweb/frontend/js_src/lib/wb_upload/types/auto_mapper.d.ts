interface map_parameters {
	readonly headers :string[],
	readonly base_table :string,
	readonly starting_table? :string,
	readonly path :string[],
	readonly path_offset? :number,
	readonly allow_multiple_mappings? :boolean,
	readonly use_cache? :boolean,
	readonly commit_to_cache? :boolean,
	readonly check_for_existing_mappings? :boolean,
	readonly scope? :string,
}

interface find_mappings_in_definitions_parameters {
	readonly path :string[],
	readonly table_name :string,
	readonly field_name :string,
	readonly mode :string,
	readonly is_tree_rank? :boolean,
}

interface find_mappings_parameters {
	readonly table_name :string,
	readonly path? :string[],
	readonly parent_table_name? :string,
	readonly parent_relationship_type :string,
}

// interface table_synonyms {
// 	readonly mapping_path_filter :string[],
// 	readonly synonyms :string[]
// }

interface field_data {
	readonly friendly_name :string,
	readonly is_hidden :boolean,
	readonly is_required :boolean,
	readonly is_relationship :boolean,
	readonly table_name :string,
	readonly type :'one-to-one' | 'many-to-many' | 'one-to-many' | 'many-to-one',
	readonly foreign_name :string
}

interface find_mappings_queue {
	[key :number] :find_mappings_queue_level,
}

interface find_mappings_queue_level {
	[header_name :string] :find_mappings_parameters
}