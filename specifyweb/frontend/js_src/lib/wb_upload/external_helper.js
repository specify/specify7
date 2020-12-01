"use strict";

/*
*
* Various helper methods that are called from outside of wbplanview
*
* */


const upload_plan_converter = require('./upload_plan_converter.js');
const tree_helpers = require('./tree_helpers.js');
const helper = require('./helper.js');
const data_model = require('./data_model.js');

const external_helper = {

	/*
	* Get set of column names that map to locality table
	* @return {array} list of objects of type {locality_name,latitude,longitude}
	* */
	find_locality_columns(
		/* string */ upload_plan  // upload plan as a string
	){

		let upload_plan_object;
		try {
			upload_plan_object = JSON.parse(upload_plan);
		} catch(e){
			return [];
		}

		if(!upload_plan_object)
			return [];


		const mappings_tree = upload_plan_converter.upload_plan_to_mappings_tree(upload_plan_object)
		const array_of_mappings = tree_helpers.mappings_tree_to_array_of_mappings(mappings_tree).map((combined_mappings_path)=>
			helper.deconstruct_mapping_path(combined_mappings_path, true)
		).filter(([_,mapping_type,__])=>  // TODO: add support for static fields
			mapping_type !== 'new_static_column'
		);
		const target_locality_fields = ['localityname','latitude1','longitude1','latitude2','longitude2','latlongtype', 'latlongaccuracy'];
		const filtered_array_of_mappings = array_of_mappings.reduce((result,[mapping_path,_,header_name])=>{

			if(target_locality_fields.indexOf(mapping_path[mapping_path.length-1])!==-1)
				result.push([mapping_path, header_name]);

			return result;

		},[]);

		const locality_objects = {};

		for(const [mapping_path,header_name] of filtered_array_of_mappings){

			const [base_mappings_path, column_name] = [mapping_path.slice(0,-1), mapping_path.slice(-1)];
			const base_mappings_path_string = base_mappings_path.join(data_model.path_join_symbol);

			if(typeof locality_objects[base_mappings_path_string] === "undefined")
				locality_objects[base_mappings_path_string] = {};

			locality_objects[base_mappings_path_string][column_name] = header_name;

		}


		//finding geography tree mappings
		const geography_mapping_paths_to_search_for = [];
		const geography_ranks_to_search_for = ['country', 'state', 'county'];
		Object.keys(locality_objects).map(base_mappings_path_string=>{

			const base_mapping_path =
				base_mappings_path_string === '' ?
					[]:
					base_mappings_path_string.split(data_model.path_join_symbol);

			const possible_geography_mapping_path = [...base_mapping_path, 'geography'];

			geography_ranks_to_search_for.map(rank_name=>{
				geography_mapping_paths_to_search_for.push([
					base_mappings_path_string,
					rank_name,
					[
						...possible_geography_mapping_path,
						data_model.format_tree_rank(rank_name),
						'name'
					].join(data_model.path_join_symbol)
				]);
			});

		});

		array_of_mappings.map(([mapping_path,_,header_name])=>
			geography_mapping_paths_to_search_for.some(([base_mappings_path_string, rank_name, search_mapping_path])=>{
				if(mapping_path.join(data_model.path_join_symbol) === search_mapping_path){
					locality_objects[base_mappings_path_string][rank_name] = header_name;
					return true;
				}
			})
		);

		return Object.values(locality_objects);

	},

};

module.exports = external_helper;