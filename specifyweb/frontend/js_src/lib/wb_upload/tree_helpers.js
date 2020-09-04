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
	constructor: (raw_headers) => {
		tree_helpers.raw_headers = raw_headers;
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
	traverse_tree: (full_mappings_tree, node_mappings_tree) => {

		if (typeof node_mappings_tree === "undefined")
			return full_mappings_tree;

		let target_key = '';
		if (typeof node_mappings_tree === "string")
			target_key = node_mappings_tree;
		else {
			const target_keys = Object.keys(node_mappings_tree);

			if (target_keys.length === 0)
				return full_mappings_tree;

			target_key = target_keys[0];
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
	deep_merge_object: (target, source) => {

		Object.keys(source).forEach((source_property) => {
			if (typeof target[source_property] === "undefined")
				target[source_property] = source[source_property];
			else
				target[source_property] = tree_helpers.deep_merge_object(target[source_property], source[source_property]);
		});

		return target;

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
	array_to_tree: (array, tree = {}) => {

		if (array.length === 0)
			return false;
		const node = array.shift();
		const data = tree_helpers.array_to_tree(array);

		if (data === false)
			return node;

		tree[node] = data;
		return tree;

	},


	/*
	* Converts mappings tree to array of mappings
	* The inverse of array_to_tree
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
	mappings_tree_to_array_of_mappings: (mappings_tree, result = [], path = []) => {
		Object.keys(mappings_tree).forEach((tree_node_name) => {
			const tree_node = mappings_tree[tree_node_name];
			const local_path = path.slice();
			local_path.push(tree_node_name);
			if (typeof tree_node !== 'object') {

				let mapping_type;

				if (tree_helpers.raw_headers.indexOf(tree_node) !== -1)
					mapping_type = 'existing_header';
				else if (tree_node_name === 'static') {
					mapping_type = 'new_static_header';
					local_path.pop();
				} else
					mapping_type = 'new_header';

				result.push([mapping_type, tree_node, local_path]);
			} else
				tree_helpers.mappings_tree_to_array_of_mappings(tree_node, result, local_path);
		});

		return result;
	},


};

module.exports = tree_helpers;