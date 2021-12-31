/**
 * Helper function for converting from mapping tree
 * (internal structure used in WbPlanView) to upload plan
 *
 * @module
 */

import type { IR, R } from './types';
import type {
  ColumnDef,
  TreeRecordVariety,
  Uploadable,
  UploadPlan,
} from './uploadplantomappingstree';
import { defaultColumnOptions } from './wbplanviewlinesgetter';
import {
  getNameFromTreeRankName,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import dataModelStorage from './wbplanviewmodel';
import type { DataModelFieldWritable } from './wbplanviewmodelfetcher';
import { tableIsTree } from './wbplanviewmodelhelper';
import type { MappingsTree, MappingsTreeNode } from './wbplanviewtreehelper';

interface UploadPlanNode
  extends R<string | boolean | UploadPlanNode | ColumnDef> {}

function mappingsTreeToUploadPlanTable(
  tableData: object,
  tableName: string | undefined,
  mustMatchPreferences: IR<boolean>,
  wrapIt = true,
  isRoot = false
) {
  if (typeof tableName !== 'undefined' && tableIsTree(tableName))
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

      if (valueIsReferenceItem(fieldName)) {
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
        typeof dataModelStorage.tables[tableName || '']?.fields[fieldName] !==
          'undefined' &&
        typeof tablePlan !== 'undefined'
      ) {
        const field =
          dataModelStorage.tables[tableName || '']?.fields[fieldName];

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

  if (valueIsReferenceItem(Object.keys(tableData)[0])) return tablePlan;

  return {
    [!isRoot && mustMatchPreferences[tableName || '']
      ? 'mustMatchTable'
      : 'uploadTable']: tablePlan,
  };
}

function handleRelationshipField(
  fieldData: object,
  field: DataModelFieldWritable,
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
): ColumnDef =>
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
): IR<ColumnDef> =>
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
): IR<string | { treeNodeCols: IR<ColumnDef> }> =>
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
  tableIsTree(tableName)
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
