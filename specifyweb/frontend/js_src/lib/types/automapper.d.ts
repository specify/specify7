type auto_mapper_mode = 'shortcuts_and_table_synonyms' | 'synonyms_and_matches'  // More info in json/auto_mapper_definitions.js

interface automapper_constructor_parameters {
	readonly headers :list_of_headers,  // array of strings that represent headers
	readonly base_table :string,  // base table name
	readonly starting_table? :string,  // starting table name (if starting mapping_path provided, starting table would be different from base table)
	readonly path? :mapping_path,  // starting mapping path
	readonly path_offset? :number,  // offset on a starting path. Used when the last element of mapping path is a reference index. E.x, if #1 is taken, it would try to change the index to #2
	readonly allow_multiple_mappings? :boolean,  // whether to allow multiple mappings
	readonly check_for_existing_mappings? :boolean,  // whether to check if the field is already mapped (outside of automapper, in the mapping tree)
	readonly scope? :automapper_scope,  // scope to use for definitions. More info in json/auto_mapper_definitions.js
}

interface automapper_map_parameters {
	readonly use_cache? :boolean,  // whether to use cached values
	readonly commit_to_cache? :boolean,  // whether to commit result to cache for future references
}

interface automapper_results extends WritableDictionary<mapping_path[]> {
	/*
	* Returns mappings result in format:
	* If payload.allow_multiple_mappings:
	* 		[
	* 			header_name,
	* 			[
	* 				mapping_path,
	* 				mapping_path_2,
	* 				...
	* 			]
	* 		]
	* 	else
	* 		[header_name, mapping_path]
	* mapping path may look like:
	* 	[Accession, Accession Number]
	* 	OR
	* 	[Accession, Accession Agents, #1, Agent, Agent Type]
	* */
}

interface header_information {
	is_mapped :boolean,
	readonly lowercase_header_name :string,  // original_header_name.toLowerCase() and trimmed
	readonly stripped_header_name :string,  // lowercase_header_name but without numbers and special characters (a-z only)
	readonly final_header_name :string  // stripped_header_name but without any white space
}

interface headers_to_map {
	readonly [original_header_name :string] :header_information  // a dictionary of headers that need to be mapped
}

interface auto_mapper_definition_comparisons extends Dictionary<string[] | RegExp[]> {  // structure with defined comparisons. See `headers` object in json/auto_mapper_definitions.js
}

interface find_mappings_in_definitions_parameters {
	readonly path :mapping_path,  // current mapping path
	readonly table_name :string,  // the table to search in
	readonly field_name :string,  // the field to search in
	readonly mode :auto_mapper_mode,
	readonly is_tree_rank? :boolean,  // whether to format field_name as a tree rank name
}

interface find_mappings_parameters {
	readonly table_name :string,  // name of current table
	readonly path :mapping_path,  // current mapping path
	readonly parent_table_name? :string,  // parent table name. Empty if current table is a base table. Used to prevent circular relationships
	readonly parent_relationship_type? :undefined | relationship_type,  // relationship type between parent table and current table. Empty if current table is a base table. Used to prevent mapping -to-many that are inside of -to-many (only while upload plan doesn't support such relationships)
}

type find_mappings_queue = find_mappings_parameters[][];  // used to enforce higher priority for closer mappings


interface automapper_results_add_action extends Action<'add'> {
	header_name :string,
	mapping_path :mapping_path,
}

type automapper_results_actions = automapper_results_add_action;

interface automapper_headers_to_map_mapped extends Action<'mapped'> {
	header_name :string
}

type automapper_headers_to_map_actions = automapper_headers_to_map_mapped;

interface automapper_searched_tables_reset extends Action<'reset'> {
}

interface automapper_searched_tables_add extends Action<'add'> {
	table_name :string,
}

type automapper_searched_tables_actions = automapper_searched_tables_add | automapper_searched_tables_reset;

interface automapper_find_mappings_queue_enqueue extends Action<'enqueue'> {
	value :find_mappings_parameters,
	level :number,
}

interface automapper_find_mappings_queue_reset extends Action<'reset'> {
	initial_value? :find_mappings_parameters
}

interface automapper_find_mappings_queue_initialize_level extends Action<'initialize_level'> {
	level :number
}

type automapper_find_mappings_queue_actions =
	automapper_find_mappings_queue_reset
	| automapper_find_mappings_queue_initialize_level
	| automapper_find_mappings_queue_enqueue;

interface automapper_props_dispatch {
	results :(action :automapper_results_actions) => void,
	headers_to_map :(action :automapper_headers_to_map_actions) => void,
	searched_tables :(action :automapper_searched_tables_actions) => void,
	find_mappings_queue :(action :automapper_find_mappings_queue_actions) => void
}