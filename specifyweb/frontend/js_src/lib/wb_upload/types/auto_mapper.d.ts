type auto_mapper_mode = 'shortcuts_and_table_synonyms' | 'synonyms_and_matches'  // More info in json/auto_mapper_definitions.js

interface map_parameters {
	readonly headers :list_of_headers,  // array of strings that represent headers
	readonly base_table :string,  // base table name
	readonly starting_table? :string,  // starting table name (if starting mapping_path provided, starting table would be different from base table)
	readonly path :mapping_path,  // starting mapping path
	readonly path_offset? :number,  // offset on a starting path. Used when the last element of mapping path is a reference index. E.x, if #1 is taken, it would try to change the index to #2
	readonly allow_multiple_mappings? :boolean,  // whether to allow multiple mappings
	readonly use_cache? :boolean,  // whether to use cached values
	readonly commit_to_cache? :boolean,  // whether to commit result to cache for future references
	readonly check_for_existing_mappings? :boolean,  // whether to check if the field is already mapped (outside of automapper, in the mapping tree)
	readonly scope? :automapper_scope,  // scope to use for definitions. More info in json/auto_mapper_definitions.js
}

interface automapper_results {
	[header_name :string] :mapping_path[],
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

interface auto_mapper_definition_comparisons {  // structure with defined comparisons. See `headers` object in json/auto_mapper_definitions.js
	[key :string] :string[] | RegExp[]
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
	readonly path? :mapping_path,  // current mapping path
	readonly parent_table_name? :string,  // parent table name. Empty if current table is a base table. Used to prevent circular relationships
	readonly parent_relationship_type? :undefined | relationship_type,  // relationship type between parent table and current table. Empty if current table is a base table. Used to prevent mapping -to-many that are inside of -to-many (only while upload plan doesn't support such relationships)
}

type find_mappings_queue = find_mappings_parameters[][];  // used to enforce higher priority for closer mappings