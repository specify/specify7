/**
 * Helper function for converting from mapping tree
 * (internal structure used in WbPlanView) to upload plan
 *
 * @module
 */

import type { Tables } from './datamodel';
import { getModel } from './schema';
import type { Relationship } from './specifyfield';
import { isTreeModel } from './treedefinitions';
import type { IR, R } from './types';
import type {
  ColumnDefinition,
  TreeRecordVariety,
  Uploadable,
  UploadPlan,
} from './uploadplantomappingstree';
import { defaultColumnOptions } from './wbplanviewlinesgetter';
import {
  getNameFromTreeRankName,
  relationshipIsToMany,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import type { MappingsTree, MappingsTreeNode } from './wbplanviewtreehelper';

interface UploadPlanNode
  extends R<string | boolean | UploadPlanNode | ColumnDefinition> {}

// TODO: make this file type safe

function mappingsTreeToUploadPlanTable(
  tableData: object,
  tableName: keyof Tables | undefined,
  mustMatchPreferences: IR<boolean>,
  wrapIt = true,
  isRoot = false
) {
  if (typeof tableName === 'string' && isTreeModel(tableName))
    return mappingsTreeToUploadTable(
      tableData as MappingsTree,
      tableName,
      mustMatchPreferences
    );

  let tablePlan: {
    wbcols: UploadPlanNode;
    static: UploadPlanNode;
    toOne: UploadPlanNode;
    toMany?: UploadPlanNode;
  } = {
    wbcols: {},
    static: {},
    toOne: {},
  };

  if (wrapIt) tablePlan.toMany = {};

  let isToMany = false;

  const model = getModel(tableName ?? '');

  tablePlan = Object.entries(tableData).reduce(
    (originalTablePlan, [fieldName, fieldData]) => {
      let tablePlan = originalTablePlan;

      const field = model?.getField(fieldName);

      if (valueIsToManyIndex(fieldName)) {
        if (!isToMany) {
          isToMany = true;
          // @ts-expect-error
          tablePlan = [];
        }

        // @ts-expect-error
        tablePlan.push(
          mappingsTreeToUploadPlanTable(
            fieldData,
            tableName,
            mustMatchPreferences,
            false
          )
        );
      } else if (valueIsTreeRank(fieldName))
        // @ts-expect-error
        tablePlan = mappingsTreeToUploadPlanTable(
          tableData,
          tableName,
          mustMatchPreferences,
          false
        );
      else if (typeof field === 'object' && typeof tablePlan === 'object') {
        if (field.isRelationship)
          handleRelationship(fieldData, field, tablePlan, mustMatchPreferences);
        else
          tablePlan[
            Object.entries(fieldData)[0][0] === 'newStaticColumn'
              ? 'static'
              : 'wbcols'
          ][fieldName] = extractHeaderNameFromHeaderStructure(fieldData);
      }

      return tablePlan;
    },
    tablePlan
  );

  if (Array.isArray(tablePlan) || !wrapIt) return tablePlan;

  if (valueIsToManyIndex(Object.keys(tableData)[0])) return tablePlan;

  return {
    [!isRoot && mustMatchPreferences[tableName || '']
      ? 'mustMatchTable'
      : 'uploadTable']: tablePlan,
  };
}

function handleRelationship(
  fieldData: object,
  relationship: Relationship,
  tablePlan: {
    wbcols: UploadPlanNode;
    static: UploadPlanNode;
    toOne: UploadPlanNode;
    toMany?: UploadPlanNode | undefined;
  },
  mustMatchPreferences: IR<boolean>
): void {
  if (
    !relationshipIsToMany(relationship) &&
    typeof tablePlan.toOne[relationship.name.toLowerCase()] === 'undefined'
  )
    tablePlan.toOne[relationship.name.toLowerCase()] =
      mappingsTreeToUploadPlanTable(
        fieldData,
        relationship.relatedModel.name,
        mustMatchPreferences
      ) as UploadPlanNode;
  else {
    tablePlan.toMany ??= {};
    tablePlan.toMany[relationship.name.toLowerCase()] ??=
      mappingsTreeToUploadPlanTable(
        fieldData,
        relationship.relatedModel.name,
        mustMatchPreferences,
        false
      ) as UploadPlanNode;
  }
}

export const extractHeaderNameFromHeaderStructure = (
  headerStructure: MappingsTreeNode
): ColumnDefinition =>
  Object.entries(headerStructure).map(([headerName, headerOptions]) =>
    JSON.stringify(headerOptions) === JSON.stringify(defaultColumnOptions)
      ? headerName
      : {
          ...defaultColumnOptions,
          column: headerName,
          ...headerOptions,
        }
  )[0];

const rankMappedFieldsToTreeRecordRanks = (
  rankMappedFields: IR<MappingsTreeNode>
): IR<ColumnDefinition> =>
  Object.fromEntries(
    Object.entries(rankMappedFields).map(
      ([fieldName, headerMappingStructure]) => [
        fieldName,
        extractHeaderNameFromHeaderStructure(headerMappingStructure),
      ]
    )
  );

const mappingsTreeToUploadPlanTree = (
  mappingsTree: MappingsTree
): IR<string | { treeNodeCols: IR<ColumnDefinition> }> =>
  Object.fromEntries(
    Object.entries(mappingsTree).map(([fullRankName, rankMappedFields]) => [
      getNameFromTreeRankName(fullRankName),
      {
        treeNodeCols: rankMappedFieldsToTreeRecordRanks(
          rankMappedFields as IR<MappingsTreeNode>
        ),
      },
    ])
  );

const mappingsTreeToUploadTable = (
  mappingsTree: Readonly<MappingsTree>,
  tableName: keyof Tables,
  mustMatchPreferences: IR<boolean>,
  isRoot = false
): Uploadable =>
  isTreeModel(tableName)
    ? ({
        [tableName in mustMatchPreferences
          ? 'mustMatchTreeRecord'
          : 'treeRecord']: {
          ranks: mappingsTreeToUploadPlanTree(mappingsTree),
        },
      } as TreeRecordVariety)
    : (mappingsTreeToUploadPlanTable(
        mappingsTree,
        tableName,
        mustMatchPreferences,
        true,
        isRoot
      ) as Uploadable);

/**
 * Converts mappings tree to upload plan
 * Inverse of uploadPlanToMappingsTree
 */
export const mappingsTreeToUploadPlan = (
  baseTableName: keyof Tables,
  mappingsTree: Readonly<MappingsTree>,
  mustMatchPreferences: IR<boolean>
): UploadPlan => ({
  baseTableName,
  uploadable: mappingsTreeToUploadTable(
    mappingsTree,
    baseTableName,
    Object.fromEntries(
      Object.entries(mustMatchPreferences).filter(([_, mustMatch]) => mustMatch)
    ),
    true
  ),
});
