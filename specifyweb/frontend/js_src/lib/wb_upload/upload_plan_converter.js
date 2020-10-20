"use strict";

/*
*
* Helper class for converting from upload plan to internal structure and vice versa
*
* */

const upload_plan_converter = {

	upload_plan_processing_functions: {
		wbcols: ([key, value]) => [key, value],
		static: ([key, value]) => [key, {static: value}],
		toOne: ([key, value]) => [key, upload_plan_converter.upload_plan_to_mappings_tree(value, true)],
		toMany: ([key, original_mappings]) => {
			let i = 1;
			return [
				key,
				Object.fromEntries(Object.values(original_mappings).map(mapping =>
					[
						upload_plan_converter.reference_symbol + (i++),
						upload_plan_converter.upload_plan_to_mappings_tree(mapping, true)
					]
				))
			];
		},
	},

	/*
	* Constructor that get's the references to needed variables from `mappings`. It is called from mappings.constructor
	* @param {string} base_table_name - Official name of the base table (from data model)
	* @param {function} set_base_table_name - Function that updates the value of base_table_name in `mappings`
	* @param {string} reference_symbol - A symbol or a string that is to be used to identify a tree node as a reference
	* @param {function} get_mappings_tree - Reference to a function that returns the mappings tree as an object
	* @param {object} ranks - Internal object for storing what ranks are available for particular tables and which ranks are required
	* @param {object} tables - Internal object for storing data model
	* */
	constructor(base_table_name, set_base_table_name, tree_symbol, reference_symbol, get_mappings_tree, ranks, tables){

		this.base_table_name = base_table_name;
		this.set_base_table_name = set_base_table_name;
		upload_plan_converter.tree_symbol = tree_symbol;
		upload_plan_converter.reference_symbol = reference_symbol;
		this.get_mappings_tree = get_mappings_tree;
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
	upload_plan_to_mappings_tree(upload_plan, base_table_name_extracted = false){

		if (base_table_name_extracted === false) {
			this.set_base_table_name(upload_plan['baseTableName']);

			return upload_plan_converter.upload_plan_to_mappings_tree(upload_plan['uploadable'], true);
		} else if (typeof upload_plan['uploadTable'] !== "undefined")
			return upload_plan_converter.upload_plan_to_mappings_tree(upload_plan['uploadTable'], true);

		else if (typeof upload_plan['treeRecord'] !== "undefined")
			return Object.fromEntries(Object.entries(upload_plan['treeRecord']['ranks']).map(([rank_name, rank_data]) =>
				[upload_plan_converter.tree_symbol + rank_name, {name: rank_data}]
			));

		return Object.fromEntries(Object.entries(upload_plan).reduce((results, [plan_node_name, plan_node_data]) =>
			[...results, ...Object.entries(plan_node_data).map(upload_plan_converter.upload_plan_processing_functions[plan_node_name])], []
		));

	},

	/*
	* Converts mappings tree to upload plan
	* Inverse of upload_plan_to_mappings_tree
	* @param {mixed} [mappings_tree=''] - Mappings tree that is going to be used. Else, result of get_mappings_tree() would be used
	* @return {string} Upload plan as a JSON string
	* */
	get_upload_plan(mappings_tree = ''){

		if (mappings_tree === '')
			mappings_tree = this.get_mappings_tree(true);
		const upload_plan = {};

		upload_plan['baseTableName'] = this.base_table_name();


		function handle_table(table_data, table_name, wrap_it = true){

			if (typeof upload_plan_converter.ranks[table_name] !== "undefined") {

				const final_tree = Object.fromEntries(Object.entries(table_data).map(([tree_key, tree_rank_data]) => {

					const new_tree_key = tree_key.substr(upload_plan_converter.tree_symbol.length);
					let name = Object.keys(tree_rank_data['name'])[0];

					if (typeof name === 'object')  // handle static records
						({static: name} = name);

					return [new_tree_key, name];

				}));

				return {treeRecord: {ranks: final_tree}};
			}

			let table_plan = {
				wbcols: {},
				static: {},
				toOne: {},
			};

			if (wrap_it)
				table_plan['toMany'] = {};

			let is_to_many = false;

			table_plan = Object.entries(table_data).reduce((table_plan, [field_name, field_data]) => {

				if (field_name.substr(0, upload_plan_converter.reference_symbol.length) === upload_plan_converter.reference_symbol) {
					if (!is_to_many) {
						is_to_many = true;
						table_plan = [];
					}

					table_plan.push(handle_table(field_data, table_name, false));

				} else if (field_name.substr(0, upload_plan_converter.tree_symbol.length) === upload_plan_converter.tree_symbol)
					table_plan = handle_table(table_data, table_name, false);

				else if (typeof field_data === "object" && typeof field_data['static'] === "string") {
					let value = field_data['static'];

					if (value === 'true')
						value = true;
					else if (value === 'false')
						value = false;
					else if (!isNaN(value))
						value = parseInt(value);

					table_plan['static'][field_name] = value;

				} else if (typeof upload_plan_converter.tables[table_name]['fields'][field_name] !== "undefined") {

					const field = upload_plan_converter.tables[table_name]['fields'][field_name];

					if (field['is_relationship']) {
						const mapping_table = field['table_name'];
						const is_to_one = field['type'] === 'one-to-one' || field['type'] === 'many-to-one';

						if (is_to_one && typeof table_plan['toOne'][field_name] === "undefined")
							table_plan['toOne'][field_name] = handle_table(field_data, mapping_table);

						else {
							if (typeof table_plan['toMany'] === "undefined")
								table_plan['toMany'] = {};

							if (typeof table_plan['toMany'][field_name] === "undefined")
								table_plan['toMany'][field_name] = handle_table(field_data, mapping_table);
						}

					} else
						table_plan['wbcols'][field_name] = Object.keys(field_data)[0];
				}


				return table_plan;

			}, table_plan);


			if (Array.isArray(table_plan) || !wrap_it)
				return table_plan;

			if (Object.keys(table_data).shift().substr(0, upload_plan_converter.reference_symbol.length) === upload_plan_converter.reference_symbol)
				return table_plan;

			return {uploadTable: table_plan};

		}


		upload_plan['uploadable'] = handle_table(mappings_tree, this.base_table_name());

		return JSON.stringify(upload_plan, null, "\t");

	},

};

module.exports = upload_plan_converter;