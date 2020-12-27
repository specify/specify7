/*
*
* Auto mapper than takes data model and header names and returns possible mappings
*
* */

"use strict";

const auto_mapper_definitions = require('./auto_mapper_definitions.tsx');
const data_model_storage = require('./data_model_storage.tsx');
const data_model_helper = require('./data_model_helper.tsx');
const cache = require('./cache.tsx');
const helper = require('./helper.tsx');

class auto_mapper {

	private results :automapper_results = {};
	private scope :automapper_scope = 'automapper';
	private allow_multiple_mappings :boolean = false;
	private check_for_existing_mappings :boolean = false;
	private path_offset :number = 0;
	private base_table :string = '';
	private starting_table :string = '';
	private starting_path :mapping_path = [];
	private headers_to_map :headers_to_map = {};
	private searched_tables :string[] = [''];
	private find_mappings_queue :find_mappings_queue = [];

	public static get_mapped_fields :(local_path :mapping_path) => true;

	private regex_replace_whitespace :RegExp = /\s+/g;  // used to replace any white space characters with white space
	private regex_remove_non_az :RegExp = /[^a-z\s]+/g;  // used to remove non letter characters
	private depth :number = 6;  // how deep to go into the schema
	private comparisons = {  // the definitions for the comparison functions
		regex: (header :string, regex :RegExp) => header.match(regex),
		string: (header :string, string :string) => header === string,
		contains: (header :string, string :string) => header.indexOf(string) !== -1
	};


	/* Method that would be used by external classes to match headers to possible mappings */
	public map({
				   headers: raw_headers,
				   base_table,
				   starting_table = base_table,
				   path = [],
				   path_offset = 0,
				   allow_multiple_mappings = false,
				   use_cache = true,
				   commit_to_cache = true,
				   check_for_existing_mappings = false,
				   scope = 'automapper',
			   } :map_parameters) :automapper_results {

		if (raw_headers.length === 0)
			return {};


		const cache_name = JSON.stringify(arguments[0]);

		if (use_cache && commit_to_cache) {
			const cached_data = cache.get('automapper', cache_name);
			if (cached_data)
				return cached_data;
		}

		// strip extra characters to increase mapping success
		this.headers_to_map = Object.fromEntries(raw_headers.map(original_name => {

			const lowercase_name = original_name.toLowerCase().replace(this.regex_replace_whitespace, ' ').trim();
			const stripped_name = lowercase_name.replace(this.regex_remove_non_az, '');
			const final_name = stripped_name.split(' ').join('');

			return [original_name, {
				is_mapped: false,
				lowercase_header_name: lowercase_name,
				stripped_header_name: stripped_name,
				final_header_name: final_name
			}];

		}));

		this.results = {};
		this.scope = scope;
		this.allow_multiple_mappings = allow_multiple_mappings;
		this.check_for_existing_mappings = check_for_existing_mappings;
		this.path_offset = path.length - path_offset;
		this.base_table = base_table;
		this.starting_table = starting_table;
		this.starting_path = path;

		// do 2 passes over the schema
		this.find_mappings_driver('shortcuts_and_table_synonyms');
		this.find_mappings_driver('synonyms_and_matches');


		if (commit_to_cache)
			cache.set('automapper', cache_name, this.results);

		return this.results;

	};

	/* Makes sure that `find_mappings` runs over the schema in correct order since mappings with a shorter mapping path are given higher priority */
	private find_mappings_driver(
		mode :auto_mapper_mode,
	) :void {

		this.searched_tables = [];

		if (mode === 'synonyms_and_matches')
			this.find_mappings_queue = [
				[
					{
						table_name: this.starting_table,
						path: this.starting_path,
						parent_table_name: '',
					}
				]
			];
		else
			this.find_mappings_queue = [
				[
					{
						table_name: this.base_table,
						path: [],
						parent_table_name: '',
					}
				]
			];

		let queue_data;
		do {

			queue_data = Object.entries(this.find_mappings_queue);
			this.find_mappings_queue = [];

			for (const [level, mappings_data] of queue_data)  // go though each level of the queue in order
				for (const payload of mappings_data)
					if (
						mode !== 'shortcuts_and_table_synonyms' ||
						level === "0" ||
						typeof this.starting_path[parseInt(level) - 1] === "undefined" ||
						helper.find_array_divergence_point(payload.path, this.starting_path.slice(0, parseInt(level))) !== -1
					)
						this.find_mappings(payload, mode);

		} while (queue_data.length !== 0);

	};

	/* Compares definitions to unmapped headers and makes a mapping if matched */
	private handle_definition_comparison = (
		path :mapping_path,  // initial mapping path
		comparisons :auto_mapper_definition_comparisons,
		get_new_path_part :() => mapping_path  // function that returns the next path part to use in a new mapping (on success)
	) =>
		this.get_unmapped_headers().forEach(([header_key, {lowercase_header_name}]) =>
			Object.entries(this.comparisons).filter(([comparison_key]) =>  // loop over defined comparisons
				comparison_key in comparisons
			).some(([comparison_key, comparison_function]) =>
				Object.values(comparisons[comparison_key]).some(comparison_value =>  // loop over each value of a comparison

					comparison_function(lowercase_header_name, comparison_value) &&
					this.make_mapping(
						path,
						get_new_path_part().map(path_part => {
							if (!data_model_helper.value_is_tree_rank(path_part))
								path_part = path_part.toLowerCase();
							return path_part;
						}),
						header_key
					)
				)
			));

	private get_unmapped_headers = () =>
		Object.entries(this.headers_to_map).filter(([, {is_mapped}]) =>  // loop over unmapped headers
			!is_mapped
		);

	/*
	* Goes over `shortcuts` and `synonyms` in json/auto_mapper_definitions.js and tries to find matches
	* Calls handle_definition_comparison to make each individual comparison
	* */
	private find_mappings_in_definitions({
											 path,
											 table_name,
											 field_name,
											 mode,
											 is_tree_rank = false
										 } :find_mappings_in_definitions_parameters) :void {

		let definitions_source;
		if (mode === 'shortcuts_and_table_synonyms') {
			if (field_name !== '')
				return;
			definitions_source = 'shortcuts';
		}
		else
			definitions_source = 'synonyms';

		const table_definition_data = auto_mapper_definitions[definitions_source][table_name];

		if (typeof table_definition_data === "undefined")
			return;


		if (mode === 'shortcuts_and_table_synonyms') {

			const definition_data = table_definition_data[this.scope];

			if (typeof definition_data === "undefined")
				return;

			for (const shortcut_data of definition_data) {

				const comparisons = shortcut_data.headers;
				const get_new_path_part = () =>
					shortcut_data.mapping_path;
				this.handle_definition_comparison(path, comparisons, get_new_path_part);

			}
		}
		else if (mode === 'synonyms_and_matches') {

			if (
				typeof table_definition_data[field_name] === "undefined" ||
				typeof table_definition_data[field_name][this.scope] === "undefined"
			)
				return;

			const comparisons = table_definition_data[field_name][this.scope].headers;
			const get_new_path_part = () => {
				if (is_tree_rank)
					return [data_model_helper.format_tree_rank(field_name), 'name'];
				else
					return [field_name];

			};
			this.handle_definition_comparison(path, comparisons, get_new_path_part);
		}

	};

	/* Searches for `table_synonym` that matches the current table and the current mapping path */
	private find_table_synonyms(
		table_name :string,  // the table to search for
		path :string[],  // current mapping path
		mode :auto_mapper_mode,
	) :string[] /* table synonyms */ {

		const table_synonyms = auto_mapper_definitions.table_synonyms[table_name];

		if (
			mode !== 'shortcuts_and_table_synonyms' ||
			typeof table_synonyms === "undefined"
		)
			return [];

		// filter out -to-many references from the path for matching
		const filtered_path = path.reduce((filtered_path :mapping_path, path_part :string) => {

			if (!data_model_helper.value_is_reference_item(path_part))
				filtered_path.push(path_part);

			return filtered_path;

		}, []);

		const filtered_path_string = filtered_path.join(data_model_storage.path_join_symbol);
		const filtered_path_with_base_table_string = [
			this.base_table,
			...filtered_path
		].join(data_model_storage.path_join_symbol);

		return table_synonyms.reduce((table_synonyms :string[], table_synonym :table_synonym_definition) => {

			const mapping_path_string = table_synonym.mapping_path_filter.join(data_model_storage.path_join_symbol);

			if (
				filtered_path_string.endsWith(mapping_path_string) ||
				filtered_path_with_base_table_string === mapping_path_string
			)
				table_synonyms.push(...table_synonym.synonyms);

			return table_synonyms;

		}, []);

	};

	private find_formatted_header_field_synonyms(
		table_name :string,  // the table to search in
		field_name :string,  // the field to search in
	) :string[] /* field synonyms */ {
		if (
			typeof auto_mapper_definitions.synonyms[table_name] === "undefined" ||
			typeof auto_mapper_definitions.synonyms[table_name][field_name] === "undefined" ||
			typeof auto_mapper_definitions.synonyms[table_name][field_name][this.scope] === "undefined" ||
			typeof auto_mapper_definitions.synonyms[table_name][field_name][this.scope].headers['formatted_header_field_synonym'] === "undefined"
		)
			return [];

		return auto_mapper_definitions.synonyms[table_name][field_name][this.scope].headers['formatted_header_field_synonym'];
	};

	/*
	* Used internally to loop though each field of a particular table and try to match them to unmapped headers
	* This method iterates over the same table only once if in `synonyms_and_matches` mode. More info in json/auto_mapper_definitions.js
	* */
	private find_mappings(
		{
			table_name,
			path = [],
			parent_table_name = '',
			parent_relationship_type,
		} :find_mappings_parameters,
		mode :auto_mapper_mode
	) :void {


		if (mode === 'synonyms_and_matches') {
			if (
				this.searched_tables.indexOf(table_name) !== -1 ||  // don't iterate over the same table again when in `synonyms_and_matches` mode
				path.length > this.depth  // don't go beyond the depth limit
			)
				return;

			this.searched_tables.push(table_name);
		}


		const table_data = data_model_storage.tables[table_name];
		const ranks_data = data_model_storage.ranks[table_name];
		const fields = data_model_helper.get_table_non_relationship_fields(table_name, false);
		const table_friendly_name = table_data.table_friendly_name.toLowerCase();

		if (typeof ranks_data !== "undefined") {

			let ranks = Object.keys(ranks_data);
			const push_rank_to_path = path.length <= 0 || !data_model_helper.value_is_tree_rank(path[path.length - 1]);

			if (!push_rank_to_path)
				ranks = [data_model_helper.get_name_from_tree_rank_name(path[path.length - 1])];

			const find_mappings_in_definitions_payload = {
				path,
				table_name,
				field_name: '',
				mode,
				is_tree_rank: true
			};

			this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

			for (const rank_name of ranks) {

				const striped_rank_name = rank_name.toLowerCase();
				const final_rank_name = data_model_helper.format_tree_rank(rank_name);

				find_mappings_in_definitions_payload.field_name = striped_rank_name;

				this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

				if (mode !== 'synonyms_and_matches')
					continue;

				for (const [field_name, field_data] of fields) {

					const friendly_name = field_data.friendly_name.toLowerCase();

					this.get_unmapped_headers().some(([header_name, {
						stripped_header_name,
						final_header_name
					}]) => {

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
							return this.make_mapping(path, new_path_parts, header_name, table_name);
						}

					});

				}

			}
			return;
		}

		const table_synonyms = this.find_table_synonyms(table_name, path, mode);
		let table_names :string[];
		if (table_synonyms.length === 0)
			table_names = [table_name, table_friendly_name];
		else
			table_names = table_synonyms;

		const find_mappings_in_definitions_payload = {
			path,
			table_name,
			field_name: '',
			mode,
		};

		this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

		for (const [field_name, field_data] of fields) {

			// search in definitions
			find_mappings_in_definitions_payload.field_name = field_name;
			this.find_mappings_in_definitions(find_mappings_in_definitions_payload);

			if (mode !== 'synonyms_and_matches') {
				if (table_synonyms.length === 0)
					continue;
				else {  // run though synonyms and matches if table has table_synonyms even if not in `synonyms_and_matches` mode
					find_mappings_in_definitions_payload.mode = 'synonyms_and_matches';
					this.find_mappings_in_definitions(find_mappings_in_definitions_payload);
					find_mappings_in_definitions_payload.mode = mode;
				}
			}


			const friendly_name = field_data.friendly_name.toLowerCase();
			const field_names = [
				...this.find_formatted_header_field_synonyms(table_name, field_name),
				friendly_name,
				field_name
			];

			let to_many_reference_number;
			this.get_unmapped_headers().some(([header_name, {
					lowercase_header_name,
					stripped_header_name,
					final_header_name
				}]) =>

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
				this.make_mapping(
					path,
					[field_name],
					header_name,
					table_name,
					to_many_reference_number
				)
			);

		}


		const relationships = data_model_helper.get_table_relationships(table_name, false);


		for (const [relationship_key, relationship_data] of relationships) {

			const local_path = [...path, relationship_key];

			if (data_model_helper.relationship_is_to_many(relationship_data.type))
				local_path.push(data_model_helper.format_reference_item(1));

			const new_depth_level = local_path.length;

			if (new_depth_level > this.depth)
				continue;

			if (typeof this.find_mappings_queue[new_depth_level] === "undefined")
				this.find_mappings_queue[new_depth_level] = [];

			const {foreign_name} = relationship_data;

			let current_mapping_path_part = path[path.length - 1];
			if (data_model_helper.value_is_reference_item(current_mapping_path_part) || data_model_helper.value_is_tree_rank(current_mapping_path_part))
				current_mapping_path_part = path[path.length - 2];

			if (
				(  // don't iterate over the same tables again
					mode === 'synonyms_and_matches' &&
					(
						this.searched_tables.indexOf(relationship_data.table_name) !== -1 ||
						this.find_mappings_queue[new_depth_level].map(({table_name}) =>
							table_name
						).some(table_name =>
							table_name === relationship_data.table_name
						)
					)
				) ||
				(  // skip circular relationships
					mode !== 'synonyms_and_matches' &&
					(  // skip circular relationships
						relationship_data.table_name === parent_table_name &&
						(
							(
								typeof foreign_name !== "undefined" &&
								typeof data_model_storage.tables[parent_table_name].fields[foreign_name] !== "undefined" &&
								data_model_storage.tables[parent_table_name].fields[foreign_name].foreign_name === relationship_key
							) ||
							(
								data_model_storage.tables[table_name].fields[relationship_key].foreign_name === current_mapping_path_part
							)
						)
					)
				) ||
				(  // skip -to-many inside of -to-many  // TODO: remove this once upload plan is ready
					data_model_helper.relationship_is_to_many(relationship_data.type) &&
					data_model_helper.relationship_is_to_many(parent_relationship_type)
				)
			)
				continue;

			this.find_mappings_queue[new_depth_level].push({
				table_name: relationship_data.table_name,
				path: local_path,
				parent_table_name: table_name,
				parent_relationship_type: relationship_data.type,
			});

		}

	};

	/*
	* Used to check if the table's field is already mapped and if not, makes a new mapping
	* Also, handles -to-many relationships by creating new objects
	* */
	private make_mapping(
		path :ReadonlyArray<string>,  // Mapping path from base table to this table. Should be an empty array if this is base table
		new_path_parts :mapping_path,  // Elements that should be pushed into `path`
		header_name :string,  // The name of the header that should be mapped
		table_name :string = '',  // Current table name (used to identify `don't map` conditions)
		to_many_reference_number :number | false = false  // if of type {int} - implants given to_many_reference_number into the mapping path into the first reference item starting from the right
		//													   if of type {boolean} and is False - don't do anything
	) :boolean /* false if we can map another mapping to this header. Most of the time means that the mapping was not made (Mapping fails if field is inside of a -to-one relationship or direct child of base table and is already mapped). Can also depend on this.allow_multiple_mappings */ {

		let local_path :mapping_path = [...path, ...new_path_parts];
		const last_path_part = local_path[local_path.length - 1];

		if (
			(  // if this fields is designated as unmappable in the current source
				table_name !== '' &&
				typeof auto_mapper_definitions.dont_match[table_name] !== "undefined" &&
				typeof auto_mapper_definitions.dont_match[table_name][last_path_part] !== "undefined" &&
				auto_mapper_definitions.dont_match[table_name][last_path_part].indexOf(this.scope) !== -1
			) ||
			(  // if a starting path was given and proposed mapping is outside of the path
				this.starting_path.length !== 0 &&
				helper.find_array_divergence_point(local_path, this.starting_path.slice(0, local_path.length)) === -1
			)
		)
			return false;

		// if precise -to-many index was found, insert it into the path
		if (to_many_reference_number !== false)
			local_path = local_path.reverse().reduce((modified_local_path :mapping_path, local_path_part) => {

				if (data_model_helper.value_is_reference_item(local_path_part) && to_many_reference_number !== false) {
					local_path_part = data_model_helper.format_reference_item(to_many_reference_number);
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
					!this.allow_multiple_mappings &&
					Object.values(this.results).some(mapping_paths =>
						mapping_paths.some(mapping_path =>
							JSON.stringify(local_path) === JSON.stringify(mapping_path)
						)
					)
				) ||
				(
					this.check_for_existing_mappings &&
					auto_mapper.get_mapped_fields(local_path)
				);

			if (!path_already_mapped)
				break;

			let index = local_path.length;
			let path_was_modified = Object.entries(local_path).reverse().some(([local_path_index, local_path_part]) => {

				path_was_modified = index > this.path_offset && data_model_helper.value_is_reference_item(local_path_part);
				if (path_was_modified)
					local_path[parseInt(local_path_index)] = data_model_helper.format_reference_item(data_model_helper.get_index_from_reference_item_name(local_path_part) + 1);

				index--;

				return path_was_modified;

			});

			if (!path_was_modified)
				return false;
		}


		// remove header from unmapped headers
		if (!this.allow_multiple_mappings)
			this.headers_to_map[header_name].is_mapped = true;

		if (typeof this.results[header_name] === "undefined")
			this.results[header_name] = [];

		this.results[header_name].push(local_path);


		const path_contains_to_many_references = path.some(data_model_helper.value_is_reference_item);

		return !path_contains_to_many_references && !this.allow_multiple_mappings;

	};
}

export = auto_mapper;