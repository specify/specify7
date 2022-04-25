/**
 * Helper methods for working with Specify data model as parsed by WbPlanView
 * model fetcher
 *
 * @module
 */

import type { MappingPath } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { group } from './helpers';
import { hasTreeAccess } from './permissions';
import { getModel } from './schema';
import type { Relationship } from './specifyfield';
import { getTreeDefinitionItems, isTreeModel } from './treedefinitions';
import type { IR, RA } from './types';
import { defined, filterArray } from './types';
import {
  formatTreeRank,
  getNumberFromToManyIndex,
  relationshipIsToMany,
  valueIsToManyIndex,
} from './wbplanviewmappinghelper';

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
  mappings: RA<MappingPath>,
  // If a table is set as must match, all of it's fields are optional
  mustMatchPreferences: IR<boolean>,
  // Used internally in a recursion. Previous table name
  parentRelationship: Relationship | undefined = undefined,
  // Used internally in a recursion. Current mapping path
  path: MappingPath = []
): MappingPath[] {
  const model = defined(getModel(tableName));

  if (typeof mappings === 'undefined') return [];

  const mappingEntries = group(
    mappings.map((line) => [line[0], line.slice(1)] as const)
  );
  const indexedMappings = Object.fromEntries(mappingEntries);

  // Handle -to-many references
  if (mappings.length > 0 && valueIsToManyIndex(mappings[0][0]))
    return mappingEntries.flatMap(([index, mappings]) =>
      findRequiredMissingFields(
        tableName,
        mappings,
        mustMatchPreferences,
        parentRelationship,
        [...path, index]
      )
    );
  // Handle trees
  else if (isTreeModel(tableName))
    return hasTreeAccess(tableName as 'Geography', 'read')
      ? defined(
          getTreeDefinitionItems(tableName as 'Geography', false)
        ).flatMap(({ name: rankName, isEnforced }) => {
          const formattedRankName = formatTreeRank(rankName);
          const localPath = [...path, formattedRankName];

          if (formattedRankName in indexedMappings)
            return findRequiredMissingFields(
              tableName,
              indexedMappings[formattedRankName],
              mustMatchPreferences,
              parentRelationship,
              localPath
            );
          else if (isEnforced === true && !mustMatchPreferences[tableName])
            return [localPath];
          else return [];
        })
      : [];

  return [
    ...model.relationships.flatMap((relationship) => {
      const localPath = [...path, relationship.name];

      if (
        typeof parentRelationship === 'object' &&
        // Disable circular relationships
        (isCircularRelationship(parentRelationship, relationship) ||
          // Skip -to-many inside -to-many
          (relationshipIsToMany(parentRelationship) &&
            relationshipIsToMany(relationship)))
      )
        return [];

      if (relationship.name in indexedMappings)
        return findRequiredMissingFields(
          relationship.relatedModel.name,
          indexedMappings[relationship.name],
          mustMatchPreferences,
          relationship,
          localPath
        );
      else if (
        relationship.overrides.isRequired &&
        !mustMatchPreferences[tableName]
      )
        return [localPath];
      else return [];
    }),
    ...filterArray(
      model.literalFields.map((field) =>
        !(field.name in indexedMappings) &&
        field.overrides.isRequired &&
        !mustMatchPreferences[tableName]
          ? [...path, field.name]
          : undefined
      )
    ),
  ];
}

export const isCircularRelationship = (
  parentRelationship: Relationship,
  relationship: Relationship
): boolean =>
  (parentRelationship.relatedModel === relationship.model &&
    parentRelationship.otherSideName === relationship.name) ||
  (relationship.relatedModel === parentRelationship.model &&
    relationship.otherSideName === parentRelationship.name);
