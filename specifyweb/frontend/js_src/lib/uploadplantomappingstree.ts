import { R } from './components/wbplanview';
import { defaultLineOptions } from './wbplanviewlinesgetter';
import { formatReferenceItem, formatTreeRank } from './wbplanviewmodelhelper';
import { getMappingLineData } from './wbplanviewnavigator';
import { MappingsTree } from './wbplanviewtreehelper';

export type MatchBehaviors = 'ignoreWhenBlank' | 'ignoreAlways' | 'ignoreNever';

export type ColumnOptions = {
  matchBehavior: MatchBehaviors;
  nullAllowed: boolean;
  default: string | null;
};

export type ColumnDef = string | ({ column: string } & ColumnOptions);

type ToMany = Omit<UploadTable, 'toMany'>;

type FieldGroupType = 'wbcols' | 'static' | 'toOne' | 'toMany';

type FieldGroup<GROUP_NAME extends FieldGroupType> = GROUP_NAME extends 'wbcols'
  ? R<ColumnDef>
  : GROUP_NAME extends 'static'
  ? R<string | boolean | number>
  : GROUP_NAME extends 'toOne'
  ? Uploadable
  : ToMany;

interface UploadTable {
  wbcols: R<ColumnDef>;
  static: R<string | boolean | number>;
  toOne: Uploadable;
  toMany: ToMany;
}

interface TreeRecord {
  ranks: R<string | { treeNodeCols: R<ColumnDef> }>;
}

type UploadTableVariety =
  | { uploadTable: UploadTable }
  | { oneToOneTable: UploadTable }
  | { mustMatchTable: UploadTable };

export type TreeRecordVariety =
  | { treeRecord: TreeRecord }
  | { mustMatchTreeRecord: TreeRecord };

export type Uploadable = UploadTableVariety | TreeRecordVariety;

export interface UploadPlan {
  baseTableName: string;
  uploadable: Uploadable;
}

const excludeUnknownMatchingOptions = (matchingOptions: ColumnOptions) =>
  Object.fromEntries(
    Object.entries(defaultLineOptions).map(([optionName, defaultValue]) => [
      optionName,
      optionName in matchingOptions
        ? //@ts-ignore
          matchingOptions[optionName]
        : defaultValue,
    ])
  ) as ColumnOptions;

const uploadPlanProcessingFunctions = (
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[]
): Readonly<
  R<([key, value]: [string, any]) => [key: string, value: unknown]>
> =>
  ({
    wbcols: ([key, value]: [string, string | ColumnDef]): [
      key: string,
      value: object
    ] => [
      key,
      {
        [headers.indexOf(typeof value === 'string' ? value : value.column) ===
        -1
          ? 'newColumn'
          : 'existingHeader']:
          typeof value === 'string'
            ? {
                [value]: defaultLineOptions,
              }
            : {
                [value.column]: excludeUnknownMatchingOptions(value),
              },
      },
    ],
    static: ([key, value]: [string, string]): [key: string, value: object] => [
      key,
      { newStaticColumn: value },
    ],
    toOne: ([tableName, value]: [string, Uploadable]): [
      key: string,
      value: object
    ] => [
      tableName,
      handleUploadable(value, headers, mustMatchPreferences, [
        ...mappingPath,
        tableName,
      ]),
    ],
    toMany: ([tableName, mappings]: [string, object]): [
      key: string,
      value: object
    ] => [
      tableName,
      Object.fromEntries(
        Object.values(mappings).map((mapping, index) => [
          formatReferenceItem(index + 1),
          handleUploadTableTable(mapping, headers, mustMatchPreferences, [
            ...mappingPath,
            tableName,
          ]),
        ])
      ),
    ],
  } as const);

const handleTreeRankFields = (
  treeRankFields: R<ColumnDef>,
  headers: string[]
) =>
  Object.fromEntries(
    Object.entries(treeRankFields).map(([fieldName, headerName]) =>
      uploadPlanProcessingFunctions(headers, {}, []).wbcols([
        fieldName,
        headerName,
      ])
    )
  );

const handleTreeRecord = (uploadPlan: TreeRecord, headers: string[]) =>
  Object.fromEntries(
    Object.entries(uploadPlan.ranks).map(([rankName, rankData]) => [
      formatTreeRank(rankName),
      handleTreeRankFields(
        typeof rankData === 'string'
          ? {
              name: rankData,
            }
          : rankData.treeNodeCols,
        headers
      ),
    ])
  );

function handleTreeRecordTypes(
  uploadPlan: TreeRecordVariety,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[]
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

  return handleTreeRecord(Object.values(uploadPlan)[0], headers);
}

const handleUploadTableTable = (
  uploadPlan: UploadTable,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[]
) =>
  Object.fromEntries(
    Object.entries(uploadPlan).reduce(
      // @ts-ignore
      (
        results,
        [planNodeName, planNodeData]: [
          FieldGroupType,
          FieldGroup<FieldGroupType>
        ]
      ) => [
        ...results,
        ...Object.entries(planNodeData).map(
          uploadPlanProcessingFunctions(
            headers,
            mustMatchPreferences,
            mappingPath
          )[planNodeName]
        ),
      ],
      []
    )
  );

function handleUploadableTypes(
  uploadPlan: UploadTableVariety,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[]
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
    mappingPath
  );
}

const handleUploadable = (
  uploadPlan: Uploadable,
  headers: string[],
  mustMatchPreferences: R<boolean>,
  mappingPath: string[]
): MappingsTree =>
  'treeRecord' in uploadPlan || 'mustMatchTreeRecord' in uploadPlan
    ? handleTreeRecordTypes(
        uploadPlan,
        headers,
        mustMatchPreferences,
        mappingPath
      )
    : handleUploadableTypes(
        uploadPlan,
        headers,
        mustMatchPreferences,
        mappingPath
      );

/*
 * Converts upload plan to mappings tree
 * Inverse of mappingsTreeToUploadPlan
 * */
export function uploadPlanToMappingsTree(
  headers: string[],
  uploadPlan: UploadPlan
): {
  baseTableName: string;
  mappingsTree: MappingsTree;
  mustMatchPreferences: R<boolean>;
} {
  if (typeof uploadPlan.baseTableName === 'undefined')
    throw new Error(
      'Upload plan should contain `baseTableName`' + ' as a root node'
    );

  const mustMatchPreferences: R<boolean> = {};

  return {
    baseTableName: uploadPlan.baseTableName,
    mappingsTree: handleUploadable(
      uploadPlan.uploadable,
      headers,
      mustMatchPreferences,
      [uploadPlan.baseTableName]
    ),
    mustMatchPreferences,
  };
}

export function uploadPlanStringToObject(
  uploadPlanString: string
): UploadPlan | null {
  let uploadPlan: UploadPlan | null;

  try {
    uploadPlan = JSON.parse(uploadPlanString) as UploadPlan;
  } catch (exception) {
    if (!(exception instanceof SyntaxError))
      //only catch JSON parse errors
      throw exception;

    return null;
  }

  if (
    typeof uploadPlan !== 'object' ||
    uploadPlan === null ||
    typeof uploadPlan['baseTableName'] === 'undefined'
  )
    return null;
  else return uploadPlan;
}
