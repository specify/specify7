"use strict";

let auto_mapper_definitions = require('./json/auto_mapper_definitions.js');
let data_model = require('./data_model.js');
let cache = require('./cache.js');

/*
*
* Auto mapper than takes data model and header names and returns possible mappings
*
* */
const auto_mapper = {

	regex_1: /[^a-z\s]+/g,
	regex_2: /\s+/g,
	depth: 8,
	comparisons: Object.entries({
		regex: (header, regex) => header.match(regex),
		string: (header, string) => header === string,
		contains: (header, string) => header.indexOf(string) !== -1
	}),
	mapped_definitions_were_converted: false,

	/*
	* Constructor that get's the references to needed variables from `mappings`. It is called from mappings.constructor
	* @param {object} tables - Internal object for storing data model
	* @param {object} ranks - Internal object for storing what ranks are available for particular tables and which ranks are required
	* @param {string} reference_symbol - A symbol or a string that is to be used to identify a tree node as a reference
	* @param {string} reference_symbol - A symbol or a string that is to be used to identify a tree node as a tree
	* */
	auto_mapper_definitions_to_lower_case(){

		auto_mapper.mapped_definitions_were_converted = true;

		// convert all table names and field names in the mapping definitions to lower case
		const to_lower_case = (object) => Object.fromEntries(
				Object.entries(object).map(([table_name, fields]) =>
					[
						table_name.toLowerCase(),
						Object.fromEntries(Object.entries(fields).map(([field_name, field_data]) =>
							[field_name.toLowerCase(), field_data]
						))
					]
				)
			);

		auto_mapper_definitions['shortcuts'] = to_lower_case(auto_mapper_definitions['shortcuts']);
		auto_mapper_definitions['synonyms'] = to_lower_case(auto_mapper_definitions['synonyms']);


	},

	/*
	* Method that would be used by external classes to match headers to possible mappings
	* @param {array} raw_headers - Array of strings that represent headers
	* @param {string} base_table - Official name of the base table from data model
	* @return {array} Returns mappings result in format [header_name, mapping_path]
	* mapping path may look like:
	* 	[Accession, Accession Number]
	* 	OR
	* 	[Accession, Accession Agents, #1, Agent, Agent Type]
	* */
	map(payload){

		const {
			headers: raw_headers,
			base_table,
			path = [],
			path_offset = 0,
			allow_multiple_mappings = false,
			use_cache = true,
			commit_to_cache = true,
			check_for_existing_mappings = false,
		} = payload;


		const cache_name = JSON.stringify(payload);

		if(use_cache && commit_to_cache){
			const cached_data = cache.get('automapper',cache_name);
			if(cached_data)
				return cached_data;
		}

		if(!auto_mapper.mapped_definitions_were_converted)
			auto_mapper.auto_mapper_definitions_to_lower_case();

		if (raw_headers.length === 0)
			return {};

		// strip extra characters to increase mapping success
		this.unmapped_headers = Object.fromEntries(raw_headers.map(original_name => {

			let stripped_name = original_name.toLowerCase();
			stripped_name = stripped_name.replace(this.regex_1, '');
			stripped_name = stripped_name.replace(this.regex_2, ' ');
			stripped_name = stripped_name.trim();
			const final_name = stripped_name.split(' ').join('');

			return [original_name, [stripped_name, final_name]];

		}));

		this.searched_tables = [];
		this.results = {};
		this.allow_multiple_mappings = allow_multiple_mappings;
		this.check_for_existing_mappings = check_for_existing_mappings;
		this.path_offset = path.length - path_offset;
		this.find_mappings_queue = {
			0: {}
		};
		this.find_mappings_queue[0][base_table] = path;  // add the base table to `find_mappings_queue`

		let find_mappings_queue;

		auto_mapper.find_mappings_in_defined_shortcuts(base_table);

		while (true) {

			find_mappings_queue = this.find_mappings_queue;
			this.find_mappings_queue = {};

			const queue_data = Object.values(find_mappings_queue);

			for (const mappings_data of queue_data)
				for (const [table_name, path] of Object.entries(mappings_data))
					auto_mapper.find_mappings(table_name, path);

			if (queue_data.length === 0)
				break;

		}

		if(!this.allow_multiple_mappings)
			for(const [header_name, mapping_paths] of Object.entries(this.results))
				this.results[header_name] = mapping_paths[0];

		const result = Object.entries(this.results);

		if(commit_to_cache)
			cache.set('automapper',cache_name,result);

		return result;

	},

	find_mappings_in_defined_shortcuts(table_name, previous_table_name = '', path = []){

		if (path.length > auto_mapper.depth)  // don't go beyond the depth limit
			return;

		const table_data = data_model.tables[table_name];

		// handle trees
		if (data_model.table_is_tree(table_name)) {

			const keys = Object.keys(data_model.ranks[table_name]);
			const last_path_element = path.slice(-1)[0];
			const last_path_element_is_a_rank = data_model.value_is_tree_rank(last_path_element);

			if (!last_path_element_is_a_rank)
				return keys.reduce((results, rank_name) => {
					const is_rank_required = data_model.ranks[table_name][rank_name];
					const complimented_rank_name = data_model.tree_symbol + rank_name;
					const local_path = [...path, complimented_rank_name];

					if (list_of_mapped_fields.indexOf(complimented_rank_name) !== -1)
						auto_mapper.find_mappings_in_defined_shortcuts(table_name, previous_table_name, local_path, results);
					else if (is_rank_required)
						results.push(local_path);

					return results;

				}, results);
		}

		// handle regular fields and relationships
		for (const [field_name, field_data] of Object.entries(table_data['fields'])) {

			const local_path = [...path, field_name];

			const is_mapped = list_of_mapped_fields.indexOf(field_name) !== -1;


			if (field_data['is_relationship']) {

				if(previous_table_name !== ''){

					let previous_relationship_name = local_path.slice(-2)[0];
					if (
						data_model.value_is_reference_item(previous_relationship_name) ||
						data_model.value_is_tree_rank(previous_relationship_name)
					)
						previous_relationship_name = local_path.slice(-3)[0];

					const parent_relationship_data = data_model.tables[previous_table_name]['fields'][previous_relationship_name];

					if (
						(  // disable circular relationships
							field_data['foreign_name'] === previous_relationship_name &&
							field_data['table_name'] === previous_table_name
						) ||
						(  // skip -to-many inside of -to-many
							parent_relationship_data['type'].indexOf('-to-many') !== -1 &&
							field_data['type'].indexOf('-to-many') !== -1
						)
					)
						continue;

				}

				if(is_mapped)
					auto_mapper.find_mappings_in_defined_shortcuts(field_data['table_name'], table_name, local_path, results);
				else if (field_data['is_required'])
					results.push(local_path);
			}

			else if (!is_mapped && field_data['is_required'])
				results.push(local_path);


		}

	},

	find_mappings_in_definitions(path, table_name, field_name, is_tree_rank=false){

		if (
			typeof auto_mapper_definitions['synonyms'][table_name] !== "undefined" &&
			typeof auto_mapper_definitions['synonyms'][table_name][field_name] !== "undefined"
		) {

			const field_comparisons = auto_mapper_definitions['synonyms'][table_name][field_name];

			// compile regex strings
			if (typeof field_comparisons['regex'] !== "undefined")
				for (const [regex_index, regex_string] of Object.entries(field_comparisons['regex']))
					field_comparisons['regex'][regex_index] = new RegExp(regex_string);

			for (const [header_key, header] of Object.entries(this.unmapped_headers)) {// loop over headers

				if (header !== false) {

					const lowercase_header_key = header_key.toLowerCase();

					let matched = false;

					auto_mapper.comparisons.some(([comparison_key, comparison_function]) => {  // loop over defined comparisons

						if (typeof field_comparisons[comparison_key] !== "undefined")
							Object.values(field_comparisons[comparison_key]).some(comparison_value => {  // loop over each value of a comparison
								if (comparison_function(lowercase_header_key, comparison_value)) {

									let new_path_parts;
									if(is_tree_rank)
										new_path_parts = [data_model.tree_symbol + field_name[0].toUpperCase() + field_name.substr(1), 'name'];
									else
										new_path_parts = [field_name];

									return matched = auto_mapper.make_mapping(path, new_path_parts, header_key);

								}
							});

						return matched;

					});

				}
			}
		}

	},

	/*
	* Used internally to loop though each field of a particular table and try to match them to unmapped headers
	* This method iterates over the same table only once
	* @param {string} table_name - Official name of the base table from data model
	* @param {array} path - Mapping path from base table to this table. Should be an empty array if this is base table
	* */
	find_mappings(table_name, path = [], index = true){

		if (
			this.searched_tables.indexOf(table_name) !== -1 ||  // don't iterate over the same table again
			path.length > auto_mapper.depth  // don't go beyond the depth limit
		)
			return;

		this.searched_tables.push(table_name);

		const table_data = data_model.tables[table_name];
		const ranks_data = data_model.ranks[table_name];
		const fields = Object.entries(table_data['fields']).filter(([, field_data]) =>
			!field_data['is_hidden'] &&
			!field_data['is_relationship']
		);
		const table_friendly_name = table_data['table_friendly_name'].toLowerCase();

		if (index && typeof ranks_data !== "undefined") {

			let ranks = Object.keys(ranks_data);
			const push_rank_to_path = path.length<=0 || !data_model.value_is_tree_rank(path[path.length-1]);

			if(!push_rank_to_path) {
				ranks = [data_model.get_name_from_tree_rank_name(path[path.length-1])];
			}

			for (const rank_name of ranks) {

				const striped_rank_name = rank_name.toLowerCase();
				const final_rank_name = data_model.tree_symbol + rank_name;

				auto_mapper.find_mappings_in_definitions(path, table_name,striped_rank_name,true);

				for (const [field_name, field_data] of fields) {

					const friendly_name = field_data['friendly_name'].toLowerCase();

					Object.entries(this.unmapped_headers).some(([header_name, header_data]) => {

						if (header_data === false)//skip mapped headers
							return false;

						let [stripped_name, final_name] = header_data;

						if (
							(  // find cases like `Phylum` and remap them to `Phylum > Name`
								friendly_name === 'name' &&
								striped_rank_name === stripped_name
							) ||
							(  // find cases like `Kingdom Author`
								striped_rank_name + ' ' + friendly_name === stripped_name ||
								striped_rank_name + ' ' + field_name === final_name
							)
						) {

							let new_path_parts;
							if(push_rank_to_path)
								new_path_parts = [final_rank_name, field_name];
							else
								new_path_parts = [field_name];

							auto_mapper.make_mapping(path, new_path_parts, header_name);
							return true;  // don't search for further mappings for this field since we can only
							// map a single header to the same field
						}

					});

				}

			}
			return;
		}

		for (const [field_name, field_data] of fields) {

			// search in definitions
			auto_mapper.find_mappings_in_definitions(path,table_name,field_name);


			// compare each field's schema name and friendly schema name to headers
			const friendly_name = field_data['friendly_name'].toLowerCase();

			for (const [header_name, header_data] of Object.entries(this.unmapped_headers)) {

				if (header_data === false)  // skip mapped headers
					continue;

				let [stripped_name, final_name] = header_data;

				if (
					field_name === header_name.toLowerCase() ||
					field_name === stripped_name ||
					field_name === final_name ||
					friendly_name === final_name ||
					(  // find cases like `Collection Object Remarks`
						table_friendly_name + ' ' + friendly_name === stripped_name ||
						table_name + ' ' + field_name === final_name
					)
				)
					auto_mapper.make_mapping(path, [field_name], header_name);

			}

		}


		const relationships = Object.entries(table_data['fields']).filter(([, {is_hidden, is_relationship}]) =>
			!is_hidden && is_relationship
		);


		for (const [relationship_key, relationship_data] of relationships) {

			const local_path = [...path, relationship_key];

			if (data_model.relationship_is_to_many(relationship_data['type']))
				local_path.push(data_model.format_reference_item(1));

			const new_depth_level = local_path.length;

			if (new_depth_level > auto_mapper.depth)
				continue;

			if (typeof this.find_mappings_queue[new_depth_level] === "undefined")
				this.find_mappings_queue[new_depth_level] = {};

			if (
				typeof this.find_mappings_queue[new_depth_level][relationship_data['table_name']] !== "undefined" ||
				this.searched_tables.indexOf(relationship_data['table_name']) !== -1
			)
				continue;  // don't add the same tables again

			this.find_mappings_queue[new_depth_level][relationship_data['table_name']] = local_path;

		}

	},

	/*
	* Used to check if the table's field is already mapped and if not, makes a new mapping
	* Also, handles -to-many relationships by creating new objects
	* @param {array} path - Mapping path from base table to this table. Should be an empty array if this is base table
	* @param {array} new_path_parts - Elements that should be pushed into `path`
	* @param {string} header_name - The name of the header that should be mapped
	* @return {bool} Whether mapping was made. Mapping fails if field is inside of a -to-one relationship or direct child of base table and is already mapped
	* */
	make_mapping(path, new_path_parts, header_name){

		let local_path = [...path, ...new_path_parts];

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
					auto_mapper.get_mapped_fields(local_path) !== false
				);

			if (!path_already_mapped)
				break;

			let index = local_path.length;
			let path_was_modified = Object.entries(local_path).reverse().some(([local_path_index, local_path_part]) => {

				path_was_modified = index>auto_mapper.path_offset && data_model.value_is_reference_item(local_path_part);
				if (path_was_modified)
					local_path[local_path_index] = data_model.format_reference_item(data_model.get_index_from_reference_item_name(local_path_part) + 1);

				index--;

				return path_was_modified;

			});

			if (!path_was_modified)
				return false;
		}

		// prevent -to-many inside of -to-many // TODO: remove this in the future
		let distance_from_parent_to_many = -1;
		let has_nested_to_many = local_path.some(element => {
			const is_to_many = data_model.value_is_reference_item(element);

			if (distance_from_parent_to_many === 1 && is_to_many)
				return true;

			if (is_to_many)
				distance_from_parent_to_many = 0;
			else if (distance_from_parent_to_many !== -1)
				distance_from_parent_to_many++;

			return false;

		});

		if (has_nested_to_many)
			return false;


		// remove header from unmapped headers
		if(!this.allow_multiple_mappings)
			this.unmapped_headers[header_name] = false;

		if(typeof this.results[header_name] === "undefined")
			this.results[header_name] = [];

		this.results[header_name].push(local_path);

		return !this.allow_multiple_mappings;  // return whether the field got mapped or was mapped previously

	},
};

module.exports = auto_mapper;