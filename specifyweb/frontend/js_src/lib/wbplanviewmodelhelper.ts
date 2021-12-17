/*
 *
 * Helper methods for working with Specify data model as parsed by wbplanview
 * model fetcher
 *
 *
 */

import type { IR, RA } from './types';
import type {
  MappingPath,
  RelationshipType,
} from './components/wbplanviewmapper';
import {
  formatTreeRank,
  getIndexFromReferenceItemName,
  relationshipIsToMany,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import dataModelStorage from './wbplanviewmodel';
import type {
  DataModelField,
  DataModelNonRelationship,
  DataModelRelationship,
} from './wbplanviewmodelfetcher';
import type { MappingsTree } from './wbplanviewtreehelper';

/* Fetch fields for a table */
const getTableFields = (
  // The name of the table to fetch the fields for
  tableName: string,
  // Whether fields are relationships
  filterIsRelationship: boolean | -1 = -1,
  // Whether field is hidden
  filterIsHidden: boolean | -1 = -1
): [fieldName: string, fieldData: DataModelField][] =>
  Object.entries(dataModelStorage.tables[tableName].fields).filter(
    ([, { isRelationship, isHidden }]) =>
      (filterIsRelationship === -1 ||
        isRelationship === filterIsRelationship) &&
      (filterIsHidden === -1 || isHidden === filterIsHidden)
  );

/* Fetch fields for a table */
export const getTableNonRelationshipFields = (
  // The name of the table to fetch the fields for
  tableName: string,
  // Whether field is hidden
  filterIsHidden: boolean | -1 = -1
): [fieldName: string, fieldData: DataModelNonRelationship][] =>
  getTableFields(tableName, false, filterIsHidden) as [
    relationshipName: string,
    relationshipData: DataModelNonRelationship
  ][];

/* Fetch relationships for a table */
export const getTableRelationships = (
  // The name of the table to fetch relationships fields for
  tableName: string,
  // Whether field is hidden
  filterIsHidden: boolean | -1 = -1
): [fieldName: string, fieldData: DataModelRelationship][] =>
  getTableFields(tableName, true, filterIsHidden) as [
    relationshipName: string,
    relationshipData: DataModelRelationship
  ][];

/* Returns whether a table has tree ranks */
export const tableIsTree = (tableName?: string): boolean =>
  typeof dataModelStorage.ranks[tableName ?? ''] !== 'undefined';

/* Returns the max index in the list of reference item values */
export const getMaxToManyValue = (
  // List of reference item values
  values: RA<string>
): number =>
  values.reduce((max, value) => {
    // Skip `add` values and other possible NaN cases
    if (!valueIsReferenceItem(value)) return max;

    const number = getIndexFromReferenceItemName(value);

    if (number > max) return number;

    return max;
  }, 0);

/* Iterates over the mappingsTree to find required fields that are missing */
export function findRequiredMissingFields(
  // Name of the current base table
  tableName: string,
  /*
   * Result of running mappings.getMappingsTree() - an object with
   * information about now mapped fields
   */
  mappingsTree?: MappingsTree,
  // If a table is set as must match, all of it's fields are optional
  mustMatchPreferences: IR<boolean> = {},
  // Used internally in a recursion. Previous table name
  parentTableName = '',
  // Used internally in a recursion. Current mapping path
  path: MappingPath = [],
  // Used internally in a recursion. Save results
  results: MappingPath[] = []
): MappingPath[] {
  const tableData = dataModelStorage.tables[tableName];

  if (typeof mappingsTree === 'undefined') return results;

  const listOfMappedFields = Object.keys(mappingsTree);

  // Handle -to-many references
  if (valueIsReferenceItem(listOfMappedFields[0])) {
    listOfMappedFields.forEach((mappedFieldName) => {
      const localPath = [...path, mappedFieldName];
      if (typeof mappingsTree[mappedFieldName] === 'object')
        findRequiredMissingFields(
          tableName,
          mappingsTree[mappedFieldName] as MappingsTree,
          mustMatchPreferences,
          parentTableName,
          localPath,
          results
        );
    });
    return results;
  }

  // Handle trees
  else if (tableIsTree(tableName)) {
    const keys = Object.keys(dataModelStorage.ranks[tableName]);
    const lastPathElement = path.slice(-1)[0];
    const lastPathElementIsRank = valueIsTreeRank(lastPathElement);

    if (!lastPathElementIsRank)
      return keys.reduce((results, rankName) => {
        const rankData = dataModelStorage.ranks[tableName][rankName];
        const complimentedRankName = formatTreeRank(rankName);
        const localPath = [...path, complimentedRankName];

        if (listOfMappedFields.includes(complimentedRankName))
          findRequiredMissingFields(
            tableName,
            mappingsTree[complimentedRankName] as MappingsTree,
            mustMatchPreferences,
            parentTableName,
            localPath,
            results
          );
        else if (rankData.isRequired && !mustMatchPreferences[tableName])
          results.push(localPath);

        return results;
      }, results);
  }

  // Handle regular fields and relationships
  Object.entries(tableData.fields).forEach(([fieldName, fieldData]) => {
    const localPath = [...path, fieldName];

    const isMapped = listOfMappedFields.includes(fieldName);

    if (fieldData.isRelationship) {
      if (parentTableName !== '') {
        let previousRelationshipName = localPath.slice(-2)[0];
        if (
          valueIsReferenceItem(previousRelationshipName) ||
          valueIsTreeRank(previousRelationshipName)
        )
          previousRelationshipName = localPath.slice(-3)[0];

        const parentRelationshipData = dataModelStorage.tables[parentTableName]
          .fields[previousRelationshipName] as DataModelRelationship;

        let currentMappingPathPart = localPath[path.length - 1];
        if (
          valueIsReferenceItem(currentMappingPathPart) ||
          valueIsTreeRank(currentMappingPathPart)
        )
          currentMappingPathPart = localPath[path.length - 2];

        if (
          // Disable circular relationships
          isCircularRelationship({
            targetTableName: fieldData.tableName,
            parentTableName,
            foreignName: fieldData.foreignName,
            relationshipKey: fieldName,
            currentMappingPathPart,
            tableName,
          }) ||
          // Skip -to-many inside -to-many
          (relationshipIsToMany(parentRelationshipData.type) &&
            relationshipIsToMany(fieldData.type))
        )
          return;
      }

      if (isMapped)
        findRequiredMissingFields(
          fieldData.tableName,
          mappingsTree[fieldName] as MappingsTree,
          mustMatchPreferences,
          tableName,
          localPath,
          results
        );
      else if (fieldData.isRequired && !mustMatchPreferences[tableName])
        results.push(localPath);
    } else if (
      !isMapped &&
      fieldData.isRequired &&
      !mustMatchPreferences[tableName]
    )
      results.push(localPath);
  });

  return results;
}

export const isCircularRelationshipBackwards = ({
  parentTableName,
  foreignName,
  relationshipKey,
}: {
  readonly parentTableName?: string;
  readonly foreignName?: string;
  readonly relationshipKey?: string;
}): boolean =>
  dataModelStorage.tables[parentTableName ?? '']?.fields[foreignName ?? '']
    ?.foreignName === relationshipKey || false;

export const isCircularRelationshipForwards = ({
  tableName,
  relationshipKey,
  currentMappingPathPart,
}: {
  readonly tableName?: string;
  readonly relationshipKey?: string;
  readonly currentMappingPathPart?: string;
}): boolean =>
  dataModelStorage.tables[tableName ?? '']?.fields[relationshipKey ?? '']
    ?.foreignName === currentMappingPathPart || false;

export const isCircularRelationship = ({
  targetTableName,
  parentTableName,
  foreignName,
  relationshipKey,
  currentMappingPathPart,
  tableName,
}: {
  readonly targetTableName?: string;
  readonly parentTableName?: string;
  readonly foreignName?: string;
  readonly relationshipKey?: string;
  readonly currentMappingPathPart?: string;
  readonly tableName?: string;
}): boolean =>
  targetTableName === parentTableName &&
  (isCircularRelationshipBackwards({
    parentTableName,
    foreignName,
    relationshipKey,
  }) ||
    isCircularRelationshipForwards({
      tableName,
      relationshipKey,
      currentMappingPathPart,
    }));

export const isTooManyInsideOfTooMany = (
  type?: RelationshipType,
  parentType?: RelationshipType
): boolean => relationshipIsToMany(type) && relationshipIsToMany(parentType);
