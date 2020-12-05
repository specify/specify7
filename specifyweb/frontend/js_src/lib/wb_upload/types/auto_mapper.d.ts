interface map_parameters {
	readonly headers :list_of_headers,
	readonly base_table :string,
	readonly starting_table? :string,
	readonly path :mapping_path,
	readonly path_offset? :number,
	readonly allow_multiple_mappings? :boolean,
	readonly use_cache? :boolean,
	readonly commit_to_cache? :boolean,
	readonly check_for_existing_mappings? :boolean,
	readonly scope? :automapper_scope,
}

interface automapper_results {
	[header_name:string]:mapping_path[],
}

interface header_information {
	is_mapped:boolean,
	readonly lowercase_header_name: string,
	readonly stripped_header_name: string,
	readonly final_header_name: string
}

interface headers_to_map {
	readonly [original_header_name:string]:header_information
}

// type compassion_types = 'regex'|'string'|'contains'
//
// type auto_mapper_definitions_comparisons = {
// 	[name in compassion_types] :(header :string, string :RegExp | string) => boolean;
// };

interface find_mappings_in_definitions_parameters {
	readonly path :mapping_path,
	readonly table_name :string,
	readonly field_name :string,
	readonly mode :string,
	readonly is_tree_rank? :boolean,
}

interface find_mappings_parameters {
	readonly table_name :string,
	readonly path? :mapping_path,
	readonly parent_table_name? :string,
	readonly parent_relationship_type? :undefined|relationship_type,
}

interface field_data {
	readonly friendly_name :string,
	readonly is_hidden :boolean,
	readonly is_required :boolean,
	readonly is_relationship :boolean,
	readonly table_name :string,
	readonly type :'one-to-one' | 'many-to-many' | 'one-to-many' | 'many-to-one',
	readonly foreign_name :string
}

type find_mappings_queue = find_mappings_parameters[][];