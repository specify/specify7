/*
*
* Helper class for converting from upload plan to mapping tree
* (internal structure used in wbplanview) and vice versa
*
* */

'use strict';

import dataModelStorage from './wbplanviewmodel';
import {
  formatReferenceItem,
  formatTreeRank,
  getNameFromTreeRankName,
  tableIsTree,
  valueIsReferenceItem,
  valueIsTreeRank,
}                       from './wbplanviewmodelhelper';
import { MappingsTree, MappingsTreeNode } from './wbplanviewtreehelper';
import { DataModelFieldWritable }          from './wbplanviewmodelfetcher';
import { defaultLineOptions } from './components/wbplanviewmapper';
import { getMappingLineData } from './wbplanviewnavigator';

export type MatchBehaviors = 'ignoreWhenBlank' | 'ignoreAlways' | 'ignoreNever';

export type ColumnOptions = {
    matchBehavior: MatchBehaviors,
    nullAllowed: boolean,
    default: string | null,
};


type ColumnDef = string | { column: string } & ColumnOptions;

type R<T> = Record<string, T>;

type ToMany = Omit<UploadTable, 'toMany'>

type FieldGroupType = 'wbcols' | 'static' | 'toOne' | 'toMany'

type FieldGroup<GROUP_NAME extends FieldGroupType> =
  GROUP_NAME extends 'wbcols' ? R<ColumnDef> :
    GROUP_NAME extends 'static' ? R<string | boolean | number> :
      GROUP_NAME extends 'toOne' ? Uploadable :
        ToMany

interface UploadTable {
  wbcols: R<ColumnDef>,
  static: R<string | boolean | number>,
  toOne: Uploadable,
  toMany: ToMany,
}

interface TreeRecord {
  ranks: R<string | {treeNodeCols: R<ColumnDef>}>
}

type UploadTableVariety =
  {'uploadTable': UploadTable}
  | {'oneToOneTable': UploadTable}
  | {'mustMatchTable': UploadTable};

type TreeRecordVariety =
  {'treeRecord': TreeRecord}
  | {'mustMatchTreeRecord': TreeRecord};

type Uploadable = UploadTableVariety | TreeRecordVariety;

export interface UploadPlan {
  baseTableName: string,
  uploadable: Uploadable
}

const excludeUnknownMatchingOptions = (
  matchingOptions: ColumnOptions,
)=>Object.fromEntries(
  Object.entries(defaultLineOptions).map(([optionName, defaultValue])=>
    [
      optionName,
      optionName in matchingOptions ?
        //@ts-ignore
        matchingOptions[optionName] :
        defaultValue
    ]
  )
) as ColumnOptions;

const uploadPlanProcessingFunctions = (
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[],
): Readonly<R<(
  [key, value]: [string, any],
) => [key: string, value: unknown]>> => (
  {
    wbcols: (
      [key, value]: [string, string | ColumnDef],
    ): [key: string, value: object] => [
      key,
      {
        [
          headers.indexOf(
            typeof value === 'string' ?
              value :
              value.column
          ) === -1 ?
            'newColumn' :
            'existingHeader'
          ]: typeof value === 'string' ?
            {
              [value]: defaultLineOptions,
            } :
            {
              [value.column]: excludeUnknownMatchingOptions(value)
            },
      },
    ],
    static: ([key, value]: [string, string]): [key: string, value: object] => [
      key,
      {newStaticColumn: value},
    ],
    toOne: (
      [tableName, value]: [string, Uploadable],
    ): [key: string, value: object] => [
      tableName,
      handleUploadable(
        value,
        headers,
        mustMatchPreferences,
        [...mappingPath, tableName],
      ),
    ],
    toMany: (
      [tableName, mappings]: [string, object],
    ): [key: string, value: object] => [
      tableName,
      Object.fromEntries(
        Object.values(
          mappings,
        ).map((mapping, index) =>
          [
            formatReferenceItem(index + 1),
            handleUploadTableTable(
              mapping,
              headers,
              mustMatchPreferences,
              [...mappingPath, tableName],
            ),
          ],
        ),
      ),
    ],
  }
) as const;

const handleTreeRankFields = (
  treeRankFields: R<ColumnDef>,
  headers: string[],
) => Object.fromEntries(
  Object.entries(treeRankFields).map(
    ([fieldName, headerName]) =>
      uploadPlanProcessingFunctions(
        headers, {}, [],
      ).wbcols([fieldName, headerName]),
  ),
);

const handleTreeRecord = (
  uploadPlan: TreeRecord,
  headers: string[],
) =>
  Object.fromEntries(
    Object.entries((
      (
        uploadPlan
      ).ranks
    )).map(([
        rankName,
        rankData,
      ]) =>
        [
          formatTreeRank(rankName),
          handleTreeRankFields(
            typeof rankData === 'string' ?
              {
                name: rankData,
              } :
              rankData.treeNodeCols,
            headers,
          ),
        ],
    ),
  );

function handleTreeRecordTypes(
  uploadPlan: TreeRecordVariety,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[],
) {

  if ('mustMatchTreeRecord' in uploadPlan) {
    const tableName = getMappingLineData({
      baseTableName: mappingPath[0],
      mappingPath: mappingPath.slice(1),
      iterate: false,
      customSelectType: 'OPENED_LIST',
    })[0].tableName;
    mustMatchPreferences[tableName || mappingPath.slice(-1)[0]] = true;
  }

  return handleTreeRecord(
    Object.values(uploadPlan)[0],
    headers,
  );

}


const handleUploadTableTable = (
  uploadPlan: UploadTable,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[],
) =>
  Object.fromEntries(Object.entries(uploadPlan).reduce(
    // @ts-ignore
    (
      results,
      [
        planNodeName,
        planNodeData,
      ]: [
        FieldGroupType,
        FieldGroup<FieldGroupType>
      ],
    ) =>
      [
        ...results,
        ...Object.entries(planNodeData).map(
          uploadPlanProcessingFunctions(
            headers,
            mustMatchPreferences,
            mappingPath,
          )[planNodeName],
        ),
      ],
    [],
  ));

function handleUploadableTypes(
  uploadPlan: UploadTableVariety,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[],
) {

  if ('mustMatchTable' in uploadPlan) {
    const tableName = getMappingLineData({
      baseTableName: mappingPath[0],
      mappingPath: mappingPath.slice(1),
      iterate: false,
      customSelectType: 'OPENED_LIST',
    })[0].tableName;
    mustMatchPreferences[tableName || mappingPath.slice(-1)[0]] = true;
  }

  return handleUploadTableTable(
    Object.values(uploadPlan)[0],
    headers,
    mustMatchPreferences,
    mappingPath,
  );

}

const handleUploadable = (
  uploadPlan: Uploadable,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[],
): MappingsTree =>
  'treeRecord' in uploadPlan || 'mustMatchTreeRecord' in uploadPlan ?
    handleTreeRecordTypes(
      uploadPlan,
      headers,
      mustMatchPreferences,
      mappingPath,
    ) :
    handleUploadableTypes(
      uploadPlan,
      headers,
      mustMatchPreferences,
      mappingPath,
    );

/*
* Converts upload plan to mappings tree
* Inverse of mappingsTreeToUploadPlan
* */
export function uploadPlanToMappingsTree(
  headers: string[],
  uploadPlan: UploadPlan,
): {
  baseTableName: string,
  mappingsTree: MappingsTree,
  mustMatchPreferences: R<boolean>
} {

  if (typeof uploadPlan.baseTableName === 'undefined')
    throw new Error('Upload plan should contain `baseTableName`'
      + ' as a root node');

  const mustMatchPreferences: R<boolean> = {};

  return {
    baseTableName: uploadPlan.baseTableName,
    mappingsTree: handleUploadable(
      uploadPlan.uploadable,
      headers,
      mustMatchPreferences,
      [uploadPlan.baseTableName],
    ),
    mustMatchPreferences: mustMatchPreferences,
  };
}

export function uploadPlanStringToObject(
  uploadPlanString: string,
): UploadPlan | null {
  let uploadPlan: UploadPlan | null;

  try {
    uploadPlan = JSON.parse(uploadPlanString) as UploadPlan;
  }
  catch (exception) {

    if (!(
      exception instanceof SyntaxError
    ))//only catch JSON parse errors
      throw exception;

    return null;

  }

  if (
    typeof uploadPlan !== 'object' ||
    uploadPlan === null ||
    typeof uploadPlan['baseTableName'] === 'undefined'
  )
    return null;
  else
    return uploadPlan;
}


//TODO: make these functions type safe

interface UploadPlanNode
  extends R<string | boolean | UploadPlanNode> {
}

function mappingsTreeToUploadPlanTable(
  tableData: object,
  tableName: string | undefined,
  mustMatchPreferences: R<boolean>,
  wrapIt = true,
  isRoot = false,
) {

  if (typeof tableName !== 'undefined' && tableIsTree(tableName))
    return mappingsTreeToUploadTable(
      tableData as MappingsTree,
      tableName,
      mustMatchPreferences,
    );

  let tablePlan: {
    wbcols: UploadPlanNode,
    static: UploadPlanNode,
    toOne: UploadPlanNode,
    toMany?: UploadPlanNode
  } = {
    wbcols: {},
    static: {},
    toOne: {},
  };

  if (wrapIt)
    tablePlan.toMany = {};

  let isToMany = false;

  tablePlan = Object.entries(
    tableData,
  ).reduce((
    originalTablePlan,
    [
      fieldName,
      fieldData,
    ],
  ) => {

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
          false,
        ),
      );

    }
    else if (valueIsTreeRank(fieldName))
      //@ts-ignore
      tablePlan = mappingsTreeToUploadPlanTable(
        tableData,
        tableName,
        mustMatchPreferences,
        false,
      );

    else if (
      typeof dataModelStorage.tables[
      tableName || ''
        ]?.fields[fieldName] !== 'undefined' &&
      typeof tablePlan !== 'undefined'
    ) {

      const field = dataModelStorage.tables[
      tableName || ''
        ]?.fields[fieldName];

      if (field.isRelationship)
        handleRelationshipField(
          fieldData,
          field,
          fieldName,
          tablePlan,
          mustMatchPreferences,
        );
      else
        //@ts-ignore
        tablePlan[
          Object.entries(
            fieldData,
          )[0][0] === 'newStaticColumn' ?
            'static' :
            'wbcols'
          ][fieldName] = extractHeaderNameFromHeaderStructure(
          fieldData,
        );
    }


    return tablePlan;

  }, tablePlan);


  if (Array.isArray(tablePlan) || !wrapIt)
    return tablePlan;

  if (valueIsReferenceItem(Object.keys(tableData)[0]))
    return tablePlan;

  return {
    [
      !isRoot && mustMatchPreferences[tableName || ''] ?
        'mustMatchTable' :
        'uploadTable'
      ]: tablePlan,
  };

}

function handleRelationshipField(
  fieldData: object,
  field: DataModelFieldWritable,
  fieldName: string,
  tablePlan: {
    wbcols: UploadPlanNode,
    static: UploadPlanNode,
    toOne: UploadPlanNode,
    toMany?: UploadPlanNode | undefined
  },
  mustMatchPreferences: R<boolean>,
) {
  const mappingTable = field.tableName;
  if (typeof mappingTable === 'undefined')
    throw new Error('Mapping Table is not defined');

  const isToOne =
    field.type === 'one-to-one' ||
    field.type === 'many-to-one';

  if (
    isToOne &&
    typeof tablePlan.toOne[fieldName] === 'undefined'
  )
    tablePlan.toOne[fieldName] =
      mappingsTreeToUploadPlanTable(
        fieldData,
        mappingTable,
        mustMatchPreferences,
      ) as UploadPlanNode;

  else {
    tablePlan.toMany ??= {};
    tablePlan.toMany[fieldName] ??=
      mappingsTreeToUploadPlanTable(
        fieldData,
        mappingTable,
        mustMatchPreferences,
        false,
      ) as UploadPlanNode;
  }
}


export const extractHeaderNameFromHeaderStructure = (
  headerStructure: MappingsTreeNode,
): ColumnDef => Object.entries(
  Object.values(
    headerStructure,
  )[0],
).map(([headerName, headerOptions]) =>
  JSON.stringify(headerOptions) === JSON.stringify(defaultLineOptions) ?
    headerName :
    {
      ...defaultLineOptions,
      column: headerName,
      ...headerOptions,
    },
)[0];

const rankMappedFieldsToTreeRecordRanks = (
  rankMappedFields: R<MappingsTreeNode>,
): R<ColumnDef> => Object.fromEntries(
  Object.entries(rankMappedFields).map(([
    fieldName, headerMappingStructure,
  ]) => [
    fieldName,
    extractHeaderNameFromHeaderStructure(
      headerMappingStructure,
    ),
  ]),
);

const mappingsTreeToUploadPlanTree = (
  mappingsTree: MappingsTree,
): R<string | {treeNodeCols: R<ColumnDef>}> => Object.fromEntries(
  Object.entries(mappingsTree).map(([
    fullRankName, rankMappedFields,
  ]) => [
    getNameFromTreeRankName(fullRankName),
    {
      treeNodeCols: rankMappedFieldsToTreeRecordRanks(
        rankMappedFields as R<MappingsTreeNode>,
      ),
    },
  ]),
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
  isRoot = false,
): Uploadable =>
  tableIsTree(tableName) ?
    {
      [
        (
          tableName in mustMatchPreferences
        ) ?
          'mustMatchTreeRecord' :
          'treeRecord'
        ]: {
        ranks: mappingsTreeToUploadPlanTree(
          mappingsTree,
        ),
      },
    } as TreeRecordVariety :
    mappingsTreeToUploadPlanTable(
      mappingsTree,
      tableName,
      mustMatchPreferences,
      true,
      isRoot,
    ) as Uploadable;

/*
* Converts mappings tree to upload plan
* Inverse of uploadPlanToMappingsTree
* */
export const mappingsTreeToUploadPlan = (
  baseTableName: string,
  mappingsTree: MappingsTree,
  mustMatchPreferences: R<boolean>,
): UploadPlan => (
  {
    baseTableName: baseTableName,
    uploadable: mappingsTreeToUploadTable(
      mappingsTree,
      baseTableName,
      mustMatchPreferences,
      true,
    ),
  }
);
