/**
 * MappingsTree traversal, merge and convertor utilities
 *
 * @module
 */

import type {
  FullMappingPath,
  MappingPath,
  MappingType,
} from './components/wbplanviewmapper';
import type { IR, R, RA } from './types';
import type { ColumnOptions } from './uploadplantomappingstree';
import type { SplitMappingPath } from './wbplanviewmappinghelper';
import { splitFullMappingPathComponents } from './wbplanviewmappinghelper';

interface NestedRecord<T> extends R<T | NestedRecord<T>> {}

export type MappingsTreeNode = Record<MappingType, IR<ColumnOptions>>;

export type MappingsTree = NestedRecord<MappingsTreeNode>;

type FlatTree = NestedRecord<string>;

/**
 * Merges objects recursively
 *  (by reference only, does not create a copy of the tree)
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

/**
 * Converts array to tree
 *
 * @example
 * if
 *   array is ['accession', 'accession agents', '#1, 'agent', 'first name']
 *   hasHeaders is False
 * then result is
 * ```json
 *  {
 *   'accession': {
 *     'accessionAgents': {
 *       '#1': {
 *         'agent': {
 *           'firstName': {
 *
 *           },
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @example
 * if
 *   array is [
 *     'accession', 'accession agents', '#1, 'agent', 'first name',
 *     'existingHeader', 'Agent 1 First Name'
 *   ]
 *   hasHeaders is True
 * then result is
 * ```json
 * {
 *   'accession': {
 *     'accessionAgents': {
 *       '#1': {
 *         'agent': {
 *           'firstName': {
 *             'existingHeader': 'Agent 1 First Name',
 *           },
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
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

/**
 * Converts array of arrays of strings into a complete tree
 *
 * @remarks
 * The inverse of mappingsTreeToMappingPaths
 *
 * @example
 * if array is:
 *   Accession, Accession Agents, #1, Agent, First Name
 *   Accession, Accession Agents, #1, Agent, Last Name
 *   Accession, Accession Agents, #1, Remarks
 * Resulting tree would be:
 *  Accession
 *     Accession Agents
 *      #1
 *        Agent
 *           First Name
 *           Last Name
 *        Remarks
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
  const tree = {};

  mappingPaths.forEach((mappingPath) =>
    deepMergeObject(tree, arrayToTree(mappingPath, includeHeaders))
  );

  return tree;
}

/**
 * Converts mappings tree to array of mappings
 * The inverse of mappingPathsToMappingsTree
 *
 * @example
 * if mappingsTree is:
 *   Accession
 *     Accession Agents
 *       #1
 *         Agent
 *           First Name
 *           Last Name
 *         Remarks
 * Result would be:
 *   Accession, Accession Agents, #1, Agent, First Name
 *   Accession, Accession Agents, #1, Agent, Last Name
 *   Accession, Accession Agents, #1, Remarks
 */
const mappingsTreeToMappingPaths = (
  mappingsTree: MappingsTree,
  // Used in a recursion to store intermediate path
  path: MappingPath = []
): RA<FullMappingPath> =>
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

export const mappingsTreeToSplitMappingPaths = (
  mappingsTree: MappingsTree
): RA<SplitMappingPath> =>
  mappingsTreeToMappingPaths(mappingsTree).map(splitFullMappingPathComponents);
