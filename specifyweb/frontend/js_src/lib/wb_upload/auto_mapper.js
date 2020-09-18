"use strict";

let auto_mapper_definitions = require('./json/auto_mapper_definitions.js');

/*
*
* Auto mapper than takes data model and header names and returns possible mappings
*
* */
const auto_mapper = {

	/*
	* Constructor that get's the references to needed variables from `mappings`. It is called from mappings.constructor
	* @param {object} tables - Internal object for storing data model
	* @param {object} ranks - Internal object for storing what ranks are available for particular tables and which ranks are required
	* @param {string} reference_symbol - A symbol or a string that is to be used to identify a tree node as a reference
	* @param {string} reference_symbol - A symbol or a string that is to be used to identify a tree node as a tree
	* */
	constructor(tables, ranks, reference_symbol, tree_symbol){

		auto_mapper.tables = tables;
		auto_mapper.ranks = ranks;
		auto_mapper.reference_symbol = reference_symbol;
		auto_mapper.tree_symbol = tree_symbol;

		auto_mapper.regex_1 = /[^a-z\s]+/g;
		auto_mapper.regex_2 = /\s+/g;
		auto_mapper.depth = 8;
		auto_mapper.comparisons = Object.entries({
			'regex': (header, regex) => header.match(regex),
			'string': (header, string) => header === string,
			'contains': (header, string) => header.indexOf(string) !== -1
		});

		// convert all field names in the mapping definitions to lower case
		auto_mapper_definitions = Object.fromEntries(Object.entries(auto_mapper_definitions).map(([table_name,fields]) =>
			[
				table_name.toLowerCase(),
				Object.fromEntries(Object.entries(fields).map(([field_name,field_data]) =>
					[field_name.toLowerCase(),field_data]
				))
			]
		));

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
	map(raw_headers, base_table){

		if (raw_headers.length === 0)
			return {};

		// strip extra characters to increase mapping success
		this.unmapped_headers = Object.fromEntries(raw_headers.map(original_name => {//TODO: test if regex is readable

			let stripped_name = original_name.toLowerCase();
			stripped_name = stripped_name.replace(this.regex_1, '');
			stripped_name = stripped_name.replace(this.regex_2, ' ');
			stripped_name = stripped_name.trim();
			const final_name = stripped_name.split(' ').join('');

			return [original_name,[stripped_name, final_name]];

		}));

		this.searched_tables = [];
		this.results = {};
		this.find_mappings_queue = {
			0: {}
		};
		this.find_mappings_queue[0][base_table] = [];  // add the base table to `find_mappings_queue`

		let find_mappings_queue;

		while (true) {

			find_mappings_queue = this.find_mappings_queue;
			this.find_mappings_queue = {};

			const queue_data = Object.values(find_mappings_queue);

			for(const mappings_data of queue_data)
				for(const [table_name,path] of Object.entries(mappings_data))
					auto_mapper.find_mappings(table_name, path);

			if (queue_data.length === 0)
				break;

		}

		return Object.entries(this.results);

	},

	/*
	* Used internally to loop though each field of a particular table and try to match them to unmapped headers
	* This method iterates over the same table only once
	* @param {string} table_name - Official name of the base table from data model
	* @param {array} path - Mapping path from base table to this table. Should be an empty array if this is base table
	* */
	find_mappings(table_name, path = []){

		if (
			this.searched_tables.indexOf(table_name) !== -1 ||  // don't iterate over the same table again
			path.length > auto_mapper.depth  // don't go beyond the depth limit
		)
			return;

		this.searched_tables.push(table_name);

		const table_data = auto_mapper.tables[table_name];
		const ranks_data = auto_mapper.ranks[table_name];
		const fields = Object.entries(table_data['fields']).filter(([,field_data])=>!field_data['is_hidden']);
		const friendly_table_name = table_data['friendly_table_name'].toLowerCase();//TODO: remove numbers from the name

		if (typeof ranks_data !== "undefined"){//TODO: make ranks iterate over relationships too
			for(const rank_name of Object.keys(ranks_data)){

				const striped_rank_name = rank_name.toLowerCase();
				const final_rank_name = auto_mapper.tree_symbol + rank_name;

				for(const [field_name,field_data] of fields){

					const friendly_field_name = field_data['friendly_field_name'].toLowerCase();

					Object.entries(this.unmapped_headers).some(([header_name,header_data]) => {

						if(header_data===false)//skip mapped headers
							return true;

						let [stripped_name, final_name] = header_data;

						if (
							(  // find cases like `Phylum` and remap them to `Phylum > Name`
								friendly_field_name === 'name' &&
								striped_rank_name === stripped_name
							) ||
							(  // find cases like `Kingdom Author`
								striped_rank_name + ' ' + friendly_field_name === stripped_name ||
								striped_rank_name + ' ' + field_name === final_name
							)
						) {
							auto_mapper.make_mapping(path, [final_rank_name, field_name], header_name);
							return true;  // don't search for further mappings for this field since we can only
							// map a single header to the same field
						}

					});

				}

			}
			return;
		}

		for(const [field_name,field_data] of fields){

			// search in definitions
			if (
				typeof auto_mapper_definitions[table_name] !== "undefined" &&
				typeof auto_mapper_definitions[table_name][field_name] !== "undefined"
			) {

				const field_comparisons = auto_mapper_definitions[table_name][field_name];

				// compile regex strings
				if (typeof field_comparisons['regex'] !== "undefined")
					for(const [regex_index,regex_string] of Object.entries(field_comparisons['regex']))
						field_comparisons['regex'][regex_index] = new RegExp(regex_string);

				for(const [header_key,header] of Object.entries(this.unmapped_headers)){// loop over headers

					if (header !== false) {

						const lowercase_header_key = header_key.toLowerCase();

						let matched = false;

						auto_mapper.comparisons.some(([comparison_key,comparison_function]) => {  // loop over defined comparisons

							if (typeof field_comparisons[comparison_key] !== "undefined")
								Object.values(field_comparisons[comparison_key]).some(comparison_value => {  // loop over each value of a comparison
									if (comparison_function(lowercase_header_key, comparison_value)) {
										matched = auto_mapper.make_mapping(path, [field_name], header_key);
										if (matched)
											return true;
									}
								});

							if (matched)
								return true;

						});

					}
				}
			}


			// compare each field's schema name and friendly schema name to headers
			const friendly_field_name = field_data['friendly_field_name'].toLowerCase();

			for(const [header_name,header_data] of Object.entries(this.unmapped_headers)){

				if(header_data===false)  // skip mapped headers
					continue;

				let [stripped_name, final_name] = header_data;

				if (
					field_name === stripped_name ||
					friendly_field_name === final_name ||
					(  // find cases like `Collection Object Remarks`
						friendly_table_name + ' ' + friendly_field_name === stripped_name ||
						table_name + ' ' + field_name === final_name
					)
				)
					auto_mapper.make_mapping(path, [field_name], header_name);

			}

		}


		const relationships = Object.entries(table_data['relationships']).filter((relationship_data => !relationship_data['is_hidden']));


		for(const [relationship_key,relationship_data] of relationships){

			const local_path = [...path,relationship_key];

			if (relationship_data['type'] === 'one-to-many' || relationship_data['type'] === 'many-to-many')
				local_path.push(auto_mapper.reference_symbol + 1);

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

		let local_path = [...path,...new_path_parts];
		const zipped_local_path = Object.entries(local_path);


		// check if this path is already mapped
		while (true) {

			// go over mapped headers to see if this path was already mapped
			let path_already_mapped = Object.values(this.results).some(mapping_path => local_path === mapping_path );

			if (!path_already_mapped)
				break;

			// if there is any -to-many relationship in the path, create a new -to-many object and run while loop again
			let path_was_modified = false;

			local_path = zipped_local_path.reverse().some(([local_path_index,local_path_part]) => {

				path_was_modified = local_path_part.substr(0, auto_mapper.reference_symbol.length) === auto_mapper.reference_symbol;
				if (path_was_modified)
					local_path[local_path_index] = auto_mapper.reference_symbol + (parseInt(local_path_part.substr(auto_mapper.reference_symbol.length)) + 1);

				return path_was_modified;

			});

			if (!path_was_modified)
				return false;
		}


		// prevent -to-many inside of -to-many // TODO: remove this in the future
		let distance_from_parent_to_many=-1;
		let has_nested_to_many = local_path.some(element => {
			const is_to_many = element.substr(0, auto_mapper.reference_symbol.length) === auto_mapper.reference_symbol;

			if(distance_from_parent_to_many===1 && is_to_many)
				return true;

			if(is_to_many)
				distance_from_parent_to_many = 0;
			else if(distance_from_parent_to_many!==-1)
				distance_from_parent_to_many++;

			return false;

		});

		if(has_nested_to_many)
			return false;


		// remove header from unmapped headers
		this.unmapped_headers[header_name] = false;

		this.results[header_name] = local_path;

		return true;  // return whether the field got mapped or was mapped previously

	},
};

module.exports = auto_mapper;