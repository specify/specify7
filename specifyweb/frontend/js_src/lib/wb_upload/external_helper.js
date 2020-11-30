"use strict";

/*
*
* Various helper methods that are called from outside of wbplanview
*
* */


const upload_plan_converter = require('./upload_plan_converter.js');
const tree_helpers = require('./tree_helpers.js');
const helper = require('./helper.js');

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
		);
		const target_locality_fields = ['localityname','latitude1','longitude1','latlongtype', 'latlongaccuracy'];
		const filtered_array_of_mappings = array_of_mappings.reduce((result,[mapping_path,mapping_type,header_name])=>{

			if(
				mapping_type !== 'new_static_column' &&  // TODO: add support for static fields
				target_locality_fields.indexOf(mapping_path[mapping_path.length-1])!==-1
			)
				result.push([mapping_path, header_name]);

			return result;

		},[]);

		const locality_objects = {};

		for(const [mapping_path,header_name] of filtered_array_of_mappings){

			const [base_mappings_path, column_name] = [mapping_path.slice(0,-1), mapping_path.slice(-1)];
			const base_mappings_path_string = base_mappings_path.join('_');

			if(typeof locality_objects[base_mappings_path_string] === "undefined")
				locality_objects[base_mappings_path_string] = {};

			locality_objects[base_mappings_path_string][column_name] = header_name;

		}

		return Object.values(locality_objects);

	},

};

module.exports = external_helper;