/*
*
* Various helper methods for working with trees
*
* */

'use strict';


import {
  FullMappingPath,
  MappingPath,
  MappingType,
  ColumnOptions,
} from './components/wbplanviewmapper';

interface NestedRecord<T> extends Record<string, T | NestedRecord<T>> { }

export type MappingsTreeNode = Record<MappingType, Record<string, ColumnOptions>>

export type MappingsTree = NestedRecord<MappingsTreeNode>

export function traverse_tree(mappingsTree: MappingsTree, path: string[]): MappingsTree | undefined {
    const step = path[0];
    if (step == null) return mappingsTree;

    const next = mappingsTree[step];
    if (next == null) return undefined;
    // next could be MappingsTreeNode here, in which case we should
    // return undefined if path in not empty, but since MappingsTreeNode is a
    // record type we can't discriminate it from NestedRecord<T> at
    // runtime :(
    return traverse_tree(next as MappingsTree, path.slice(1));
}

type FlatTree = NestedRecord<string>

/* Merges objects recursively
*	(by reference only, does not create a copy of the tree)
* */
export const deep_merge_object = (
  target: any,  // tree that is used as a basis
  source: object,  // tree that is used as a source
): Record<string, unknown> => /*
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
* */ typeof source === 'object' ?
  Object.entries(source).reduce((target, [source_property, source_value]) => {

    if (typeof target[source_property] === 'undefined')
      target[source_property] = source_value;
    else if (typeof target === 'object')
      target[source_property] = deep_merge_object(
        target[source_property],
        source_value,
      );

    return target;

  }, target) :
  target;

/* Converts an array to tree */
export function array_to_tree(
  array: any[],  // array to be converted
  has_headers = false,  // whether an array has headers in it
): FlatTree /*
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
* 		array is [
* 			'accession', 'accession agents', '#1, 'agent', 'first name',
* 			'existing_header', 'Agent 1 First Name'
* 		]
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

  const [node, ...new_array] = array;

  if (has_headers && new_array.length === 0)
    return node;

  return {[node]: array_to_tree(new_array, has_headers)};

}

/*
* Converts array of arrays of strings into a complete tree
* The inverse of mappings_tree_to_array_of_mappings
* */
export function array_of_mappings_to_mappings_tree(
  // array of strings (branches of the tree) that are going to be merged
  // into a tree
  array_of_mappings: (MappingPath|FullMappingPath)[],
  include_headers: boolean,
): MappingsTree  // Final tree
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
    deep_merge_object(tree, array_to_tree(mapping_path, include_headers)),
  );

  return tree;

}


/*
* Converts mappings tree to array of mappings
* The inverse of array_of_mappings_to_mappings_tree
* */
export const mappings_tree_to_array_of_mappings = (
  mappings_tree: MappingsTree,  // mappings tree
  path: MappingPath = [],  // used in a recursion to store intermediate path
): FullMappingPath[] =>
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
  Object.entries(
    mappings_tree,
  ).reduce((result: FullMappingPath[], [tree_node_name, tree_node]) => {

    if (
      typeof tree_node === 'object' &&
      typeof Object.values(tree_node)[0] === 'object'
    )
      result.push(
        ...mappings_tree_to_array_of_mappings(
          tree_node as MappingsTree,
          [...path, tree_node_name],
        ),
      );
    else
      result.push([
        ...(path as [...string[], MappingType]),
        tree_node_name,
        tree_node as unknown as ColumnOptions
      ]);

    return result;

  }, []);
