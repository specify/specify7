/**
 * Helper methods for working with Specify data model as parsed by WbPlanView
 * model fetcher
 *
 * @module
 */

import type { MappingPath } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { getModel } from './schema';
import type { Relationship } from './specifyfield';
import { getTreeDefinitionItems, isTreeModel } from './treedefinitions';
import type { IR, RA } from './types';
import { defined } from './types';
import {
  formatTreeRank,
  getNumberFromToManyIndex,
  relationshipIsToMany,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import type { MappingsTree } from './wbplanviewtreehelper';

/** Returns the max index in the list of -to-many items */
export const getMaxToManyIndex = (
  // List of -to-many indexes
  values: RA<string>
): number =>
  values.reduce((max, value) => {
    // Skip `add` values and other possible NaN cases
    if (!valueIsToManyIndex(value)) return max;

    const number = getNumberFromToManyIndex(value);

    if (number > max) return number;

    return max;
  }, 0);

/** Iterates over the mappingsTree to find required fields that are missing */
export function findRequiredMissingFields(
  // Name of the current base table
  tableName: keyof Tables,
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
  const model = defined(getModel(tableName));

  if (typeof mappingsTree === 'undefined') return results;

  const listOfMappedFields = Object.keys(mappingsTree);

  // Handle -to-many references
  if (valueIsToManyIndex(listOfMappedFields[0])) {
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
  else if (isTreeModel(tableName)) {
    const treeRanks = getTreeDefinitionItems(tableName as 'Geography', false);
    const lastPathElement = path.slice(-1)[0];
    const lastPathElementIsRank = valueIsTreeRank(lastPathElement);

    if (!lastPathElementIsRank)
      return treeRanks.reduce((results, { name: rankName, isEnforced }) => {
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
        else if (isEnforced === true && !mustMatchPreferences[tableName])
          results.push(localPath);

        return results;
      }, results);
  }

  const parentTable = getModel(parentTableName);
  model?.relationships.forEach((relationship) => {
    const localPath = [...path, relationship.name];
    const isMapped = listOfMappedFields.includes(relationship.name);

    if (typeof parentTable === 'object') {
      let previousRelationshipName = localPath.slice(-2)[0];
      if (
        valueIsToManyIndex(previousRelationshipName) ||
        valueIsTreeRank(previousRelationshipName)
      )
        previousRelationshipName = localPath.slice(-3)[0];

      const parentRelationship = parentTable?.getRelationship(
        previousRelationshipName
      );

      let currentMappingPathPart = localPath[path.length - 1];
      if (
        valueIsToManyIndex(currentMappingPathPart) ||
        valueIsTreeRank(currentMappingPathPart)
      )
        currentMappingPathPart = localPath[path.length - 2];

      if (
        (typeof parentRelationship === 'object' &&
          // Disable circular relationships
          isCircularRelationship(parentRelationship, relationship)) ||
        // Skip -to-many inside -to-many
        (relationshipIsToMany(parentRelationship) &&
          relationshipIsToMany(relationship))
      )
        return;
    }

    if (isMapped)
      findRequiredMissingFields(
        relationship.relatedModel.name,
        mappingsTree[relationship.name] as MappingsTree,
        mustMatchPreferences,
        tableName,
        localPath,
        results
      );
    else if (
      relationship.overrides.isRequired &&
      !mustMatchPreferences[tableName]
    )
      results.push(localPath);
  });

  model.fields.forEach((field) => {
    const localPath = [...path, field.name];
    const isMapped = listOfMappedFields.includes(field.name);
    if (
      !isMapped &&
      field.overrides.isRequired &&
      !mustMatchPreferences[tableName]
    )
      results.push(localPath);
  });

  return results;
}

export const isCircularRelationship = (
  parentRelationship: Relationship,
  relationship: Relationship
): boolean =>
  (parentRelationship.relatedModel === relationship.model &&
    parentRelationship.otherSideName === relationship.name) ||
  (relationship.relatedModel === parentRelationship.model &&
    relationship.otherSideName === parentRelationship.name);
