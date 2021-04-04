/*
*
* Various helper methods for working with trees
*
* */

'use strict';


import { R } from './components/wbplanview';
import {
  FullMappingPath,
  MappingPath,
  MappingType,
} from './components/wbplanviewmapper';
import { ColumnOptions } from './uploadplantomappingstree';

interface NestedRecord<T> extends R<T | NestedRecord<T>> {
}

export type MappingsTreeNode = Record<MappingType, R<ColumnOptions>>

export type MappingsTree = NestedRecord<MappingsTreeNode>

export function traverseTree(mappingsTree: MappingsTree, path: string[]): MappingsTree | undefined {
  const step = path[0];
  if (step == null) return mappingsTree;

  const next = mappingsTree[step];
  if (next == null) return undefined;
  // next could be MappingsTreeNode here, in which case we should
  // return undefined if path in not empty, but since MappingsTreeNode is a
  // record type we can't discriminate it from NestedRecord<T> at
  // runtime :(
  return traverseTree(next as MappingsTree, path.slice(1));
}

type FlatTree = NestedRecord<string>

/* Merges objects recursively
*	(by reference only, does not create a copy of the tree)
* */
export const deepMergeObject = (
  target: any,  // tree that is used as a basis
  source: object,  // tree that is used as a source
): R<unknown> => /*
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
  Object.entries(source).reduce((target, [sourceProperty, sourceValue]) => {

    if (typeof target[sourceProperty] === 'undefined')
      target[sourceProperty] = sourceValue;
    else if (typeof target === 'object')
      target[sourceProperty] = deepMergeObject(
        target[sourceProperty],
        sourceValue,
      );

    return target;

  }, target) :
  target;

/* Converts an array to tree */
export function arrayToTree(
  array: any[],  // array to be converted
  hasHeaders = false,  // whether an array has headers in it
): FlatTree /*
* Example:
* 	if
* 		array is ['accession', 'accession agents', '#1, 'agent', 'first name']
* 		hasHeaders is False
* 	then result is {
* 		'accession': {
* 			'accessionAgents': {
* 				'#1': {
* 					'agent': {
* 						'firstName': {
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
* 			'existingHeader', 'Agent 1 First Name'
* 		]
* 		hasHeaders is True
* 	then result is {
* 		'accession': {
* 			'accessionAgents': {
* 				'#1': {
* 					'agent': {
* 						'firstName': {
* 							'existingHeader': 'Agent 1 First Name',
* 						},
* 					}
* 				}
* 			}
* 		}
* 	}
* */ {

  if (array.length === 0)
    return {};

  const [node, ...newArray] = array;

  if (hasHeaders && newArray.length === 0)
    return node;

  return {[node]: arrayToTree(newArray, hasHeaders)};

}

/*
* Converts array of arrays of strings into a complete tree
* The inverse of mappingsTreeToArrayOfMappings
* */
export function arrayOfMappingsToMappingsTree(
  // array of strings (branches of the tree) that are going to be merged
  // into a tree
  arrayOfMappings: (MappingPath | FullMappingPath)[],
  includeHeaders: boolean,
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

  arrayOfMappings.forEach(mappingPath =>
    deepMergeObject(tree, arrayToTree(mappingPath, includeHeaders)),
  );

  return tree;

}


/*
* Converts mappings tree to array of mappings
* The inverse of arrayOfMappingsToMappingsTree
* */
export const mappingsTreeToArrayOfMappings = (
  mappingsTree: MappingsTree,  // mappings tree
  path: MappingPath = [],  // used in a recursion to store intermediate path
): FullMappingPath[] =>
  /*
  * For example, if mappingsTree is:
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
    mappingsTree,
  ).reduce((result: FullMappingPath[], [treeNodeName, treeNode]) => {

    if (
      typeof treeNode === 'object' &&
      typeof Object.values(treeNode)[0] === 'object'
    )
      result.push(
        ...mappingsTreeToArrayOfMappings(
          treeNode as MappingsTree,
          [...path, treeNodeName],
        ),
      );
    else
      result.push([
        ...(
          path as [...string[], MappingType]
        ),
        treeNodeName,
        treeNode as unknown as ColumnOptions,
      ]);

    return result;

  }, []);