/*
 *
 * Various helper methods for working with trees
 *
 */

import type { IR, R, RA } from './types';
import type {
  FullMappingPath,
  MappingPath,
  MappingType,
} from './components/wbplanviewmapper';
import type { ColumnOptions } from './uploadplantomappingstree';
import type { SplitMappingPath } from './wbplanviewmappinghelper';
import { splitFullMappingPathComponents } from './wbplanviewmappinghelper';

interface NestedRecord<T> extends R<T | NestedRecord<T>> {}

export type MappingsTreeNode = Record<MappingType, IR<ColumnOptions>>;

export type MappingsTree = NestedRecord<MappingsTreeNode>;

export function traverseTree(
  mappingsTree: MappingsTree,
  path: RA<string>
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
 */
export const deepMergeObject = (base: any, merge: object): IR<unknown> =>
  typeof merge === 'object'
    ? Object.entries(merge).reduce((base, [sourceProperty, sourceValue]) => {
        if (typeof base[sourceProperty] === 'undefined')
          base[sourceProperty] = sourceValue;
        else if (typeof base === 'object')
          base[sourceProperty] = deepMergeObject(
            base[sourceProperty],
            sourceValue
          );

        return base;
      }, base)
    : base;

/*
 * Converts array to tree
 *
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
 */
export function arrayToTree(
  // Array to be converted
  array: RA<any>,
  // Whether an array has headers in it
  hasHeaders = false
): FlatTree {
  if (array.length === 0) return {};

  const [node, ...newArray] = array;

  if (hasHeaders && newArray.length === 0) return node;

  return { [node]: arrayToTree(newArray, hasHeaders) };
}

/*
 * Converts array of arrays of strings into a complete tree
 * The inverse of mappingsTreeToMappingPaths
 */
export function mappingPathsToMappingsTree(
  /*
   * Array of strings (branches of the tree) that are going to be merged
   * into a tree
   */
  mappingPaths: RA<MappingPath | FullMappingPath>,
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

  mappingPaths.forEach((mappingPath) =>
    deepMergeObject(tree, arrayToTree(mappingPath, includeHeaders))
  );

  return tree;
}

/*
 * Converts mappings tree to array of mappings
 * The inverse of mappingPathsToMappingsTree
 */
const mappingsTreeToMappingPaths = (
  mappingsTree: MappingsTree,
  // Used in a recursion to store intermediate path
  path: MappingPath = []
): RA<FullMappingPath> =>
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
  Object.entries(mappingsTree).reduce<FullMappingPath[]>(
    (result, [treeNodeName, treeNode]) => {
      if (
        typeof treeNode === 'object' &&
        typeof Object.values(treeNode)[0] === 'object'
      )
        result.push(
          ...mappingsTreeToMappingPaths(treeNode as MappingsTree, [
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
): RA<SplitMappingPath> =>
  mappingsTreeToMappingPaths(mappingsTree).map(splitFullMappingPathComponents);
