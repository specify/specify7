"use strict";

/*
*
* Various helper methods for working with trees
*
* */


const tree_helpers = {

	/*
	* Constructor that get's necessary variables from `mappings`
	* @param {array} raw_headers - array of headers
	* */
	constructor(raw_headers){
		this.raw_headers = raw_headers;
	},

	/*
	* Returns cross-section of full_mappings_tree and node_mappings_tree
	* @param {object} full_mappings_tree - Full tree with various branches
	* @param {object} node_mappings_tree - A tree several levels deep with only a single branch
	* @return {object} Returns a cross-section of two trees
	* Example:
	* if full_mappings_tree is like this:
	* 	Accession
	* 		Accession Agents
	* 			#1
	* 				Agent
	* 					Agent Name
	* 			#2
	* 				Agent
	* 					Agent Type
	* 					Agent Name
	* 				Remarks
	* And node_mappings_tree is like this:
	* 	Accession
	* 		Accession Agents
	* 			#1
	* This function will return the following object:
	* 	Agent
	* 		Agent Type
	* 		Agent Name
	* 	Remarks
	* */
	traverse_tree(full_mappings_tree, node_mappings_tree){

		if (typeof node_mappings_tree === "undefined")
			return full_mappings_tree;

		let target_key = '';
		if (typeof node_mappings_tree === "string")
			target_key = node_mappings_tree;
		else {
			target_key = Object.keys(node_mappings_tree).shift();

			if (typeof target_key === "undefined")
				return full_mappings_tree;
		}

		if (typeof full_mappings_tree[target_key] === "undefined")
			return false;

		return tree_helpers.traverse_tree(full_mappings_tree[target_key], node_mappings_tree[target_key]);

	},

	/*
	* Merges objects recursively (by reference only, does not create a copy of the tree)
	* @param {object} target - Tree that is used as a basis
	* @param {object} source - Tree that is used as a source
	* @return {object} Merged tree
	* For example, if target is:
	* 	Accession
	* 		Accession Agents
	* 			#1
	* 				Agent
	* 				Remarks
	* And source is:
	* 	Accession
	* 		Accession Agents
	* 			#2
	* 				Agent
	* Resulting tree is:
	* 	Accession
	* 		Accession Agents
	* 			#1
	* 				Agent
	* 					Remarks
	* 			#2
	* 				Agent
	* */
	deep_merge_object(target, source){
		return Object.entries(source).reduce((target, [source_property, source_value]) => {

			if (typeof target[source_property] === "undefined")
				target[source_property] = source_value;
			else
				target[source_property] = tree_helpers.deep_merge_object(target[source_property], source_value);

			return target;

		}, target);
	},

	array_to_tree(array, has_headers = false, tree = {}){

		if (array.length === 0)
			return {};

		const node = array.shift();

		if (has_headers && array.length === 0)
			return node;

		tree[node] = tree_helpers.array_to_tree(array, has_headers);

		return tree;

	},

	/*
	* Converts array of arrays of strings into a complete tree
	* The inverse of mappings_tree_to_array_of_mappings
	* @param {array} array - Array of array of strings (a.k.a branches of the tree) that are going to be merged into a tree
	* @param {object} [tree={}] - Used only to save intermediate result in the recursion
	* @return {object} Final tree
	* For example if array is:
	* 	Accession, Accession Agents, #1, Agent, First Name
	* 	Accession, Accession Agents, #1, Agent, Last Name
	* 	Accession, Accession Agents, #1, Remarks
	* Resulting tree would be:
	* 	Accession
	* 		Accession Agents
	* 			#1
	* 				Agent
	* 					First Name
	* 					Last Name
	* 				Remarks
	* */
	array_of_mappings_to_mappings_tree(array_of_mappings, include_headers){

		const tree = {};

		for (const mapping_path of array_of_mappings) {
			const mapping_tree = tree_helpers.array_to_tree(mapping_path, include_headers);
			tree_helpers.deep_merge_object(tree, mapping_tree);
		}

		return tree;

	},


	/*
	* Converts mappings tree to array of mappings
	* The inverse of array_of_mappings_to_mappings_tree
	* @param {object} mappings_tree - Mappings tree
	* @param {array} result - Used in recursion to store intermediate results
	* @param {array} path - Used in recursion to store intermediate path
	* @return {array} Returns array of arrays of string
	* For example, if mappings_tree is:
	* 	Accession
	* 		Accession Agents
	* 			#1
	* 				Agent
	* 					First Name
	* 					Last Name
	* 				Remarks
	* Result would be:
	* 	Accession, Accession Agents, #1, Agent, First Name
	* 	Accession, Accession Agents, #1, Agent, Last Name
	* 	Accession, Accession Agents, #1, Remarks
	* */
	new_mappings_tree_to_array_of_mappings: (mappings_tree, path = []) =>
		Object.entries(mappings_tree).reduce((result, [tree_node_name, tree_node])=>{

			if(typeof tree_node !== "object")
				result.push([...path, tree_node_name, tree_node]);
			else
				result.push(
					...tree_helpers.new_mappings_tree_to_array_of_mappings(
						mappings_tree[tree_node_name],
						[...path, tree_node_name]
					)
				);

			return result;

		}, []),

	mappings_tree_to_array_of_mappings(mappings_tree, result = [], path = []){

		return Object.entries(mappings_tree).reduce((result, [tree_node_name, tree_node]) => {

			const local_path = path.slice();
			local_path.push(tree_node_name);

			if (typeof tree_node !== 'object') {

				let mapping_type;

				if (this.raw_headers.indexOf(tree_node) !== -1)
					mapping_type = 'existing_header';
				else if (tree_node_name === 'static') {
					mapping_type = 'new_static_column';
					local_path.pop();
				} else
					mapping_type = 'new_column';

				result.push({
					mapping_path: local_path,
					header_data: {
						mapping_type: mapping_type,
						header_name: tree_node,
					}
				});

			} else
				tree_helpers.mappings_tree_to_array_of_mappings(tree_node, result, local_path);

			return result;

		}, result);

	},


};

module.exports = tree_helpers;