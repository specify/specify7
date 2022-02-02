/**
 * WbPlanView helpers for dealing with the Data Model
 *
 * @module
 */

import type {
  FullMappingPath,
  MappingPath,
  MappingType,
  RelationshipType,
} from './components/wbplanviewmapper';
import type { R, RA } from './types';
import type { ColumnOptions } from './uploadplantomappingstree';
import dataModelStorage from './wbplanviewmodel';

/**
 * Returns whether relationship is a -to-many
 *  (e.x. one-to-many or many-to-many)
 *
 */
export const relationshipIsToMany = (
  relationshipType?: RelationshipType | ''
): boolean => (relationshipType ?? '').includes('-to-many');

/** Returns whether a value is a -to-many reference item (e.x #1, #2, etc...) */
export const valueIsReferenceItem = (value?: string): boolean =>
  value?.slice(0, dataModelStorage.referenceSymbol.length) ===
    dataModelStorage.referenceSymbol || false;

/** Returns whether a value is a tree rank name (e.x $Kingdom, $Order) */
export const valueIsTreeRank = (value: string): boolean =>
  value?.startsWith(dataModelStorage.treeSymbol) || false;

/**
 * Returns index from a complete reference item value (e.x #1 => 1)
 * Opposite of formatReferenceItem
 *
 */
export const getIndexFromReferenceItemName = (value: string): number =>
  Number(value.slice(dataModelStorage.referenceSymbol.length));

/**
 * Returns tree rank name from a complete tree rank name
 * (e.x $Kingdom => Kingdom)
 * Opposite of formatTreeRank
 *
 */
export const getNameFromTreeRankName = (value: string): string =>
  value.slice(dataModelStorage.treeSymbol.length);

/**
 * Returns a complete reference item from an index (e.x 1 => #1)
 * Opposite of getIndexFromReferenceItemName
 *
 */
export const formatReferenceItem = (index: number): string =>
  `${dataModelStorage.referenceSymbol}${index}`;

/**
 * Returns a complete tree rank name from a tree rank name
 * (e.x Kingdom => $Kingdom)
 * Opposite of getNameFromTreeRankName
 *
 */
export const formatTreeRank = (rankName: string): string =>
  `${dataModelStorage.treeSymbol}${rankName}`;

export const mappingPathToString = (mappingPath: MappingPath): string =>
  mappingPath.join(dataModelStorage.pathJoinSymbol);

export const splitJoinedMappingPath = (string: string): MappingPath =>
  string.split(dataModelStorage.pathJoinSymbol);

export type SplitMappingPath = {
  readonly mappingPath: MappingPath;
  readonly mappingType: MappingType;
  readonly headerName: string;
  readonly columnOptions: ColumnOptions;
};

export const splitFullMappingPathComponents = (
  fullMappingPath: FullMappingPath
): SplitMappingPath => ({
  mappingPath: fullMappingPath.slice(0, -3) as MappingPath,
  mappingType: fullMappingPath[fullMappingPath.length - 3] as MappingType,
  headerName: fullMappingPath[fullMappingPath.length - 2] as string,
  columnOptions: fullMappingPath[fullMappingPath.length - 1] as ColumnOptions,
});

/** Find the index of a subArray in array. On failure returns -1 */
export const findSubArray = (array: RA<string>, subArray: RA<string>): number =>
  array.findIndex((_, index) =>
    mappingPathToString(array.slice(index)).startsWith(
      mappingPathToString(subArray)
    )
  );

/**
 * Takes array of mappings and returns the indexes of duplicate mappings
 * Example:
 * if three lines have the same mapping, the indexes of the second and
 *  third lines are returned. (The first occurrence remains, while all others
 *  are unmapped, except for the case when focusedLine is a duplicate - all
 *  duplicates except for the focused line get unmapped)
 */
export const findDuplicateMappings = (
  mappingPaths: RA<MappingPath>,
  focusedLine: number | false
): RA<number> => {
  const duplicateIndexes: number[] = [];

  mappingPaths.reduce<string[]>((dictionaryOfMappings, mappingPath, index) => {
    const stringMappingPath = mappingPathToString(mappingPath);

    if (dictionaryOfMappings.includes(stringMappingPath))
      duplicateIndexes.push(
        typeof focusedLine === 'number' && focusedLine === index
          ? dictionaryOfMappings.indexOf(stringMappingPath)
          : index
      );
    else dictionaryOfMappings.push(stringMappingPath);

    return dictionaryOfMappings;
  }, []);

  return duplicateIndexes;
};

// Replaces all -to-many indexes with #1
export const getCanonicalMappingPath = (
  mappingPath: MappingPath
): MappingPath =>
  mappingPath.map((mappingPathPart) =>
    valueIsReferenceItem(mappingPathPart)
      ? formatReferenceItem(1)
      : mappingPathPart
  );

export const getGenericMappingPath = (mappingPath: MappingPath): MappingPath =>
  mappingPath.filter(
    (mappingPathPart) =>
      !valueIsReferenceItem(mappingPathPart) &&
      !valueIsTreeRank(mappingPathPart)
  );

/**
 * Rebases -to-many indexes to make sure there are no skipped indexes
 *
 * @example
 * Given this input:
 * mappingPaths = [
 *   ['locality','collectingevents','#2','startdate',
 *   ['locality','collectingevents','#3','startdate',
 * ]
 *
 * The output would be:
 * [
 *   ['locality','collectingevents','#1','startdate',
 *   ['locality','collectingevents','#2','startdate',
 * ]
 */
export function deflateMappingPaths(
  mappingPaths: RA<MappingPath>
): RA<MappingPath> {
  const changes: R<string> = {};
  return mappingPaths.reduce<RA<MappingPath>>(
    (mappingPaths, mappingPath, rowIndex) => {
      let resetToManys = false;
      const newMappingPath = Array.from(mappingPath);
      mappingPath.forEach((mappingPathPart, partIndex) => {
        if (!valueIsReferenceItem(mappingPathPart)) return;
        const subPath = mappingPathToString(
          newMappingPath.slice(0, partIndex + 1)
        );
        if (resetToManys) changes[subPath] = formatReferenceItem(1);
        if (subPath in changes) {
          newMappingPath[partIndex] = changes[subPath];
          return;
        }

        const newIndex =
          getIndexFromReferenceItemName(
            mappingPaths
              .slice(0, rowIndex)
              .reverse()
              .map((mappingPath) => mappingPath.slice(0, partIndex + 1))
              .find(
                (mappingPath) =>
                  mappingPathToString(mappingPath.slice(0, -1)) ===
                  mappingPathToString(newMappingPath.slice(0, partIndex))
              )
              ?.slice(-1)[0] ?? formatReferenceItem(0)
          ) + 1;
        if (newIndex >= getIndexFromReferenceItemName(mappingPathPart)) return;
        resetToManys = true;
        const newValue = formatReferenceItem(newIndex);
        changes[subPath] = newValue;
        newMappingPath[partIndex] = newValue;
      });
      return [...mappingPaths, newMappingPath];
    },
    []
  );
}
