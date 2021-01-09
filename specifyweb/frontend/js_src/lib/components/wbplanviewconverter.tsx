/*
*
* Helper class for converting from upload plan to mapping path (internal structure used in wbplanview) and vice versa
*
* */

'use strict';

import data_model_storage from './wbplanviewmodel';
import {
	format_reference_item,
	format_tree_rank,
	get_name_from_tree_rank_name, table_is_tree,
	value_is_reference_item,
	value_is_tree_rank,
} from './wbplanviewmodelhelper';


const upload_plan_processing_functions = (headers :string[]) :upload_plan_processing_functions => (
	{
		wbcols: ([key, value] :[key :string, value :string]) => [
			key,
			{
				[
					headers.indexOf(value) !== -1 ?
						'existing_header' :
						'new_column'
					]: value,
			},
		],
		static: ([key, value] :[key :string, value :string]) => [
			key, {new_static_column: value},
		],
		toOne: ([key, value] :[key :string, value :upload_plan_uploadTable_toOne]) => [key, handle_uploadable(value, headers)],
		toMany: ([key, original_mappings] :[key :string, value :object]) => [
			key,
			Object.fromEntries(Object.values(original_mappings).map((mapping,index) =>
				[
					format_reference_item(index+1),
					handle_upload_table(mapping, headers),
				],
			)),
		],
	}
);

// TODO: make this function recognize multiple tree rank fields, once upload plan supports that
const handle_tree_record = (upload_plan :upload_plan_treeRecord, headers :string[]) =>
	Object.fromEntries(
		Object.entries((
			(
				upload_plan
			).ranks
		)).map(([rank_name /*rank_data*/]) =>
			[
				format_tree_rank(rank_name),
				Object.fromEntries(
					[
						upload_plan_processing_functions(headers).wbcols(
							['name', rank_name],
						),
					],
				),
			],
		),
	);


const handle_upload_table_table = (upload_plan :upload_plan_uploadTable_table, headers :string[]) =>
	Object.fromEntries(Object.entries(upload_plan).reduce(
		// @ts-ignore
		(results, [plan_node_name, plan_node_data] :[upload_plan_field_group_types, upload_plan_uploadTable_table_group<upload_plan_field_group_types>]) =>
			[
				...results,
				...Object.entries(plan_node_data).map(
					upload_plan_processing_functions(headers)[plan_node_name],
				),
			],
		[],
	));

const handle_upload_table = (upload_plan :upload_plan_uploadTable, headers :string[]) => {
	const [[table_name, table_data]] = Object.entries(upload_plan);
	return {
		[table_name]: handle_upload_table_table(table_data, headers),
	};
};

const handle_uploadable = (upload_plan :upload_plan_uploadable, headers :string[]) :mappings_tree =>
	'treeRecord' in upload_plan ?
		handle_tree_record(upload_plan.treeRecord, headers) :
		handle_upload_table_table(upload_plan.uploadTable, headers);

/*
* Converts upload plan to mappings tree
* Inverse of mappings_tree_to_upload_plan
* */
export function upload_plan_to_mappings_tree(
	headers :string[],
	upload_plan :upload_plan_structure,  // upload plan
) :upload_plan_to_mappings_tree {

	if (typeof upload_plan.baseTableName === 'undefined')
		throw new Error('Upload plan should contain `baseTableName` as a root node');

	return {
		base_table_name: upload_plan.baseTableName,
		mappings_tree: handle_uploadable(upload_plan.uploadable, headers),
	};
}


//TODO: make these functions type safe
const handle_header = (data :object) =>
	Object.keys(Object.values(data)[0])[0];

function mappings_tree_to_upload_plan_table(table_data :object, table_name :string, wrap_it = true) {

	if (table_is_tree(table_name)) {

		const final_tree = Object.fromEntries(Object.entries(table_data).map(([tree_key, tree_rank_data]) => {

			const new_tree_key = get_name_from_tree_rank_name(tree_key);
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

		if (value_is_reference_item(field_name)) {
			if (!is_to_many) {
				is_to_many = true;
				//@ts-ignore
				table_plan = [];
			}

			//@ts-ignore
			table_plan.push(mappings_tree_to_upload_plan_table(field_data, table_name, false));

		}
		else if (value_is_tree_rank(field_name))
			//@ts-ignore
			table_plan = mappings_tree_to_upload_plan_table(table_data, table_name, false);

		else if (
			typeof data_model_storage.tables[table_name].fields[field_name] !== 'undefined' &&
			typeof table_plan !== 'undefined'
		) {

			const field = data_model_storage.tables[table_name].fields[field_name];

			if (field.is_relationship) {
				const mapping_table = field.table_name;
				const is_to_one = field.type === 'one-to-one' || field.type === 'many-to-one';

				if (is_to_one && typeof table_plan.toOne[field_name] === 'undefined')  // @ts-ignore
					table_plan.toOne[field_name] = mappings_tree_to_upload_plan_table(field_data, mapping_table);

				else {
					if (typeof table_plan.toMany === 'undefined')
						table_plan.toMany = {};

					if (typeof table_plan.toMany[field_name] === 'undefined')  // @ts-ignore
						table_plan.toMany[field_name] = mappings_tree_to_upload_plan_table(field_data, mapping_table);
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

	if (value_is_reference_item(Object.keys(table_data)[0]))
		return table_plan;

	return {uploadTable: table_plan};

}

/*
* Converts mappings tree to upload plan
* Inverse of upload_plan_to_mappings_tree
* */
export const mappings_tree_to_upload_plan = (
	base_table_name :string,
	mappings_tree :object,  // mappings tree that is going to be used
) :string /* Upload plan as a JSON string */ =>
	JSON.stringify({
		baseTableName: base_table_name,
		uploadable: mappings_tree_to_upload_plan_table(mappings_tree, base_table_name),
	}, null, '\t');