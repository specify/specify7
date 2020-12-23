/*
*
* Various helper methods for working with trees
*
* */

class tree_helpers {

	/* Returns cross-section of full_mappings_tree and node_mappings_tree */
	public static traverse_tree(
		full_mappings_tree :mappings_tree,  // full tree with various branches
		node_mappings_tree :mappings_tree | string  // a tree several levels deep with only a single branch
	) :traversed_tree {

		if (typeof node_mappings_tree === "undefined")
			return full_mappings_tree;

		let target_key = '';
		if (typeof node_mappings_tree === "string")
			return full_mappings_tree[target_key];
		else {
			target_key = Object.keys(node_mappings_tree).shift() as string;

			if (typeof target_key === "undefined" || target_key === '')
				return full_mappings_tree;
		}

		if (typeof full_mappings_tree[target_key] !== "object")
			return false;

		return tree_helpers.traverse_tree(<mappings_tree>full_mappings_tree[target_key], node_mappings_tree[target_key]);

	};

	/* Merges objects recursively (by reference only, does not create a copy of the tree) */
	public static readonly deep_merge_object = (
		target :any,  // tree that is used as a basis
		source :object  // tree that is used as a source
	) :merged_tree =>
		typeof source === "object" ?
			Object.entries(source).reduce((target, [source_property, source_value]) => {

				if (typeof target[source_property] === "undefined")
					target[source_property] = source_value;
				else if (typeof target === "object")
					target[source_property] = tree_helpers.deep_merge_object(target[source_property], source_value);

				return target;

			}, target) :
			target;

	/* Converts an array to tree */
	public static array_to_tree(
		array :any[],  // array to be converted
		has_headers :boolean = false  // whether an array has headers in it
	) :flat_tree {

		if (array.length === 0)
			return {};

		const node = array.shift();

		if (has_headers && array.length === 0)
			return node;

		return {[node]: tree_helpers.array_to_tree(array, has_headers)};

	};

	/*
	* Converts array of arrays of strings into a complete tree
	* The inverse of mappings_tree_to_array_of_mappings
	* */
	public static array_of_mappings_to_mappings_tree(
		array_of_mappings :mapping_path[],  // array of array of strings (a.k.a branches of the tree) that are going to be merged into a tree
		include_headers :boolean  // whether array_of_mappings includes mapping types and header names / static column values
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
			tree_helpers.deep_merge_object(tree, tree_helpers.array_to_tree(mapping_path, include_headers))
		);

		return tree;

	};


	/*
	* Converts mappings tree to array of mappings
	* The inverse of array_of_mappings_to_mappings_tree
	* */
	public static readonly mappings_tree_to_array_of_mappings = (
		mappings_tree :mappings_tree,  // mappings tree
		path :mapping_path = []  // used in recursion to store intermediate path
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

		}, []);


}

export = tree_helpers;