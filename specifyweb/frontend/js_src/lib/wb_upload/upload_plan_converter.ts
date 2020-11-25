"use strict";

interface upload_plan {
	[key :string] :string | boolean | upload_plan,
}


/*
*
* Helper class for converting from upload plan to internal structure and vice versa
*
* */


const data_model = require('./data_model.ts');

const upload_plan_converter = {

	get_mappings_tree: (include_headers? :boolean, skip_empty? :boolean) :object => ({}),

	upload_plan_processing_functions: {
		wbcols: ([key, value] :[key :string, value :string]) => [key, {
			[
				(
					typeof data_model['headers'] === "undefined" ||
					data_model['headers'].indexOf(value) !== -1
				) ?
					'existing_header' :
					'new_column'
				]: value
		}],
		static: ([key, value] :[key :string, value :string]) => ([key, {new_static_column: value}]),
		toOne: ([key, value] :[key :string, value :object]) => [key, upload_plan_converter.upload_plan_to_mappings_tree(value, true)],
		toMany: ([key, original_mappings] :[key :string, value :object]) => {
			let i = 1;
			return [
				key,
				Object.fromEntries(Object.values(original_mappings).map(mapping =>
					[
						data_model.format_reference_item(i++),
						upload_plan_converter.upload_plan_to_mappings_tree(mapping, true)
					]
				))
			];
		},
	},

	/*
	* Converts upload plan to internal tree structure
	* Inverse of mappings_tree_to_upload_plan
	* */
	upload_plan_to_mappings_tree(
		upload_plan :upload_plan,  // upload plan
		base_table_name_extracted :boolean = false  // used by recursion to store intermediate results
	) :object /* mapping tree */ {

		if (!base_table_name_extracted) {

			if (typeof upload_plan['baseTableName'] === "undefined")
				throw "Upload plan should contain `baseTableName` as a root node";
			data_model.base_table_name = (<string>upload_plan['baseTableName']).toLowerCase();
			return upload_plan_converter.upload_plan_to_mappings_tree(<upload_plan>upload_plan['uploadable'], true);
		}
		else if (typeof upload_plan['uploadTable'] !== "undefined")
			return upload_plan_converter.upload_plan_to_mappings_tree(<upload_plan>upload_plan['uploadTable'], true);

		else if (typeof upload_plan['treeRecord'] !== "undefined")
			return Object.fromEntries(Object.entries(<upload_plan>(<upload_plan>upload_plan['treeRecord'])['ranks']).map(([rank_name, rank_data]) =>
				[
					data_model.tree_symbol + rank_name,
					Object.fromEntries(
						[
							upload_plan_converter.upload_plan_processing_functions.wbcols(
								['name', rank_name]
							)
						]
					)
				]
			));

		return Object.fromEntries(Object.entries(upload_plan).reduce((results, [plan_node_name, plan_node_data]) =>
				[...results, ...Object.entries(plan_node_data).map(upload_plan_converter.upload_plan_processing_functions[plan_node_name])],
			[]
		));

	},

	/* Get upload plan */
	get_upload_plan: () :string /* Upload plan as a JSON string */ =>
		upload_plan_converter.mappings_tree_to_upload_plan(
			upload_plan_converter.get_mappings_tree(true)
		),

	/*
	* Converts mappings tree to upload plan
	* Inverse of upload_plan_to_mappings_tree
	* */
	mappings_tree_to_upload_plan(
		mappings_tree :object  // mappings tree that is going to be used
	) :string /* Upload plan as a JSON string */ {

		const upload_plan = {
			baseTableName: data_model.base_table_name
		};

		function handle_header(data :string | object) {

			if (typeof data === "string")
				return data;

			return Object.values(data)[0];

		}


		function handle_table(table_data :object, table_name :string, wrap_it = true) {

			if (typeof data_model.ranks[table_name] !== "undefined") {

				const final_tree = Object.fromEntries(Object.entries(table_data).map(([tree_key, tree_rank_data]) => {

					const new_tree_key = data_model.get_name_from_tree_rank_name(tree_key);
					let name = tree_rank_data['name'];
					return [new_tree_key, handle_header(name)];

				}));

				return {treeRecord: {ranks: final_tree}};
			}

			let table_plan :{wbcols :object, static :object, toOne :object, toMany? :object} = {
				wbcols: {},
				static: {},
				toOne: {},
			};

			if (wrap_it)
				table_plan['toMany'] = {};

			let is_to_many = false;

			table_plan = Object.entries(table_data).reduce((table_plan, [field_name, field_data]) => {

				if (data_model.value_is_reference_item(field_name)) {
					if (!is_to_many) {
						is_to_many = true;
						table_plan = [];
					}

					table_plan.push(handle_table(field_data, table_name, false));

				}
				else if (data_model.value_is_tree_rank(field_name))
					table_plan = handle_table(table_data, table_name, false);

				else if (typeof data_model.tables[table_name]['fields'][field_name] !== "undefined") {

					const field = data_model.tables[table_name]['fields'][field_name];

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

					}
					else
						table_plan[
							Object.entries(field_data)[0][0] === 'new_static_column' ?
								'static' :
								'wbcols'
							][field_name] = handle_header(field_data);
				}


				return table_plan;

			}, table_plan);


			if (Array.isArray(table_plan) || !wrap_it)
				return table_plan;

			if (data_model.value_is_reference_item(Object.keys(table_data).shift()))
				return table_plan;

			return {uploadTable: table_plan};

		}


		upload_plan['uploadable'] = handle_table(mappings_tree, data_model.base_table_name);

		return JSON.stringify(upload_plan, null, "\t");

	},

};

module.exports = upload_plan_converter;