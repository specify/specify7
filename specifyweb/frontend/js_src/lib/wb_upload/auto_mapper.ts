"use strict";

export {};

/// <reference path="./json/auto_mapper_definitions.ts" />
const auto_mapper_definitions = require('./json/auto_mapper_definitions.ts');

/// <reference path="./data_model.ts" />
const data_model = require('./data_model.ts');

/// <reference path="./cache.ts" />
const cache = require('./cache.ts');

/// <reference path="./helper.ts" />
const helper = require('./helper.ts');

/*
*
* Auto mapper than takes data model and header names and returns possible mappings
*
* */
const auto_mapper = {

	regex_1: /[^a-z\s]+/g,  // used to remove not letter characters
	regex_2: /\s+/g,  // used to replace any white space characters with white space
	depth: 6,  // how deep to go into the schema
	comparisons: Object.entries({  // the definitions for the comparison functions
		regex: (header: string, regex: RegExp) => header.match(regex),
		string: (header: string, string: string) => header === string,
		contains: (header: string, string: string) => header.indexOf(string) !== -1
	}),
	mapped_definitions_were_converted: false,  // indicates whether convert_automapper_definitions() was run. If not, would run convert_automapper_definitions() the next time map() is called

	results: {},
	scope: '',
	allow_multiple_mappings: false,
	check_for_existing_mappings: false,
	path_offset: 0,
	base_table: '',
	starting_table: '',
	starting_path: [],
	get_mapped_fields: (local_path:string[])=>true,

	/* Method that converts all table names and field names in definitions to lower case */
	convert_automapper_definitions(): void{

		auto_mapper.mapped_definitions_were_converted = true;

		const keys_to_lower_case = (object: object, levels:number = 1) => Object.fromEntries(
			Object.entries(object).map(([key, value]) =>
				[key.toLowerCase(), levels > 1 ? keys_to_lower_case(value, levels - 1) : value]
			)
		);

		[
			['table_synonyms', 1],
			['dont_match', 2],
			['shortcuts', 1],
			['synonyms', 2],
		].map(([structure_name, depth]) =>
			auto_mapper_definitions[structure_name] = keys_to_lower_case(auto_mapper_definitions[structure_name], <number>depth)
		);

	},

	/* Method that would be used by external classes to match headers to possible mappings */
	map({
		/* array */ headers: raw_headers,  // array of strings that represent headers
		/* string */ base_table,  // base table name
		/* string */ starting_table = base_table,  // starting table name (if starting mapping_path provided, starting table would be different from base table)
		/* array */ path = [],  // starting mapping path
		/* int */ path_offset = 0,  // offset on a starting path. Used when the last element of mapping path is a reference index. E.x, if #1 is taken, it would try to change the index to #2
		/* boolean */ allow_multiple_mappings = false,  // whether to allow multiple mappings.
		/* boolean */ use_cache = true,  // whether to use cached values
		/* boolean */ commit_to_cache = true,  // whether to commit result to cache for future references
		/* boolean */ check_for_existing_mappings = false,  // whether to check if the field is already mapped (outside of automapper, in the mapping tree)
		/* string */ scope = 'automapper',  // scope to use for definitions. More info in json/auto_mapper_definitions.js
	}):object /* Returns mappings result in format: */
	/* 	If payload.allow_multiple_mappings:
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
	* */ {


		if (raw_headers.length === 0)
			return {};


		const cache_name = JSON.stringify(arguments[0]);

		if (use_cache && commit_to_cache) {
			const cached_data = cache.get('automapper', cache_name);
			if (cached_data)
				return cached_data;
		}

		if (!auto_mapper.mapped_definitions_were_converted)
			auto_mapper.convert_automapper_definitions();

		// strip extra characters to increase mapping success
		auto_mapper.unmapped_headers = Object.fromEntries(raw_headers.map(original_name => {

			const lowercase_name = original_name.toLowerCase().replace(auto_mapper.regex_2, ' ').trim();
			const stripped_name = lowercase_name.replace(auto_mapper.regex_1, '');
			const final_name = stripped_name.split(' ').join('');

			return [original_name, {
				lowercase_header_name: lowercase_name,
				stripped_header_name: stripped_name,
				final_header_name: final_name
			}];

		}));

		auto_mapper.results = {};
		auto_mapper.scope = scope;
		auto_mapper.allow_multiple_mappings = allow_multiple_mappings;
		auto_mapper.check_for_existing_mappings = check_for_existing_mappings;
		auto_mapper.path_offset = path.length - path_offset;
		auto_mapper.base_table = base_table;
		auto_mapper.starting_table = starting_table;
		auto_mapper.starting_path = path;

		//  do 2 passes over the schema
		auto_mapper.find_mappings_driver('shortcuts_and_table_synonyms');
		auto_mapper.find_mappings_driver('synonyms_and_matches');


		if (!auto_mapper.allow_multiple_mappings)
			for (const [header_name, mapping_paths] of Object.entries(auto_mapper.results))
				auto_mapper.results[header_name] = mapping_paths[0];

		const result = Object.entries(auto_mapper.results);

		if (commit_to_cache)
			cache.set('automapper', cache_name, result);

		return result;

	},

	/* Makes sure that `find_mappings` runs over the schema in correct order since mappings with a shorter mapping path are given higher priority */
	find_mappings_driver(
		mode: string,  // 'shortcuts_and_table_synonyms' or 'synonyms_and_matches'. More info in json/auto_mapper_definitions.js
	):void {

		/*
			this.find_mappings_queue: {
				<mapping_path_length>: [  // used to enforce higher priority for closer mappings
					{
						table_name: <table_name>,
						path: [<mapping_path>],
						parent_table_name: '<parent_table_name>',
					}
				]
			}
		*/

		auto_mapper.find_mappings_queue = [
			[
				{
					table_name: auto_mapper.base_table,
					path: [],
					parent_table_name: '',
				}
			]
		];
		auto_mapper.searched_tables = [];

		if(mode === 'synonyms_and_matches') {
			auto_mapper.find_mappings_queue[0][0]['table_name'] = auto_mapper.starting_table;
			auto_mapper.find_mappings_queue[0][0]['path'] = auto_mapper.starting_path;
		}

		let queue_data;
		do {

			queue_data = Object.entries(auto_mapper.find_mappings_queue);
			auto_mapper.find_mappings_queue = [];

			for (const [level,mappings_data] of queue_data)  // go though each level of the queue in order
				for (const payload of mappings_data)
					if(
						mode !== 'shortcuts_and_table_synonyms' ||
						level === "0" ||
						typeof auto_mapper.starting_path[level-1] === "undefined" ||
						helper.find_array_divergence_point(payload['path'],auto_mapper.starting_path.slice(0,level)) !== -1
					)
						auto_mapper.find_mappings(payload, mode);

		} while (queue_data.length !== 0);

	},

	/* Compares definitions to unmapped headers and makes a mapping if matched */
	handle_definition_comparison(
		path: string[],  // initial mapping path
		comparisons: object,  // structure with defined comparisons. See `headers` object in json/auto_mapper_definitions.js
		get_new_path_part: ()=>string[]  // function that returns the next path part to use in a new mapping (on success)
	):void {

		// compile regex strings
		if (typeof comparisons['regex'] !== "undefined")
			for (const [regex_index, regex_string] of Object.entries(comparisons['regex']))
				if (typeof regex_string === "string")
					comparisons['regex'][regex_index] = new RegExp(regex_string);

		for (const [header_key, {lowercase_header_name}] of <any[]> Object.entries(auto_mapper.unmapped_headers)) {// loop over headers

			if (typeof lowercase_header_name === "undefined")
				continue;

			auto_mapper.comparisons.some(([comparison_key, comparison_function]) => // loop over defined comparisons

				typeof comparisons[comparison_key] !== "undefined" &&
				Object.values(comparisons[comparison_key]).some(comparison_value =>  // loop over each value of a comparison

					comparison_function(lowercase_header_name, comparison_value) &&
					auto_mapper.make_mapping(
						path,
						get_new_path_part().map(path_part => {

							if (!data_model.value_is_tree_rank(path_part))
								path_part = path_part.toLowerCase();
							return path_part;

						}),
						header_key
					)
				)
			);

		}

	},

	/*
	* Goes over `shortcuts` and `synonyms` in json/auto_mapper_definitions.js and tries to find matches
	* Calls handle_definition_comparison to make each individual comparison
	* */
	find_mappings_in_definitions({
		/* array */ path,  // current mapping path
		/* string */ table_name,  // the table to search in
		/* string */ field_name,  // the field to search in
		/* string */ mode,  // 'shortcuts_and_table_synonyms' or 'synonyms_and_matches'. More info in json/auto_mapper_definitions.js
		/* boolean */ is_tree_rank = false  // whether to format field_name as a tree rank name
	}):void {

		let definitions_source;
		if (mode === 'shortcuts_and_table_synonyms') {
			if (field_name !== '')
				return;
			definitions_source = 'shortcuts';
		}
		else if (mode === 'synonyms_and_matches')
			definitions_source = 'synonyms';

		const table_definition_data = auto_mapper_definitions[definitions_source][table_name];

		if (typeof table_definition_data === "undefined")
			return;


		if (mode === 'shortcuts_and_table_synonyms') {

			const definition_data = table_definition_data[auto_mapper.scope];

			if (typeof definition_data === "undefined")
				return;

			for (const shortcut_data of definition_data) {

				const comparisons = shortcut_data['headers'];
				const get_new_path_part = () =>
					shortcut_data['mapping_path'];
				auto_mapper.handle_definition_comparison(path, comparisons, get_new_path_part);

			}
		}


		else if (mode === 'synonyms_and_matches') {

			if (
				typeof table_definition_data[field_name] === "undefined" ||
				typeof table_definition_data[field_name][auto_mapper.scope] === "undefined"
			)
				return;

			const comparisons = table_definition_data[field_name][auto_mapper.scope]['headers'];
			const get_new_path_part = () => {
				if (is_tree_rank)
					return [data_model.format_tree_rank(field_name), 'name'];
				else
					return [field_name];

			};
			auto_mapper.handle_definition_comparison(path, comparisons, get_new_path_part);
		}

	},

	/* Searches for `table_synonym` that matches the current table and the current mapping path */
	find_table_synonyms(
		table_name: string,  // the table to search for
		path: string[],  // current mapping path
		mode: string,  // 'shortcuts_and_table_synonyms' or 'synonyms_and_matches'. More info in json/auto_mapper_definitions.js
	):string[] /* table synonyms */ {

		const table_synonyms = auto_mapper_definitions['table_synonyms'][table_name];

		if (
			mode !== 'shortcuts_and_table_synonyms' ||
			typeof table_synonyms === "undefined"
		)
			return [];

		//filter out -to-many references from the path for matching
		const filtered_path = path.reduce((filtered_path, path_part) => {

			if (!data_model.value_is_reference_item(path_part))
				filtered_path.push(path_part);

			return filtered_path;

		}, []);

		const filtered_path_string = filtered_path.join(data_model.path_join_symbol);
		const filtered_path_with_base_table_string = [
			auto_mapper.base_table,
			...filtered_path
		].join(data_model.path_join_symbol);

		return table_synonyms.reduce((table_synonyms, table_synonym) => {

			const mapping_path_string = table_synonym['mapping_path_filter'].join(data_model.path_join_symbol);

			if (
				filtered_path_string.endsWith(mapping_path_string) ||
				filtered_path_with_base_table_string === mapping_path_string
			)
				table_synonyms.push(...table_synonym['synonyms']);

			return table_synonyms;

		}, []);

	},

	find_formatted_header_field_synonyms(
		table_name: string,  // the table to search in
		field_name: string,  // the field to search in
	):string[] /* field synonyms */ {
		if (
			typeof auto_mapper_definitions['synonyms'][table_name] === "undefined" ||
			typeof auto_mapper_definitions['synonyms'][table_name][field_name] === "undefined" ||
			typeof auto_mapper_definitions['synonyms'][table_name][field_name][auto_mapper.scope] === "undefined" ||
			typeof auto_mapper_definitions['synonyms'][table_name][field_name][auto_mapper.scope]['headers']['formatted_header_field_synonym'] === "undefined"
		)
			return [];

		return auto_mapper_definitions['synonyms'][table_name][field_name][auto_mapper.scope]['headers']['formatted_header_field_synonym'];
	},

	/*
	* Used internally to loop though each field of a particular table and try to match them to unmapped headers
	* This method iterates over the same table only once if in `synonyms_and_matches` mode. More info in json/auto_mapper_definitions.js
	* */
	find_mappings(
		{
			/* string */ table_name,  // name of current table
			/* array */ path = [],  // current mapping path
			/* string */ parent_table_name = '',  // parent table name. Empty if current table is a base table. Used to prevent circular relationships
			/* string */ parent_relationship_type, // relationship type between parent table and current table. Empty if current table is a base table. Used to prevent mapping -to-many that are inside of -to-many (only while upload plan doesn't support such relationships)
		},
		mode: string  // 'shortcuts_and_table_synonyms' or 'synonyms_and_matches'. More info in json/auto_mapper_definitions.js
	):void {


		if (mode === 'synonyms_and_matches') {
			if (
				auto_mapper.searched_tables.indexOf(table_name) !== -1 ||  // don't iterate over the same table again when in `synonyms_and_matches` mode
				path.length > auto_mapper.depth  // don't go beyond the depth limit
			)
				return;

			auto_mapper.searched_tables.push(table_name);
		}


		const table_data = data_model.tables[table_name];
		const ranks_data = data_model.ranks[table_name];
		const fields = Object.entries(table_data['fields']).filter(([, field_data]) =>
			!field_data['is_hidden'] &&
			!field_data['is_relationship']
		);
		const table_friendly_name = table_data['table_friendly_name'].toLowerCase();

		if (typeof ranks_data !== "undefined") {

			let ranks = Object.keys(ranks_data);
			const push_rank_to_path = path.length <= 0 || !data_model.value_is_tree_rank(path[path.length - 1]);

			if (!push_rank_to_path)
				ranks = [data_model.get_name_from_tree_rank_name(path[path.length - 1])];

			const find_mappings_in_definitions_payload = {
				path: path,
				table_name: table_name,
				field_name: '',
				mode: mode,
				is_tree_rank: true
			};

			auto_mapper.find_mappings_in_definitions(find_mappings_in_definitions_payload);

			for (const rank_name of ranks) {

				const striped_rank_name = rank_name.toLowerCase();
				const final_rank_name = data_model.format_tree_rank(rank_name);

				find_mappings_in_definitions_payload.field_name = striped_rank_name;

				auto_mapper.find_mappings_in_definitions(find_mappings_in_definitions_payload);

				if (mode !== 'synonyms_and_matches')
					continue;

				for (const [field_name, field_data] of fields) {

					const friendly_name = field_data['friendly_name'].toLowerCase();

					Object.entries(<any[]>auto_mapper.unmapped_headers).some(([header_name, {stripped_header_name, final_header_name}]) => {

						if (typeof stripped_header_name === "undefined")//skip mapped headers
							return false;

						if (
							(  // find cases like `Phylum` and remap them to `Phylum > Name`
								friendly_name === 'name' &&
								striped_rank_name === stripped_header_name
							) ||
							(  // find cases like `Kingdom Author`
								`${striped_rank_name} ${friendly_name}` === stripped_header_name ||
								`${striped_rank_name} ${field_name}` === final_header_name
							)
						) {

							let new_path_parts;
							if (push_rank_to_path)
								new_path_parts = [final_rank_name, field_name];
							else
								new_path_parts = [field_name];

							// don't search for further mappings for this field if we can only map a single header to this field
							return auto_mapper.make_mapping(path, new_path_parts, header_name, table_name);
						}

					});

				}

			}
			return;
		}

		const table_synonyms = auto_mapper.find_table_synonyms(table_name, path, mode);
		let table_names;
		if (table_synonyms.length === 0)
			table_names = [table_name, table_friendly_name];
		else
			table_names = table_synonyms;

		const find_mappings_in_definitions_payload = {
			path: path,
			table_name: table_name,
			field_name: '',
			mode: mode,
		};

		auto_mapper.find_mappings_in_definitions(find_mappings_in_definitions_payload);

		for (const [field_name, field_data] of fields) {

			// search in definitions
			find_mappings_in_definitions_payload.field_name = field_name;
			auto_mapper.find_mappings_in_definitions(find_mappings_in_definitions_payload);

			if (mode !== 'synonyms_and_matches') {
				if (table_synonyms.length === 0)
					continue;
				else {  // run though synonyms and matches if table has table_synonyms even if not in `synonyms_and_matches` mode
					find_mappings_in_definitions_payload['mode'] = 'synonyms_and_matches';
					auto_mapper.find_mappings_in_definitions(find_mappings_in_definitions_payload);
					find_mappings_in_definitions_payload['mode'] = mode;
				}
			}


			const friendly_name = field_data['friendly_name'].toLowerCase();
			const field_names = [
				...auto_mapper.find_formatted_header_field_synonyms(table_name, field_name),
				friendly_name,
				field_name
			];

			let to_many_reference_number;
			Object.entries(<any[]> auto_mapper.unmapped_headers).some(([header_name, {lowercase_header_name, stripped_header_name, final_header_name}]) =>

				// skip mapped headers
				typeof lowercase_header_name !== "undefined" &&

				!(to_many_reference_number = false) &&
				(
					// compare each field's schema name and friendly schema name to headers
					field_names.some(field_name =>
						[lowercase_header_name, stripped_header_name, final_header_name].indexOf(field_name) !== -1
					) ||

					table_names.some(table_synonym =>  // loop through table names and table synonyms

						field_names.some(field_synonym =>  // loop through field names and field synonyms

							`${field_synonym} ${table_synonym}` === lowercase_header_name ||

							stripped_header_name.startsWith(table_synonym) &&
							(
								`${table_synonym} ${field_synonym}` === lowercase_header_name ||
								[  // try extracting -to-many reference number
									new RegExp(`${table_synonym} (\\d+) ${field_synonym}`),
									new RegExp(`${table_synonym} ${field_synonym} (\\d+)`),
								].some(regular_expression => {

									const match = lowercase_header_name.match(regular_expression);

									if (match === null || typeof match[1] === "undefined")
										return false;

									to_many_reference_number = parseInt(match[1]);
									return true;

								})
							)
						)
					)
				) &&
				auto_mapper.make_mapping(
					path,
					[field_name],
					header_name,
					table_name,
					to_many_reference_number
				)
			);

		}


		const relationships = Object.entries(<any[]> table_data['fields']).filter(([, {is_hidden, is_relationship}]) =>
			!is_hidden && is_relationship
		);


		for (const [relationship_key, relationship_data] of relationships) {

			const local_path = [...path, relationship_key];

			if (data_model.relationship_is_to_many(relationship_data['type']))
				local_path.push(data_model.format_reference_item(1));

			const new_depth_level = local_path.length;

			if (new_depth_level > auto_mapper.depth)
				continue;

			if (typeof auto_mapper.find_mappings_queue[new_depth_level] === "undefined")
				auto_mapper.find_mappings_queue[new_depth_level] = [];

			const {foreign_name} = relationship_data;

			let current_mapping_path_part = path[path.length - 1];
			if (data_model.value_is_reference_item(current_mapping_path_part) || data_model.value_is_tree_rank(current_mapping_path_part))
				current_mapping_path_part = path[path.length - 2];

			if (
				(  // don't iterate over the same tables again
					mode === 'synonyms_and_matches' &&
					(
						auto_mapper.searched_tables.indexOf(relationship_data['table_name']) !== -1 ||
						auto_mapper.find_mappings_queue[new_depth_level].map(({table_name}) =>
							table_name
						).some(table_name =>
							table_name === relationship_data['table_name']
						)
					)
				) ||
				(  // skip circular relationships
					mode !== 'synonyms_and_matches' &&
					(  // skip circular relationships
						relationship_data['table_name'] === parent_table_name &&
						(
							(
								typeof foreign_name !== "undefined" &&
								typeof data_model.tables[parent_table_name]['fields'][foreign_name] !== "undefined" &&
								data_model.tables[parent_table_name]['fields'][foreign_name]['foreign_name'] === relationship_key
							) ||
							(
								data_model.tables[table_name]['fields'][relationship_key]['foreign_name'] === current_mapping_path_part
							)
						)
					)
				) ||
				(  // skip -to-many inside of -to-many  //TODO: remove this once upload plan is ready
					typeof relationship_data['type'] !== "undefined" &&
					typeof parent_relationship_type !== "undefined" &&
					data_model.relationship_is_to_many(relationship_data['type']) &&
					data_model.relationship_is_to_many(parent_relationship_type)
				)
			)
				continue;

			auto_mapper.find_mappings_queue[new_depth_level].push({
				table_name: relationship_data['table_name'],
				path: local_path,
				parent_table_name: table_name,
				parent_relationship_type: relationship_data['type'],
			});

		}

	},

	/*
	* Used to check if the table's field is already mapped and if not, makes a new mapping
	* Also, handles -to-many relationships by creating new objects
	* */
	make_mapping(
		path: string[], // Mapping path from base table to this table. Should be an empty array if this is base table
		new_path_parts: string[], // Elements that should be pushed into `path`
		header_name: string,  // The name of the header that should be mapped
		table_name: string = '',  // Current table name (used to identify `don't map` conditions)
		to_many_reference_number: number|boolean = false // if of type {int} - implants given to_many_reference_number into the mapping path into the first reference item starting from the right
		//													if of type {boolean} and is False - don't do anything
	):boolean /* false if we can map another mapping to this header. Most of the time means that the mapping was not made (Mapping fails if field is inside of a -to-one relationship or direct child of base table and is already mapped). Can also depend on this.allow_multiple_mappings */ {

		let local_path = [...path, ...new_path_parts];
		const last_path_part = local_path[local_path.length - 1];

		if (
			(  // if this fields is designated as unmappable in the current source
				table_name !== '' &&
				typeof auto_mapper_definitions['dont_match'][table_name] !== "undefined" &&
				typeof auto_mapper_definitions['dont_match'][table_name][last_path_part] !== "undefined" &&
				auto_mapper_definitions['dont_match'][table_name][last_path_part].indexOf(auto_mapper.scope) !== -1
			) ||
			(  // if a starting path was given and proposed mapping is outside of the path
				auto_mapper.starting_path.length !== 0 &&
				helper.find_array_divergence_point(local_path,auto_mapper.starting_path.slice(0,local_path.length)) === -1
			)
		)
			return false;

		//if precise -to-many index was found, insert it into the path
		if (to_many_reference_number !== false)
			local_path = local_path.reverse().reduce((modified_local_path, local_path_part) => {

				if (data_model.value_is_reference_item(local_path_part) && to_many_reference_number !== false) {
					local_path_part = data_model.format_reference_item(to_many_reference_number);
					to_many_reference_number = false;
				}

				modified_local_path.push(local_path_part);

				return modified_local_path;

			}, []).reverse();

		// check if this path is already mapped
		while (true) {

			// go over mapped headers to see if this path was already mapped
			let path_already_mapped =
				(
					!auto_mapper.allow_multiple_mappings &&
					Object.values(<object>auto_mapper.results).some(mapping_paths =>
						mapping_paths.some(mapping_path =>
							JSON.stringify(local_path) === JSON.stringify(mapping_path)
						)
					)
				) ||
				(
					auto_mapper.check_for_existing_mappings &&
					auto_mapper.get_mapped_fields(local_path) !== false
				);

			if (!path_already_mapped)
				break;

			let index = local_path.length;
			let path_was_modified = Object.entries(local_path).reverse().some(([local_path_index, local_path_part]) => {

				path_was_modified = index > auto_mapper.path_offset && data_model.value_is_reference_item(local_path_part);
				if (path_was_modified)
					local_path[local_path_index] = data_model.format_reference_item(data_model.get_index_from_reference_item_name(local_path_part) + 1);

				index--;

				return path_was_modified;

			});

			if (!path_was_modified)
				return false;
		}


		// remove header from unmapped headers
		if (!auto_mapper.allow_multiple_mappings)
			auto_mapper.unmapped_headers[header_name] = false;

		if (typeof auto_mapper.results[header_name] === "undefined")
			auto_mapper.results[header_name] = [];

		auto_mapper.results[header_name].push(local_path);


		const path_contains_to_many_references = path.some(path_part => data_model.value_is_reference_item(path_part));

		return !path_contains_to_many_references && !auto_mapper.allow_multiple_mappings;

	},
};

module.exports = auto_mapper;