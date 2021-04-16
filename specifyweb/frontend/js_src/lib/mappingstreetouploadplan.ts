/*
 *
 * Helper class for converting from upload plan to mapping tree
 * (internal structure used in wbplanview) and vice versa
 *
 * */

'use strict';

import { R } from './components/wbplanview';
import {
  ColumnDef,
  TreeRecordVariety,
  Uploadable,
  UploadPlan,
} from './uploadplantomappingstree';
import { defaultLineOptions } from './wbplanviewlinesgetter';
import dataModelStorage from './wbplanviewmodel';
import {
  getNameFromTreeRankName,
  tableIsTree,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmodelhelper';
import { MappingsTree, MappingsTreeNode } from './wbplanviewtreehelper';
import { DataModelFieldWritable } from './wbplanviewmodelfetcher';

//TODO: make these functions type safe

interface UploadPlanNode
  extends R<string | boolean | UploadPlanNode | ColumnDef> {}

function mappingsTreeToUploadPlanTable(
  tableData: object,
  tableName: string | undefined,
  mustMatchPreferences: R<boolean>,
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
          //@ts-ignore
          tablePlan = [];
        }

        //@ts-ignore
        tablePlan.push(
          mappingsTreeToUploadPlanTable(
            fieldData,
            tableName,
            mustMatchPreferences,
            false
          )
        );
      } else if (valueIsTreeRank(fieldName))
        //@ts-ignore
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
  mustMatchPreferences: R<boolean>
) {
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
      JSON.stringify(headerOptions) === JSON.stringify(defaultLineOptions)
        ? headerName
        : {
            ...defaultLineOptions,
            column: headerName,
            ...headerOptions,
          }
  )[0];

const rankMappedFieldsToTreeRecordRanks = (
  rankMappedFields: R<MappingsTreeNode>
): R<ColumnDef> =>
  Object.fromEntries(
    Object.entries(
      rankMappedFields
    ).map(([fieldName, headerMappingStructure]) => [
      fieldName,
      extractHeaderNameFromHeaderStructure(headerMappingStructure),
    ])
  );

const mappingsTreeToUploadPlanTree = (
  mappingsTree: MappingsTree
): R<string | { treeNodeCols: R<ColumnDef> }> =>
  Object.fromEntries(
    Object.entries(mappingsTree).map(([fullRankName, rankMappedFields]) => [
      getNameFromTreeRankName(fullRankName),
      {
        treeNodeCols: rankMappedFieldsToTreeRecordRanks(
          rankMappedFields as R<MappingsTreeNode>
        ),
      },
    ])
  );

/*const mappingsTreeToUploadTableTable = (
  mappingsTree: MappingsTree,
  tableName: string,
): UploadPlanUploadTableTable => (
  {}
);*/

const mappingsTreeToUploadTable = (
  mappingsTree: MappingsTree,
  tableName: string,
  mustMatchPreferences: R<boolean>,
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

/*
 * Converts mappings tree to upload plan
 * Inverse of uploadPlanToMappingsTree
 * */
export const mappingsTreeToUploadPlan = (
  baseTableName: string,
  mappingsTree: MappingsTree,
  mustMatchPreferences: R<boolean>
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
