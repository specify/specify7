/*
*
* Helper methods for working with Specify data model as parsed by wbplanview
* model fetcher
*
* */

'use strict';

import dataModelStorage from './wbplanviewmodel';
import {
  DataModelField,
  DataModelFields,
  DataModelNonRelationship,
  DataModelRelationship,
}                       from './wbplanviewmodelfetcher';
import { MappingPath, RelationshipType } from './components/wbplanviewmapper';
import { MappingsTree }                  from './wbplanviewtreehelper';

/* fetch fields for a table */
const getTableFields = (
  tableName: string,  // the name of the table to fetch the fields for
  // whether fields are relationships
  filterIsRelationship: boolean | -1 = -1,
  filterIsHidden: boolean | -1 = -1,  // whether field is hidden
): [fieldName: string, fieldData: DataModelField][] =>
  Object.entries(
    dataModelStorage.tables[tableName].fields as DataModelFields,
  ).filter(([, {
      isRelationship,
      isHidden,
    }]) =>
    (
      filterIsRelationship === -1 ||
      isRelationship === filterIsRelationship
    ) &&
    (
      filterIsHidden === -1 ||
      isHidden === filterIsHidden
    ),
  );

/* fetch fields for a table */
export const getTableNonRelationshipFields = (
  tableName: string,  // the name of the table to fetch the fields for
  filterIsHidden: boolean | -1 = -1,  // whether field is hidden
) =>
  getTableFields(
    tableName,
    false,
    filterIsHidden,
  ) as [
    relationshipName: string,
    relationshipData: DataModelNonRelationship
  ][];

/* fetch relationships for a table */
export const getTableRelationships = (
  // the name of the table to fetch relationships fields for
  tableName: string,
  filterIsHidden: boolean | -1 = -1,  // whether field is hidden
) =>
  getTableFields(
    tableName,
    true,
    filterIsHidden,
  ) as [relationshipName: string, relationshipData: DataModelRelationship][];

/* Returns whether a table has tree ranks */
export const tableIsTree = (
  tableName?: string,
): boolean /* whether a table has tree ranks */ =>
  typeof dataModelStorage.ranks[tableName || ''] !== 'undefined';

/* Returns whether relationship is a -to-many
*	(e.x. one-to-many or many-to-many)
* */
export const relationshipIsToMany = (
  relationshipType?: RelationshipType | '',
): boolean /* whether relationship is a -to-many */ =>
  (
    relationshipType ?? ''
  ).indexOf('-to-many') !== -1;

/* Returns whether a value is a -to-many reference item (e.x #1, #2, etc...) */
export const valueIsReferenceItem = (
  value?: string,  // the value to use
): boolean /* whether a value is a -to-many reference item */ =>
  value?.substr(
    0,
    dataModelStorage.referenceSymbol.length,
  ) === dataModelStorage.referenceSymbol || false;

/* Returns whether a value is a tree rank name (e.x $Kingdom, $Order) */
export const valueIsTreeRank = (
  value: string,  // the value to use
): boolean /* whether a value is a tree rank */ =>
  value?.substr(
    0,
    dataModelStorage.treeSymbol.length,
  ) === dataModelStorage.treeSymbol || false;

/*
* Returns index from a complete reference item value (e.x #1 => 1)
* Opposite of formatReferenceItem
* */
export const getIndexFromReferenceItemName = (
  value: string,  // the value to use
): number =>
  ~~value.substr(dataModelStorage.referenceSymbol.length);

/*
* Returns tree rank name from a complete tree rank name
* (e.x $Kingdom => Kingdom)
* Opposite of formatTreeRank
* */
export const getNameFromTreeRankName = (
  value: string,   // the value to use
): string /*tree rank name*/ =>
  value.substr(dataModelStorage.treeSymbol.length);

/* Returns the max index in the list of reference item values */
export const getMaxToManyValue = (
  values: string[],  // list of reference item values
): number /* max index. Returns 0 if there aren't any */ =>
  values.reduce((max, value) => {

    // skip `add` values and other possible NaN cases
    if (!valueIsReferenceItem(value))
      return max;

    const number = getIndexFromReferenceItemName(value);

    if (number > max)
      return number;

    return max;

  }, 0);

/*
* Returns a complete reference item from an index (e.x 1 => #1)
* Opposite of getIndexFromReferenceItemName
* */
export const formatReferenceItem = (
  index: number,  // the index to use
): string /* a complete reference item from an index */ =>
  `${dataModelStorage.referenceSymbol}${index}`;

/*
* Returns a complete tree rank name from a tree rank name
* (e.x Kingdom => $Kingdom)
* Opposite of getNameFromTreeRankName
* */
export const formatTreeRank = (
  rankName: string,  // tree rank name to use
): string /* a complete tree rank name */ =>
  `${
    dataModelStorage.treeSymbol
  }${
    rankName[0].toUpperCase()
  }${
    rankName.slice(1).toLowerCase()
  }`;

export const mappingPathToString = (
  mappingPath: MappingPath,
): string =>
  mappingPath.join(dataModelStorage.pathJoinSymbol);


/* Iterates over the mappingsTree to find required fields that are missing */
export function showRequiredMissingFields(
  // Official name of the current base table (from data model)
  tableName: string,
  // Result of running mappings.getMappingsTree() - an object with
  // information about now mapped fields
  mappingsTree?: MappingsTree,
  // used internally in a recursion. Previous table name
  previousTableName = '',
  // used internally in a recursion. Current mapping path
  path: MappingPath = [],
  // used internally in a recursion. Save results
  results: string[][] = [],
): string[][] /* array of mapping paths (array) */ {

  const tableData = dataModelStorage.tables[tableName];

  if (typeof mappingsTree === 'undefined')
    return results;

  const listOfMappedFields = Object.keys(mappingsTree);

  // handle -to-many references
  if (valueIsReferenceItem(listOfMappedFields[0])) {
    listOfMappedFields.forEach(mappedFieldName => {
      const localPath = [...path, mappedFieldName];
      if (typeof mappingsTree[mappedFieldName] === 'object')
        showRequiredMissingFields(
          tableName,
          mappingsTree[mappedFieldName] as MappingsTree,
          previousTableName,
          localPath,
          results,
        );
    });
    return results;
  }

  // handle trees
  else if (tableIsTree(tableName)) {

    const keys = Object.keys(dataModelStorage.ranks[tableName]);
    const lastPathElement = path.slice(-1)[0];
    const lastPathElementIsRank = valueIsTreeRank(lastPathElement);

    if (!lastPathElementIsRank)
      return keys.reduce((results, rankName) => {
        const isRankRequired =
          dataModelStorage.ranks[tableName][rankName];
        const complimentedRankName =
          dataModelStorage.treeSymbol + rankName;
        const localPath = [...path, complimentedRankName];

        if (listOfMappedFields.indexOf(complimentedRankName) !== -1)
          showRequiredMissingFields(
            tableName,
            mappingsTree[complimentedRankName] as MappingsTree,
            previousTableName,
            localPath,
            results,
          );
        else if (isRankRequired)
          results.push(localPath);

        return results;

      }, results);
  }

  // handle regular fields and relationships
  Object.entries(
    tableData.fields,
  ).some(([fieldName, fieldData]) => {

    const localPath = [...path, fieldName];

    const isMapped = listOfMappedFields.indexOf(fieldName) !== -1;


    if (fieldData.isRelationship) {


      if (previousTableName !== '') {

        let previousRelationshipName = localPath.slice(-2)[0];
        if (
          valueIsReferenceItem(previousRelationshipName) ||
          valueIsTreeRank(previousRelationshipName)
        )
          previousRelationshipName = localPath.slice(-3)[0];

        const parentRelationshipData =
          dataModelStorage.tables[previousTableName].fields[
            previousRelationshipName] as DataModelRelationship;

        if (
          (  // disable circular relationships
            fieldData.foreignName === previousRelationshipName &&
            fieldData.tableName === previousTableName
          ) ||
          (  // skip -to-many inside -to-many
            relationshipIsToMany(parentRelationshipData.type) &&
            relationshipIsToMany(fieldData.type)
          )
        )
          return;

      }

      if (isMapped)
        showRequiredMissingFields(
          fieldData.tableName,
          mappingsTree[fieldName] as MappingsTree,
          tableName,
          localPath,
          results,
        );
      else if (fieldData.isRequired)
        results.push(localPath);
    }
    else if (!isMapped && fieldData.isRequired)
      results.push(localPath);


  });

  return results;

}


export const isCircularRelationshipForwards = ({
  tableName,
  relationshipKey,
  currentMappingPathPart,
}: {
  tableName?: string,
  relationshipKey?: string,
  currentMappingPathPart?: string,
}): boolean =>
  dataModelStorage.tables[tableName || '']?.
    fields[relationshipKey || '']?.
    foreignName === currentMappingPathPart || false;

export const isCircularRelationshipBackwards = ({
  foreignName,
  parentTableName,
  relationshipKey,
}: {
  foreignName?: string,
  parentTableName?: string,
  relationshipKey?: string,
}): boolean =>
  dataModelStorage.tables[parentTableName || '']?.
    fields[foreignName || '']?.
    foreignName === relationshipKey || false;

export const isCircularRelationship = ({
  targetTableName,
  parentTableName,
  foreignName,
  relationshipKey,
  currentMappingPathPart,
  tableName,
}: {
  targetTableName?: string,
  parentTableName?: string,
  foreignName?: string,
  relationshipKey?: string,
  currentMappingPathPart?: string,
  tableName?: string,
}): boolean =>
  targetTableName === parentTableName &&
  (
    isCircularRelationshipBackwards(
      {
        parentTableName,
        foreignName,
        relationshipKey,
      },
    ) ||
    isCircularRelationshipForwards(
      {
        tableName,
        relationshipKey,
        currentMappingPathPart,
      },
    )
  );

export const isTooManyInsideOfTooMany = (
  type?: RelationshipType,
  parentType?: RelationshipType,
): boolean =>
  relationshipIsToMany(type) &&
  relationshipIsToMany(parentType);