/**
 * WbPlanView helpers for dealing with the Data Model
 *
 * @module
 */

import type { R, RA, WritableArray } from '../../utils/types';
import { schema } from '../DataModel/schema';
import type { Relationship } from '../DataModel/specifyField';
import type { CollectionObject } from '../DataModel/types';
import type { MappingPath } from './Mapper';
import type { ColumnOptions } from './uploadPlanParser';

/**
 * Returns whether relationship is a -to-many
 *  (e.x. one-to-many or many-to-many)
 *
 */
export const relationshipIsToMany = (
  relationship: Relationship | undefined
): boolean =>
  relationship?.type.includes('-to-many') === true ||
  relationship?.type === 'zero-to-one';

export type FieldType = Exclude<keyof CollectionObject, 'tableName'>;

/** Returns whether a value is a -to-many index (e.x #1, #2, etc...) */
export const valueIsToManyIndex = (value: string | undefined): boolean =>
  value?.slice(0, schema.referenceSymbol.length) === schema.referenceSymbol ||
  false;

/**
 * Returns whether a value is any special tree-related meta information
 * (e.g. tree defintiion, tree rank)
 */
export const valueIsTreeMeta = (value: string | undefined): boolean =>
  valueIsTreeDefinition(value) || valueIsTreeRank(value);

/** Returns whether a value is a tree definition name (e.x %Taxonomy) */
export const valueIsTreeDefinition = (value: string | undefined): boolean =>
  value?.startsWith(schema.treeDefinitionSymbol) ?? false;

/** Returns whether a value is a tree rank name (e.x $Kingdom, $Order) */
export const valueIsTreeRank = (value: string | undefined): boolean =>
  value?.startsWith(schema.treeRankSymbol) ?? false;

/**
 * Returns index from a formatted -to-many index value (e.x #1 => 1)
 * Opposite of formatToManyIndex
 */
export const getNumberFromToManyIndex = (value: string): number =>
  Number(value.slice(schema.referenceSymbol.length));

/**
 * Returns tree definition name from a complete tree definition name
 * (e.x %Taxonomy => Taxonomy)
 * Opposite of formatTreeDefinition
 */
export const getNameFromTreeDefinitionName = (value: string): string =>
  value.slice(schema.treeDefinitionSymbol.length);

/*
 * BUG: in places where output of this function is displayed to the user,
 *   make sure to use tree rank title instead of name
 */
/**
 * Returns tree rank name from a complete tree rank name
 * (e.x $Kingdom => Kingdom)
 * Opposite of formatTreeRank
 *
 */
export const getNameFromTreeRankName = (value: string): string =>
  value.slice(schema.treeRankSymbol.length);

/**
 * Returns a formatted -to-many index from an index (e.x 1 => #1)
 * Opposite of getNumberFromToManyIndex
 */
export const formatToManyIndex = (index: number): string =>
  `${schema.referenceSymbol}${index}`;

// Meta fields
export const anyTreeRank = `${schema.fieldPartSeparator}any` as const;
export const formattedEntry = `${schema.fieldPartSeparator}formatted`;

/**
 * Used in mapping path to represent "NOT MAPPED".
 * This exists to make it trivially easy to detect paths that are not yet
 * fully mapped (see mappingPathIsComplete).
 * Though, if I were to design this all from scratch today, I would use
 * LiteralField and Relationship objects in my mapping paths rather than their
 * field names, which would also make it easy to detect incomplete path:
 * mappingPath.at(-1)?.isRelationship !== false
 */
export const emptyMapping = '0';

/**
 * Returns a complete tree definition name from a tree definition name
 * (e.x Taxononomy => %Taxonomy)
 * Opposite of getNameFromTreeDefinitionName
 */
export const formatTreeDefinition = (definitionName: string): string =>
  `${schema.treeDefinitionSymbol}${definitionName}`;

/**
 * Returns a complete tree rank name from a tree rank name
 * (e.x Kingdom => $Kingdom)
 * Opposite of getNameFromTreeRankName
 *
 */
export const formatTreeRank = (rankName: string): string =>
  `${schema.treeRankSymbol}${rankName}`;

// Match fields names like startDate_fullDate, but not _formatted
export const valueIsPartialField = (value: string): boolean =>
  value.includes(schema.fieldPartSeparator) &&
  !value.startsWith(schema.fieldPartSeparator);

export const formatPartialField = (fieldName: string, part: string): string =>
  `${fieldName}${schema.fieldPartSeparator}${part}`;

export function parsePartialField<PART extends string>(
  value: string
): readonly [fieldName: string, part: PART] {
  const split = value.split(schema.fieldPartSeparator);
  if (split.length !== 2) throw new Error('failed to parse partial field');
  // eslint-disable-next-line functional/prefer-readonly-type
  return split as [string, PART];
}

export const mappingPathToString = (mappingPath: MappingPath): string =>
  mappingPath.join('.');

export const splitJoinedMappingPath = (string: string): MappingPath =>
  string.split('.');

export type SplitMappingPath = {
  readonly headerName: string;
  readonly mappingPath: MappingPath;
  readonly columnOptions: ColumnOptions;
};

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
  const duplicateIndexes: WritableArray<number> = [];

  mappingPaths.reduce<WritableArray<string>>(
    (dictionaryOfMappings, mappingPath, index) => {
      const stringMappingPath = mappingPathToString(mappingPath);

      if (dictionaryOfMappings.includes(stringMappingPath))
        duplicateIndexes.push(
          typeof focusedLine === 'number' && focusedLine === index
            ? dictionaryOfMappings.indexOf(stringMappingPath)
            : index
        );
      else dictionaryOfMappings.push(stringMappingPath);

      return dictionaryOfMappings;
    },
    []
  );

  return duplicateIndexes;
};

/** Replaces all -to-many indexes with #1 */
export const getCanonicalMappingPath = (
  mappingPath: MappingPath
): MappingPath =>
  mappingPath.map((mappingPathPart) =>
    valueIsToManyIndex(mappingPathPart) ? formatToManyIndex(1) : mappingPathPart
  );

/** Filters out -to-many and tree ranks from the mapping path */
export const getGenericMappingPath = (mappingPath: MappingPath): MappingPath =>
  mappingPath.filter(
    (mappingPathPart) =>
      !valueIsToManyIndex(mappingPathPart) &&
      !valueIsTreeMeta(mappingPathPart) &&
      mappingPathPart !== formattedEntry &&
      mappingPathPart !== emptyMapping
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
        if (!valueIsToManyIndex(mappingPathPart)) return;
        const subPath = mappingPathToString(
          newMappingPath.slice(0, partIndex + 1)
        );
        if (resetToManys) changes[subPath] = formatToManyIndex(1);
        if (subPath in changes) {
          newMappingPath[partIndex] = changes[subPath];
          return;
        }

        const newIndex =
          getNumberFromToManyIndex(
            mappingPaths
              .slice(0, rowIndex)
              .reverse()
              .map((mappingPath) => mappingPath.slice(0, partIndex + 1))
              .find(
                (mappingPath) =>
                  mappingPathToString(mappingPath.slice(0, -1)) ===
                  mappingPathToString(newMappingPath.slice(0, partIndex))
              )
              ?.slice(-1)[0] ?? formatToManyIndex(0)
          ) + 1;
        if (newIndex >= getNumberFromToManyIndex(mappingPathPart)) return;
        resetToManys = true;
        const newValue = formatToManyIndex(newIndex);
        changes[subPath] = newValue;
        newMappingPath[partIndex] = newValue;
      });
      return [...mappingPaths, newMappingPath];
    },
    []
  );
}
