"use strict";

/*
*
* Helper class for converting from upload plan to internal structure and vice versa
*
* */

const upload_plan_converter = {

	/*
	* Constructor that get's the references to needed variables from `mappings`. It is called from mappings.constructor
	* @param {string} base_table_name - Official name of the base table (from data model)
	* @param {function} set_base_table_name - Function that updates the value of base_table_name in `mappings`
	* @param {string} reference_symbol - A symbol or a string that is to be used to identify a tree node as a reference
	* @param {function} get_mappings_tree - Reference to a function that returns the mappings tree as an object
	* @param {object} ranks - Internal object for storing what ranks are available for particular tables and which ranks are required
	* @param {object} tables - Internal object for storing data model
	* */
	constructor: (base_table_name, set_base_table_name, tree_symbol, reference_symbol, get_mappings_tree, ranks, tables) => {

		upload_plan_converter.base_table_name = base_table_name;
		upload_plan_converter.set_base_table_name = set_base_table_name;
		upload_plan_converter.tree_symbol = tree_symbol;
		upload_plan_converter.reference_symbol = reference_symbol;
		upload_plan_converter.get_mappings_tree = get_mappings_tree;
		upload_plan_converter.ranks = ranks;
		upload_plan_converter.tables = tables;

	},

	/*
	* Converts upload plan to internal tree structure
	* Inverse of get_upload_plan
	* @param {object} upload_plan - Upload plan
	* @param {bool} [base_table_name_extracted=false] - Used by recursion to store intermediate results
	* @return {object} Returns mapping tree
	* */
	upload_plan_to_mappings_tree: (upload_plan, base_table_name_extracted = false) => {

		if (base_table_name_extracted === false) {
			upload_plan_converter.set_base_table_name(upload_plan['baseTableName']);

			return upload_plan_converter.upload_plan_to_mappings_tree(upload_plan['uploadable'], true);
		} else if (typeof upload_plan['uploadTable'] !== "undefined")
			return upload_plan_converter.upload_plan_to_mappings_tree(upload_plan['uploadTable'], true);

		else if (typeof upload_plan['treeRecord'] !== "undefined") {

			const tree_ranks = upload_plan['treeRecord']['ranks'];

			return Object.keys(tree_ranks).reduce((new_tree, rank_name) => {

				const new_rank_name = upload_plan_converter.tree_symbol + rank_name;
				new_tree[new_rank_name] = {'name': tree_ranks[rank_name]};
				return new_tree;

			}, {});

		}

		return Object.keys(upload_plan).reduce((tree, plan_node_name) => {

			if (plan_node_name === 'wbcols') {

				const workbench_headers = upload_plan[plan_node_name];

				return Object.keys(workbench_headers).reduce((tree, data_model_header_name) => {
					tree[data_model_header_name] = workbench_headers[data_model_header_name];
					return tree;
				}, tree);

			} else if (plan_node_name === 'static') {

				const static_headers = upload_plan[plan_node_name];

				return Object.keys(static_headers).reduce((tree, data_model_header_name) => {
					tree[data_model_header_name] = {'static': static_headers[data_model_header_name]};
					return tree;
				}, tree);

			} else if (plan_node_name === 'toOne') {

				const to_one_headers = upload_plan[plan_node_name];

				return Object.keys(to_one_headers).reduce((tree, data_model_header_name) => {
					tree[data_model_header_name] = upload_plan_converter.upload_plan_to_mappings_tree(to_one_headers[data_model_header_name], true);
					return tree;
				}, tree);

			} else if (plan_node_name === 'toMany') {

				const to_many_headers = upload_plan[plan_node_name];

				return Object.keys(to_many_headers).reduce((tree, table_name) => {

					const final_mappings = {};
					const original_mappings = to_many_headers[table_name];
					let i = 1;

					tree[table_name] = Object.values(original_mappings).reduce((final_mappings, mapping) => {

						const final_mappings_key = upload_plan_converter.reference_symbol + i;
						final_mappings[final_mappings_key] = upload_plan_converter.upload_plan_to_mappings_tree(mapping, true);

						i++;
						return final_mappings;

					}, final_mappings);

					return tree;
				}, tree);

			}

		}, {});

	},

	/*
	* Converts mappings tree to upload plan
	* Inverse of upload_plan_to_mappings_tree
	* @param {mixed} [mappings_tree=''] - Mappings tree that is going to be used. Else, result of get_mappings_tree() would be used
	* @return {string} Upload plan as a JSON string
	* */
	get_upload_plan: (mappings_tree = '') => {

		if (mappings_tree === '')
			mappings_tree = upload_plan_converter.get_mappings_tree();
		const upload_plan = {};

		upload_plan['baseTableName'] = upload_plan_converter.base_table_name();

		function handle_table(table_data, table_name, wrap_it = true) {

			if (typeof upload_plan_converter.ranks[table_name] !== "undefined") {

				const final_tree = Object.keys(table_data).reduce((final_tree, tree_key) => {

					const new_tree_key = tree_key.substr(upload_plan_converter.tree_symbol.length);
					let name = table_data[tree_key]['name'];

					if (typeof name === 'object')//handle static records
						name = name['static'];

					final_tree[new_tree_key] = name;

					return final_tree;

				}, {});

				return {'treeRecord': {'ranks': final_tree}};
			}

			let table_plan = {
				'wbcols': {},
				'static': {},
				'toOne': {},
			};

			if (wrap_it)
				table_plan['toMany'] = {};

			let is_to_many = false;

			table_plan = Object.keys(table_data).reduce((table_plan, field_name) => {

				if (field_name.substr(0, upload_plan_converter.reference_symbol.length) === upload_plan_converter.reference_symbol) {
					if (!is_to_many) {
						is_to_many = true;
						table_plan = [];
					}

					table_plan.push(handle_table(table_data[field_name], table_name, false));
				} else if (field_name.substr(0, upload_plan_converter.tree_symbol.length) === upload_plan_converter.tree_symbol)
					table_plan = handle_table(table_data, table_name, false);

				else if (typeof table_data[field_name] === "object" && typeof table_data[field_name]['static'] === "string") {
					let value = table_data[field_name]['static'];

					if (value === 'true')
						value = true;
					else if (value === 'false')
						value = false;
					else if (!isNaN(value))
						value = parseInt(value);

					table_plan['static'][field_name] = value;
				} else if (typeof upload_plan_converter.tables[table_name]['fields'][field_name] !== "undefined")
					table_plan['wbcols'][field_name] = table_data[field_name];

				else {

					const mapping = upload_plan_converter.tables[table_name]['relationships'][field_name];
					const mapping_table = mapping['table_name'];
					const is_to_one = mapping['type'] === 'one-to-one' || mapping['type'] === 'many-to-one';

					if (is_to_one && typeof table_plan['toOne'][field_name] === "undefined")
						table_plan['toOne'][field_name] = handle_table(table_data[field_name], mapping_table);

					else {

						if (typeof table_plan['toMany'] === "undefined")
							table_plan['toMany'] = {};

						if (typeof table_plan['toMany'][field_name] === "undefined")
							table_plan['toMany'][field_name] = handle_table(table_data[field_name], mapping_table);

					}

				}

				return table_plan;

			}, table_plan);


			if (Array.isArray(table_plan) || !wrap_it)
				return table_plan;

			const keys = Object.keys(table_data);

			if (keys[0].substr(0, upload_plan_converter.reference_symbol.length) === upload_plan_converter.reference_symbol)
				return table_plan;

			return {'uploadTable': table_plan};

		}


		upload_plan['uploadable'] = handle_table(mappings_tree, upload_plan_converter.base_table_name());

		return JSON.stringify(upload_plan, null, "\t");

	},

};

module.exports = upload_plan_converter;