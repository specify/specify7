/*
 *
 * Various helper methods for working with trees
 *
 */

'use strict';

import type { IR, R } from './components/wbplanview';
import type {
  FullMappingPath,
  MappingPath,
  MappingType,
} from './components/wbplanviewmapper';
import type { ColumnOptions } from './uploadplantomappingstree';
import type { SplitMappingPath } from './wbplanviewhelper';
import { splitFullMappingPathComponents } from './wbplanviewhelper';

interface NestedRecord<T> extends R<T | NestedRecord<T>> {}

export type MappingsTreeNode = Record<MappingType, IR<ColumnOptions>>;

export type MappingsTree = NestedRecord<MappingsTreeNode>;

export function traverseTree(
  mappingsTree: MappingsTree,
  path: string[]
): MappingsTree | undefined {
  const step = path[0];
  if (typeof step === 'undefined') return mappingsTree;

  const next = mappingsTree[step];
  if (typeof next === 'undefined') return undefined;
  /*
   * Next could be MappingsTreeNode here, in which case we should
   * return undefined if path in not empty, but since MappingsTreeNode is a
   * record type we can't discriminate it from NestedRecord<T> at
   * runtime :(
   */
  // @ts-expect-error
  return traverseTree(next, path.slice(1));
}

type FlatTree = NestedRecord<string>;

/*
 * Merges objects recursively
 *	(by reference only, does not create a copy of the tree)
 *
 */
export const deepMergeObject = (
  // Tree that is used as a basis
  target: any,
  // Tree that is used as a source
  source: object
): IR<unknown> =>
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
   *
   */ typeof source === 'object'
    ? Object.entries(source).reduce((target, [sourceProperty, sourceValue]) => {
        if (typeof target[sourceProperty] === 'undefined')
          target[sourceProperty] = sourceValue;
        else if (typeof target === 'object')
          target[sourceProperty] = deepMergeObject(
            target[sourceProperty],
            sourceValue
          );

        return target;
      }, target)
    : target;

/* Converts an array to tree */
export function arrayToTree(
  // Array to be converted
  array: any[],
  // Whether an array has headers in it
  hasHeaders = false
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
  if (array.length === 0) return {};

  const [node, ...newArray] = array;

  if (hasHeaders && newArray.length === 0) return node;

  return { [node]: arrayToTree(newArray, hasHeaders) };
}

/*
 * Converts array of arrays of strings into a complete tree
 * The inverse of mappingsTreeToArrayOfMappings
 *
 */
export function arrayOfMappingsToMappingsTree(
  /*
   * Array of strings (branches of the tree) that are going to be merged
   * into a tree
   */
  arrayOfMappings: (MappingPath | FullMappingPath)[],
  includeHeaders: boolean
): MappingsTree {
  // Final tree
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
   *
   */
  const tree = {};

  arrayOfMappings.forEach((mappingPath) =>
    deepMergeObject(tree, arrayToTree(mappingPath, includeHeaders))
  );

  return tree;
}

/*
 * Converts mappings tree to array of mappings
 * The inverse of arrayOfMappingsToMappingsTree
 *
 */
export const mappingsTreeToArrayOfMappings = (
  mappingsTree: MappingsTree,
  // Used in a recursion to store intermediate path
  path: MappingPath = []
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
   *
   */
  Object.entries(mappingsTree).reduce(
    (result: FullMappingPath[], [treeNodeName, treeNode]) => {
      if (
        typeof treeNode === 'object' &&
        typeof Object.values(treeNode)[0] === 'object'
      )
        result.push(
          ...mappingsTreeToArrayOfMappings(treeNode as MappingsTree, [
            ...path,
            treeNodeName,
          ])
        );
      else
        result.push([
          ...(path as [...string[], MappingType]),
          treeNodeName,
          // @ts-expect-error
          treeNode as ColumnOptions,
        ]);

      return result;
    },
    []
  );

export const mappingsTreeToArrayOfSplitMappings = (
  mappingsTree: MappingsTree
): SplitMappingPath[] =>
  mappingsTreeToArrayOfMappings(mappingsTree).map(
    splitFullMappingPathComponents
  );
