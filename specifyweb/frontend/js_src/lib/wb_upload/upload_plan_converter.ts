/*
*
* Helper class for converting from upload plan to internal structure and vice versa
*
* */

const data_model_storage = require('./data_model_storage.ts');
const data_model_helper = require('./data_model_helper.ts');

class upload_plan_converter {

	public static get_mappings_tree :(include_headers? :boolean, skip_empty? :boolean) => mappings_tree;

	private static readonly upload_plan_processing_functions = {
		wbcols: ([key, value] :[key :string, value :string]) => [key, {
			[
				data_model_storage.headers.indexOf(value) !== -1 ?
					'existing_header' :
					'new_column'
				]: value
		}],
		static: ([key, value] :[key :string, value :string]) => ([key, {new_static_column: value}]),
		toOne: ([key, value] :[key :string, value :upload_plan]) => [key, upload_plan_converter.upload_plan_to_mappings_tree(value, true)],
		toMany: ([key, original_mappings] :[key :string, value :object]) => {
			let i = 1;
			return [
				key,
				Object.fromEntries(Object.values(original_mappings).map(mapping =>
					[
						data_model_helper.format_reference_item(i++),
						upload_plan_converter.upload_plan_to_mappings_tree(mapping, true)
					]
				))
			];
		},
	};

	/*
	* Converts upload plan to internal tree structure
	* Inverse of mappings_tree_to_upload_plan
	* */
	public static upload_plan_to_mappings_tree(
		upload_plan :upload_plan | upload_plan_node,  // upload plan
		base_table_name_extracted :boolean = false  // used by recursion to store intermediate results
	) :mappings_tree {

		if (!base_table_name_extracted) {

			if (typeof upload_plan.baseTableName === "undefined")
				throw new Error("Upload plan should contain `baseTableName` as a root node");
			data_model_storage.base_table_name = (upload_plan.baseTableName as string).toLowerCase();
			return upload_plan_converter.upload_plan_to_mappings_tree(<upload_plan_node>upload_plan.uploadable, true);
		}
		else if (typeof (upload_plan as upload_plan_node).uploadTable !== "undefined")
			return upload_plan_converter.upload_plan_to_mappings_tree((upload_plan as upload_plan_node).uploadTable as upload_plan_node, true);

		// TODO: make this function recognize multiple tree rank fields, once upload plan supports that
		else if (typeof upload_plan.treeRecord !== "undefined")
			//@ts-ignore
			return Object.fromEntries(Object.entries((upload_plan.treeRecord as upload_plan).ranks as upload_plan).map(([rank_name, rank_data]) =>
				[
					data_model_storage.tree_symbol + rank_name,
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
				//@ts-ignore
				[
					...results,
					...Object.entries(plan_node_data).map(
						//@ts-ignore
						upload_plan_converter.upload_plan_processing_functions[plan_node_name]
					)
				],
			[]
		));

	};

	/* Get upload plan */
	public static readonly get_upload_plan = () :string /* Upload plan as a JSON string */ =>
		upload_plan_converter.mappings_tree_to_upload_plan(
			upload_plan_converter.get_mappings_tree(true)
		);

	/*
	* Converts mappings tree to upload plan
	* Inverse of upload_plan_to_mappings_tree
	* */
	public static mappings_tree_to_upload_plan(
		mappings_tree :object  // mappings tree that is going to be used
	) :string /* Upload plan as a JSON string */ {

		function handle_header(data :string | object) {

			if (typeof data === "string")
				return data;

			return Object.values(data)[0];

		}


		function handle_table(table_data :object, table_name :string, wrap_it = true) {

			if (typeof data_model_storage.ranks[table_name] !== "undefined") {

				const final_tree = Object.fromEntries(Object.entries(table_data).map(([tree_key, tree_rank_data]) => {

					const new_tree_key = data_model_helper.get_name_from_tree_rank_name(tree_key);
					let name = tree_rank_data.name;
					return [new_tree_key, handle_header(name)];

				}));

				return {treeRecord: {ranks: final_tree}};
			}

			let table_plan :{wbcols :upload_plan_node, static :upload_plan_node, toOne :upload_plan_node, toMany? :upload_plan_node} = {
				wbcols: {},
				static: {},
				toOne: {},
			};

			if (wrap_it)
				table_plan.toMany = {};

			let is_to_many = false;

			table_plan = Object.entries(table_data).reduce((table_plan, [field_name, field_data]) => {

				if (data_model_helper.value_is_reference_item(field_name)) {
					if (!is_to_many) {
						is_to_many = true;
						//@ts-ignore
						table_plan = [];
					}

					//@ts-ignore
					table_plan.push(handle_table(field_data, table_name, false));

				}
				else if (data_model_helper.value_is_tree_rank(field_name))
					//@ts-ignore
					table_plan = handle_table(table_data, table_name, false);

				else if (
					typeof data_model_storage.tables[table_name].fields[field_name] !== "undefined" &&
					typeof table_plan !== "undefined"
				) {

					const field = data_model_storage.tables[table_name].fields[field_name];

					if (field.is_relationship) {
						const mapping_table = field.table_name;
						const is_to_one = field.type === 'one-to-one' || field.type === 'many-to-one';

						if (is_to_one && typeof table_plan.toOne[field_name] === "undefined")  // @ts-ignore
							table_plan.toOne[field_name] = handle_table(field_data, mapping_table);

						else {
							if (typeof table_plan.toMany === "undefined")
								table_plan.toMany = {};

							if (typeof table_plan.toMany[field_name] === "undefined")  // @ts-ignore
								table_plan.toMany[field_name] = handle_table(field_data, mapping_table);
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

			if (data_model_helper.value_is_reference_item(Object.keys(table_data).shift()))
				return table_plan;

			return {uploadTable: table_plan};

		}

		return JSON.stringify({
			baseTableName: data_model_storage.base_table_name,
			uploadable: handle_table(mappings_tree, data_model_storage.base_table_name)
		}, null, "\t");

	};

}

export = upload_plan_converter;