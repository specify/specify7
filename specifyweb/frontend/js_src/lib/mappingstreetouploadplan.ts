/**
 * Helper function for converting from mapping tree
 * (internal structure used in WbPlanView) to upload plan
 *
 * @module
 */

import { isTreeModel } from './treedefinitions';
import type { IR, R, Writable } from './types';
import type {
  ColumnDefinition,
  TreeRecordVariety,
  Uploadable,
  UploadPlan,
} from './uploadplantomappingstree';
import { defaultColumnOptions } from './wbplanviewlinesgetter';
import {
  getNameFromTreeRankName,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import dataModelStorage from './wbplanviewmodel';
import type { DataModelField } from './wbplanviewmodelfetcher';
import type { MappingsTree, MappingsTreeNode } from './wbplanviewtreehelper';

interface UploadPlanNode
  extends R<string | boolean | UploadPlanNode | ColumnDefinition> {}

function mappingsTreeToUploadPlanTable(
  tableData: object,
  tableName: string | undefined,
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

  tablePlan = Object.entries(tableData).reduce(
    (originalTablePlan, [fieldName, fieldData]) => {
      let tablePlan = originalTablePlan;

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
      else if (
        typeof dataModelStorage.tables[tableName ?? '']?.[fieldName] ===
          'object' &&
        typeof tablePlan === 'object'
      ) {
        const field = dataModelStorage.tables[tableName ?? '']?.[fieldName];

        if (field.isRelationship)
          handleRelationshipField(
            fieldData,
            field,
            fieldName,
            tablePlan,
            mustMatchPreferences
          );
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

function handleRelationshipField(
  fieldData: object,
  field: Writable<DataModelField>,
  fieldName: string,
  tablePlan: {
    wbcols: UploadPlanNode;
    static: UploadPlanNode;
    toOne: UploadPlanNode;
    toMany?: UploadPlanNode | undefined;
  },
  mustMatchPreferences: IR<boolean>
): void {
  const mappingTable = field.tableName;
  if (typeof mappingTable === 'undefined')
    throw new Error('Mapping Table is not defined');

  const isToOne = field.type === 'one-to-one' || field.type === 'many-to-one';

  if (isToOne && typeof tablePlan.toOne[fieldName] === 'undefined')
    tablePlan.toOne[fieldName] = mappingsTreeToUploadPlanTable(
      fieldData,
      mappingTable,
      mustMatchPreferences
    ) as UploadPlanNode;
  else {
    tablePlan.toMany ??= {};
    tablePlan.toMany[fieldName] ??= mappingsTreeToUploadPlanTable(
      fieldData,
      mappingTable,
      mustMatchPreferences,
      false
    ) as UploadPlanNode;
  }
}

export const extractHeaderNameFromHeaderStructure = (
  headerStructure: MappingsTreeNode
): ColumnDefinition =>
  Object.entries(Object.values(headerStructure)[0]).map(
    ([headerName, headerOptions]) =>
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
  tableName: string,
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
  baseTableName: string,
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
