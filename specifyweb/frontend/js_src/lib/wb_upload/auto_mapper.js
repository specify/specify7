"use strict";

const raw_auto_mapper_definitions = require('./json/auto_mapper_definitions.js');

const auto_mapper = {

	//get data model and ranks
	constructor: (tables, ranks, reference_symbol, tree_symbol) => {

		auto_mapper.tables = tables;
		auto_mapper.ranks = ranks;
		auto_mapper.reference_symbol = reference_symbol;
		auto_mapper.tree_symbol = tree_symbol;

		auto_mapper.regex_1 = /[^a-z\s]+/g;
		auto_mapper.regex_2 = /\s+/g;
		auto_mapper.depth = 8;//TODO: experiment with the best depth value
		auto_mapper.comparisons = {
			'regex': (header, regex) => {
				return header.match(regex);
			},
			'string': (header, string) => {
				return header === string;
			},
			'contains': (header, string) => {
				return header.indexOf(string) !== -1;
			}
		};

		const new_auto_mapper_definitions = {};

		Object.keys(raw_auto_mapper_definitions).forEach((table_name) => {
			const new_table_name = table_name.toLowerCase();

			const new_fields = {};
			const fields = raw_auto_mapper_definitions[table_name];
			Object.keys(fields).forEach((field_name) => {
				const new_field_name = field_name.toLowerCase();
				new_fields[new_field_name] = fields[field_name];
			});

			new_auto_mapper_definitions[new_table_name] = fields;
		});

		auto_mapper.auto_mapper_definitions = new_auto_mapper_definitions;

	},

	//find mapping for each header
	map: (raw_headers, base_table) => {

		const headers = {};

		if (raw_headers.length === 0)
			return headers;

		//strip extra characters to increase mapping success
		raw_headers.forEach(function (original_name) {

			let stripped_name = original_name.toLowerCase();
			stripped_name = stripped_name.replace(auto_mapper.regex_1, '');
			stripped_name = stripped_name.replace(auto_mapper.regex_2, ' ');
			stripped_name = stripped_name.trim();
			const final_name = stripped_name.split(' ').join('');

			headers[original_name] = [stripped_name, final_name];

		});

		auto_mapper.searched_tables = [];
		auto_mapper.results = {};
		auto_mapper.unmapped_headers = headers;


		auto_mapper.find_mappings_queue = {
			0: {}
		};
		auto_mapper.find_mappings_queue[0][base_table] = [];//add the base table to `find_mappings_queue`

		let depth_keys = Object.keys(auto_mapper.find_mappings_queue);
		let find_mappings_queue;

		while (true) {

			find_mappings_queue = auto_mapper.find_mappings_queue;
			auto_mapper.find_mappings_queue = {};

			depth_keys.forEach((depth_level) => {
				const mappings_data = find_mappings_queue[depth_level];

				Object.keys(mappings_data).forEach((table_name) => {

					const path = mappings_data[table_name];

					auto_mapper.find_mappings(table_name, path);

				});

			});

			depth_keys = Object.keys(auto_mapper.find_mappings_queue);

			if (depth_keys.length === 0)
				break;

		}

		return auto_mapper.results;

	},

	find_mappings: (table_name, path = []) => {

		if (
			auto_mapper.searched_tables.indexOf(table_name) !== -1 ||//don't iterate over the same table again
			path.length > auto_mapper.depth//don't go beyond the depth limit
		)
			return;

		auto_mapper.searched_tables.push(table_name);

		const table_data = auto_mapper.tables[table_name];
		const ranks_data = auto_mapper.ranks[table_name];
		const fields = table_data['fields'];
		const friendly_table_name = table_data['friendly_table_name'].toLowerCase();

		if (typeof ranks_data !== "undefined") {

			Object.keys(ranks_data).forEach((rank_name) => {

				const striped_rank_name = rank_name.toLowerCase();
				const final_rank_name = auto_mapper.tree_symbol + rank_name;

				Object.keys(fields).forEach((field_name) => {

					const field_data = fields[field_name];

					if(field_data['is_hidden']===true)
						return true;//skip hidden fields

					const friendly_field_name = field_data['friendly_field_name'].toLowerCase();

					Object.keys(auto_mapper.unmapped_headers).forEach((header_name) => {

						const header_data = auto_mapper.unmapped_headers[header_name];

						if (header_data === false)
							return true;//skip mapped

						let stripped_name;
						let final_name;

						[stripped_name, final_name] = header_data;

						if (
							(//find cases like `Phylum` and remap them to `Phylum > Name`
								friendly_field_name === 'name' &&
								striped_rank_name === stripped_name
							) ||
							(//find cases like `Kingdom Author`
								striped_rank_name + ' ' + friendly_field_name === stripped_name ||
								striped_rank_name + ' ' + field_name === final_name
							)
						){
							auto_mapper.make_mapping(path, [final_rank_name, field_name], header_name);
							return false;//don't search for further mappings for this field since we can only
							//map a single header to the same field
						}

					});

				});

			});

			return;
		}

		Object.keys(fields).forEach((field_name) => {

			const field_data = fields[field_name];

			if(field_data['is_hidden']===true)
				return true;//skip hidden fields

			//search in definitions
			if (
				typeof auto_mapper.auto_mapper_definitions[table_name] !== "undefined" &&
				typeof auto_mapper.auto_mapper_definitions[table_name][field_name] !== "undefined"
			) {

				const field_comparisons = auto_mapper.auto_mapper_definitions[table_name][field_name];

				//compile regex strings
				if (typeof field_comparisons['regex'] !== "undefined")
					Object.keys(field_comparisons['regex']).forEach((regex_index) => {
						field_comparisons['regex'][regex_index] = new RegExp(field_comparisons['regex'][regex_index]);
					});

				Object.keys(auto_mapper.unmapped_headers).forEach((header_key) => {//loop over headers

					const header = auto_mapper.unmapped_headers[header_key];
					if (header !== false) {

						const lowercase_header_key = header_key.toLowerCase();

						let matched = false;

						Object.keys(auto_mapper.comparisons).forEach((comparison_key) => {//loop over defined comparisons

							if (typeof field_comparisons[comparison_key] !== "undefined")
								Object.values(field_comparisons[comparison_key]).forEach((comparison_value) => {//loop over each value of a comparison
									if (auto_mapper.comparisons[comparison_key](lowercase_header_key, comparison_value)) {
										matched = auto_mapper.make_mapping(path, [field_name], header_key);
										if (matched)
											return false;
									}
								});

							if (matched)
								return false;

						});

					}
				});
			}


			//compare each field's schema name and friendly schema name to headers
			const friendly_field_name = field_data['friendly_field_name'].toLowerCase();

			Object.keys(auto_mapper.unmapped_headers).forEach((header_name) => {

				const header_data = auto_mapper.unmapped_headers[header_name];

				if (header_data === false)
					return true;

				let stripped_name;
				let final_name;

				[stripped_name, final_name] = header_data;

				if (
					field_name === stripped_name ||
					friendly_field_name === final_name ||
					(//find cases like `Collection Object Remarks`
						friendly_table_name + ' ' + friendly_field_name === stripped_name ||
						table_name + ' ' + field_name === final_name
					)
				)
					auto_mapper.make_mapping(path, [field_name], header_name);

			});

		});


		const relationships = table_data['relationships'];


		Object.keys(relationships).forEach((relationship_key) => {

			const relationship_data = relationships[relationship_key];

			if(relationship_data['is_hidden']===true)
				return true;//skip hidden relationships

			const local_path = path.slice();
			local_path.push(relationship_key);

			if (relationship_data['type'] === 'one-to-many' || relationship_data['type'] === 'many-to-many')
				local_path.push(auto_mapper.reference_symbol + 1);

			const new_depth_level = local_path.length;

			if(new_depth_level>auto_mapper.depth)
				return true;

			if (typeof auto_mapper.find_mappings_queue[new_depth_level] === "undefined")
				auto_mapper.find_mappings_queue[new_depth_level] = {};

			if(
				typeof auto_mapper.find_mappings_queue[new_depth_level][relationship_data['table_name']] !== "undefined" ||
				auto_mapper.searched_tables.indexOf(relationship_data['table_name']) !== -1
			)
				return true;//don't add the same tables again

			auto_mapper.find_mappings_queue[new_depth_level][relationship_data['table_name']] = local_path;

		});

	},

	make_mapping: (path, new_path_parts, header_name) => {

		const local_path = path.slice();

		new_path_parts.forEach((part) => {
			local_path.push(part);
		});

		//check if this path is already mapped
		while (true) {

			//go over mapped headers to see if this path was already mapped
			let path_already_mapped = false;
			Object.values(auto_mapper.results).forEach((mapping_path) => {
				if (path === mapping_path) {
					path_already_mapped = true;
					return false;
				}
			});

			if (!path_already_mapped)
				break;

			//if there is any -to-many relationship in the path, create a new -to-many object and run while loop again
			let local_path_copy = local_path.slice();
			let path_was_modified = false;
			Object.keys(local_path_copy).reverse().forEach((path_index) => {

				if (local_path_copy[path_index].substr(0, auto_mapper.reference_symbol.length) === auto_mapper.reference_symbol) {
					local_path_copy[path_index] = auto_mapper.reference_symbol + (parseInt(local_path_copy[path_index].substr(auto_mapper.reference_symbol.length)) + 1);
					path_was_modified = true;
				}

			});

			if (!path_was_modified)
				return false;
		}

		//remove header from unmapped headers
		auto_mapper.unmapped_headers[header_name] = false;

		auto_mapper.results[header_name] = local_path;

		return true;//return whether the field got mapped or was mapped previously

	},
};

module.exports = auto_mapper;