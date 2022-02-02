/**
 * Upload Plan to Mappings Tree
 *
 * @module
 *
 */

import type { MappingPath } from './components/wbplanviewmapper';
import type { IR, R, RA } from './types';
import { defaultColumnOptions } from './wbplanviewlinesgetter';
import { formatReferenceItem, formatTreeRank } from './wbplanviewmappinghelper';
import { getTableFromMappingPath } from './wbplanviewnavigator';
import type { MappingsTree } from './wbplanviewtreehelper';

export type MatchBehaviors = 'ignoreWhenBlank' | 'ignoreAlways' | 'ignoreNever';

export type ColumnOptions = {
  readonly matchBehavior: MatchBehaviors;
  readonly nullAllowed: boolean;
  readonly default: string | null;
};

export type ColumnDefinition = string | ({ column: string } & ColumnOptions);

type ToMany = Omit<UploadTable, 'toMany'>;

type FieldGroupType = 'wbcols' | 'static' | 'toOne' | 'toMany';

type FieldGroup<GROUP_NAME extends FieldGroupType> = GROUP_NAME extends 'wbcols'
  ? IR<ColumnDefinition>
  : GROUP_NAME extends 'static'
  ? IR<string | boolean | number>
  : GROUP_NAME extends 'toOne'
  ? Uploadable
  : ToMany;

interface UploadTable {
  readonly wbcols: IR<ColumnDefinition>;
  readonly static: IR<string | boolean | number>;
  readonly toOne: Uploadable;
  readonly toMany: ToMany;
}

type TreeRecord = {
  readonly ranks: IR<string | { treeNodeCols: IR<ColumnDefinition> }>;
};

type UploadTableVariety =
  | { readonly uploadTable: UploadTable }
  | { readonly oneToOneTable: UploadTable }
  | { readonly mustMatchTable: UploadTable };

export type TreeRecordVariety =
  | { readonly treeRecord: TreeRecord }
  | { readonly mustMatchTreeRecord: TreeRecord };

export type Uploadable = UploadTableVariety | TreeRecordVariety;

export type UploadPlan = {
  readonly baseTableName: string;
  readonly uploadable: Uploadable;
};

const excludeUnknownMatchingOptions = (matchingOptions: ColumnOptions) =>
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
  headers: RA<string>,
  mustMatchPreferences: IR<boolean>,
  mappingPath: MappingPath
): IR<([key, value]: [string, any]) => [key: string, value: unknown]> =>
  ({
    wbcols: ([key, value]: [string, string | ColumnDefinition]): [
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
  treeRankFields: IR<ColumnDefinition>,
  headers: RA<string>
) =>
  Object.fromEntries(
    Object.entries(treeRankFields).map(([fieldName, headerName]) =>
      uploadPlanProcessingFunctions(headers, {}, []).wbcols([
        fieldName,
        headerName,
      ])
    )
  );

const handleTreeRecord = (uploadPlan: TreeRecord, headers: RA<string>) =>
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
  headers: RA<string>,
  mustMatchPreferences: R<boolean>,
  mappingPath: MappingPath
): ReturnType<typeof handleTreeRecord> {
  if ('mustMatchTreeRecord' in uploadPlan) {
    const tableName = getTableFromMappingPath(
      mappingPath[0],
      mappingPath.slice(1)
    );
    mustMatchPreferences[tableName || mappingPath.slice(-1)[0]] = true;
  }

  return handleTreeRecord(Object.values(uploadPlan)[0], headers);
}

const handleUploadTableTable = (
  uploadPlan: UploadTable,
  headers: RA<string>,
  mustMatchPreferences: IR<boolean>,
  mappingPath: MappingPath
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
  headers: RA<string>,
  mustMatchPreferences: R<boolean>,
  mappingPath: MappingPath
) {
  if ('mustMatchTable' in uploadPlan) {
    const tableName = getTableFromMappingPath(
      mappingPath[0],
      mappingPath.slice(1)
    );
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
  headers: RA<string>,
  mustMatchPreferences: IR<boolean>,
  mappingPath: MappingPath
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

/**
 * Converts upload plan to mappings tree
 * Inverse of mappingsTreeToUploadPlan
 */
export function uploadPlanToMappingsTree(
  headers: RA<string>,
  uploadPlan: UploadPlan
): {
  baseTableName: string;
  mappingsTree: MappingsTree;
  mustMatchPreferences: IR<boolean>;
} {
  if (typeof uploadPlan.baseTableName === 'undefined')
    throw new Error(
      'Upload Plan should contain `baseTableName` as a root node'
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
