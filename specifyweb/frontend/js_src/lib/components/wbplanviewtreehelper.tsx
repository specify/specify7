/*
*
* Various helper methods for working with trees
*
* */

'use strict';

/* Returns cross-section of full_mappings_tree and node_mappings_tree */
export function traverse_tree(
	full_mappings_tree :mappings_tree,  // full tree with various branches
	node_mappings_tree :mappings_tree | string,  // a tree several levels deep with only a single branch
) :traversed_tree {

	if (typeof node_mappings_tree === 'undefined')
		return full_mappings_tree;

	let target_key = '';
	if (typeof node_mappings_tree === 'string')
		return full_mappings_tree[target_key];
	else {
		target_key = Object.keys(node_mappings_tree)[0] as string;

		if (typeof target_key === 'undefined' || target_key === '')
			return full_mappings_tree;
	}

	if (typeof full_mappings_tree[target_key] !== 'object')
		return false;

	return traverse_tree(full_mappings_tree[target_key] as mappings_tree, node_mappings_tree[target_key]);

}

/* Merges objects recursively (by reference only, does not create a copy of the tree) */
export const deep_merge_object = (
	target :any,  // tree that is used as a basis
	source :object,  // tree that is used as a source
) :merged_tree =>
	typeof source === 'object' ?
		Object.entries(source).reduce((target, [source_property, source_value]) => {

			if (typeof target[source_property] === 'undefined')
				target[source_property] = source_value;
			else if (typeof target === 'object')
				target[source_property] = deep_merge_object(target[source_property], source_value);

			return target;

		}, target) :
		target;

/* Converts an array to tree */
export function array_to_tree(
	array :any[],  // array to be converted
	has_headers :boolean = false,  // whether an array has headers in it
) :flat_tree {

	if (array.length === 0)
		return {};

	const [node,...new_array] = array;

	if (has_headers && new_array.length === 0)
		return node;

	return {[node]: array_to_tree(new_array, has_headers)};

}

/*
* Converts array of arrays of strings into a complete tree
* The inverse of mappings_tree_to_array_of_mappings
* */
export function array_of_mappings_to_mappings_tree(
	array_of_mappings :mapping_path[],  // array of array of strings (a.k.a branches of the tree) that are going to be merged into a tree
) :mappings_tree  // Final tree
/*
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
* */ {

	const tree = {};

	array_of_mappings.forEach(mapping_path =>
		deep_merge_object(tree, array_to_tree(mapping_path, false)),
	);

	return tree;

}


/*
* Converts mappings tree to array of mappings
* The inverse of array_of_mappings_to_mappings_tree
* */
export const mappings_tree_to_array_of_mappings = (
	mappings_tree :mappings_tree,  // mappings tree
	path :mapping_path = [],  // used in recursion to store intermediate path
) :mapping_path[] /* array of arrays of string */ =>
	/*
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
	Object.entries(mappings_tree).reduce((result :mapping_path[], [tree_node_name, tree_node]) => {

		if (typeof tree_node !== 'object')
			result.push([...path, tree_node_name, tree_node]);
		else
			result.push(
				...mappings_tree_to_array_of_mappings(
					tree_node,
					[...path, tree_node_name],
				),
			);

		return result;

	}, []);