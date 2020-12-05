/*
*
* Various helper methods for working with trees
*
* */

const tree_helpers = {

	/* Returns cross-section of full_mappings_tree and node_mappings_tree */

	traverse_tree(
		full_mappings_tree :mapping_tree,  // full tree with various branches
		node_mappings_tree :mapping_tree | string  // a tree several levels deep with only a single branch
	) :string | mapping_tree | undefined | false  // a cross-section of two trees
	/*
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
	* 			#2
	* This function will return the following object:
	* 	Agent
	* 		Agent Type
	* 		Agent Name
	* 	Remarks
	* */ {

		if (typeof node_mappings_tree === "undefined")
			return full_mappings_tree;

		let target_key = '';
		if (typeof node_mappings_tree === "string")
			return full_mappings_tree[target_key];
		else {
			target_key = <string>Object.keys(node_mappings_tree).shift();

			if (target_key === '')
				return full_mappings_tree;
		}

		if (typeof full_mappings_tree[target_key] !== "object")
			return false;

		return tree_helpers.traverse_tree(<mapping_tree>full_mappings_tree[target_key], node_mappings_tree[target_key]);

	},

	/* Merges objects recursively (by reference only, does not create a copy of the tree) */
	deep_merge_object: (
		target :any,  // tree that is used as a basis
		source :object  // tree that is used as a source
	) :object /* Merged tree */ =>
		/*
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
		typeof source === "object" ?
			Object.entries(source).reduce((target, [source_property, source_value]) => {

				if (typeof target[source_property] === "undefined")
					target[source_property] = source_value;
				else if (typeof target === "object")
					target[source_property] = tree_helpers.deep_merge_object(target[source_property], source_value);

				return target;

			}, target) :
			target,

	/* Converts an array to tree */
	array_to_tree(
		array :any[],  // array to be converted
		has_headers :boolean = false  // whether an array has headers in it
	) :object  // resulting tree
	/*
	* Example:
	* 	if
	* 		array is ['accession', 'accession agents', '#1, 'agent', 'first name']
	* 		has_headers is False
	* 	then result is {
	* 		'accession': {
	* 			'accession_agents': {
	* 				'#1': {
	* 					'agent': {
	* 						'first_name': {
	*
	* 						},
	* 					}
	* 				}
	* 			}
	* 		}
	* 	}
	*
	* 	if
	* 		array is ['accession', 'accession agents', '#1, 'agent', 'first name', 'existing_header', 'Agent 1 First Name']
	* 		has_headers is True
	* 	then result is {
	* 		'accession': {
	* 			'accession_agents': {
	* 				'#1': {
	* 					'agent': {
	* 						'first_name': {
	* 							'existing_header': 'Agent 1 First Name',
	* 						},
	* 					}
	* 				}
	* 			}
	* 		}
	* 	}
	* */ {

		if (array.length === 0)
			return {};

		const node = array.shift();

		if (has_headers && array.length === 0)
			return node;

		return {[node]: tree_helpers.array_to_tree(array, has_headers)};

	},

	/*
	* Converts array of arrays of strings into a complete tree
	* The inverse of mappings_tree_to_array_of_mappings
	* */
	array_of_mappings_to_mappings_tree(
		array_of_mappings :any[],  // array of array of strings (a.k.a branches of the tree) that are going to be merged into a tree
		include_headers :boolean  // whether array_of_mappings includes mapping types and header names / static column values
	) :object  // Final tree
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

		for (const mapping_path of array_of_mappings) {
			const mapping_tree = tree_helpers.array_to_tree(mapping_path, include_headers);
			tree_helpers.deep_merge_object(tree, mapping_tree);
		}

		return tree;

	},


	/*
	* Converts mappings tree to array of mappings
	* The inverse of array_of_mappings_to_mappings_tree
	* */
	mappings_tree_to_array_of_mappings: (
		mappings_tree :mapping_tree,  // mappings tree
		path :any[] = []  // used in recursion to store intermediate path
	) :string[][] /* array of arrays of string */ =>
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
		Object.entries(mappings_tree).reduce((result :string[][], [tree_node_name, tree_node]) => {

			if (typeof tree_node !== "object")
				result.push([...path, tree_node_name, tree_node]);
			else
				result.push(
					...tree_helpers.mappings_tree_to_array_of_mappings(
						tree_node,
						[...path, tree_node_name]
					)
				);

			return result;

		}, []),


};

export = tree_helpers;