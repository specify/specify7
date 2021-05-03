import type { IR, R } from './components/wbplanview';
import { defaultColumnOptions } from './wbplanviewlinesgetter';
import { formatReferenceItem, formatTreeRank } from './wbplanviewmodelhelper';
import { getMappingLineData } from './wbplanviewnavigator';
import type { MappingsTree } from './wbplanviewtreehelper';

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
  ? IR<ColumnDef>
  : GROUP_NAME extends 'static'
  ? IR<string | boolean | number>
  : GROUP_NAME extends 'toOne'
  ? Uploadable
  : ToMany;

interface UploadTable {
  wbcols: IR<ColumnDef>;
  static: IR<string | boolean | number>;
  toOne: Uploadable;
  toMany: ToMany;
}

interface TreeRecord {
  ranks: IR<string | { treeNodeCols: IR<ColumnDef> }>;
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

const excludeUnknownMatchingOptions = (
  matchingOptions: Readonly<ColumnOptions>
) =>
  Object.fromEntries(
    Object.entries(defaultColumnOptions).map(([optionName, defaultValue]) => [
      optionName,
      optionName in matchingOptions
        ? // @ts-expect-error
          matchingOptions[optionName]
        : defaultValue,
    ])
  ) as ColumnOptions;

const uploadPlanProcessingFunctions = (
  headers: Readonly<string[]>,
  mustMatchPreferences: IR<boolean>,
  mappingPath: Readonly<string[]>
): Readonly<
  IR<([key, value]: [string, any]) => [key: string, value: unknown]>
> =>
  ({
    wbcols: ([key, value]: [string, string | ColumnDef]): [
      key: string,
      value: object
    ] => [
      key,
      {
        existingHeader:
          typeof value === 'string'
            ? {
                [value]: defaultColumnOptions,
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
  treeRankFields: IR<ColumnDef>,
  headers: Readonly<string[]>
) =>
  Object.fromEntries(
    Object.entries(treeRankFields).map(([fieldName, headerName]) =>
      uploadPlanProcessingFunctions(headers, {}, []).wbcols([
        fieldName,
        headerName,
      ])
    )
  );

const handleTreeRecord = (
  uploadPlan: Readonly<TreeRecord>,
  headers: Readonly<string[]>
) =>
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
  headers: Readonly<string[]>,
  mustMatchPreferences: R<boolean>,
  mappingPath: string[]
): ReturnType<typeof handleTreeRecord> {
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
  headers: Readonly<string[]>,
  mustMatchPreferences: IR<boolean>,
  mappingPath: string[]
) =>
  Object.fromEntries(
    Object.entries(uploadPlan).reduce(
      // @ts-expect-error
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
  headers: Readonly<string[]>,
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
  headers: Readonly<string[]>,
  mustMatchPreferences: IR<boolean>,
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
 *
 */
export function uploadPlanToMappingsTree(
  headers: Readonly<string[]>,
  uploadPlan: UploadPlan
): {
  baseTableName: string;
  mappingsTree: MappingsTree;
  mustMatchPreferences: IR<boolean>;
} {
  if (typeof uploadPlan.baseTableName === 'undefined')
    throw new Error(
      'Upload plan should contain `baseTableName` as a root node'
    );

  const mustMatchPreferences: IR<boolean> = {};

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
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError))
      // Only catch JSON parse errors
      throw error;

    return null;
  }

  return typeof uploadPlan !== 'object' ||
    uploadPlan === null ||
    typeof uploadPlan.baseTableName === 'undefined'
    ? null
    : uploadPlan;
}
