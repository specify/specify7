import type { MappingPath } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { getModel } from './schema';
import type { SpecifyModel } from './specifymodel';
import type { IR, RA, RR } from './types';
import { defined } from './types';
import { defaultColumnOptions } from './wbplanviewlinesgetter';
import type { SplitMappingPath } from './wbplanviewmappinghelper';
import { formatToManyIndex, formatTreeRank } from './wbplanviewmappinghelper';

export type MatchBehaviors = 'ignoreWhenBlank' | 'ignoreAlways' | 'ignoreNever';

export type ColumnOptions = {
  readonly matchBehavior: MatchBehaviors;
  readonly nullAllowed: boolean;
  readonly default: string | null;
};

export type ColumnDefinition = string | ({ column: string } & ColumnOptions);

export type NestedUploadTable = Omit<UploadTable, 'toMany'>;

export type UploadTable = {
  readonly wbcols: IR<ColumnDefinition>;
  readonly static: RR<never, never>;
  readonly toOne: IR<Uploadable>;
  readonly toMany: IR<RA<NestedUploadTable>>;
};

type UploadTableVariety =
  | { readonly uploadTable: UploadTable }
  | { readonly mustMatchTable: UploadTable };

export type TreeRecord = {
  readonly ranks: IR<string | { treeNodeCols: IR<ColumnDefinition> }>;
};

type TreeRecordVariety =
  | { readonly treeRecord: TreeRecord }
  | { readonly mustMatchTreeRecord: TreeRecord };

export type Uploadable = UploadTableVariety | TreeRecordVariety;

export type UploadPlan = {
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly uploadable: Uploadable;
};

const parseColumnOptions = (matchingOptions: ColumnOptions): ColumnOptions => ({
  ...defaultColumnOptions,
  ...(Object.fromEntries(
    Object.entries(matchingOptions).filter(
      ([optionName]) => optionName in defaultColumnOptions
    )
  ) as Partial<ColumnOptions>),
});

const parseTree = (
  model: SpecifyModel,
  uploadPlan: TreeRecord,
  mappingPath: MappingPath
): RA<SplitMappingPath> =>
  Object.entries(uploadPlan.ranks).flatMap(([rankName, rankData]) =>
    parseWbCols(
      model,
      typeof rankData === 'string'
        ? {
            name: rankData,
          }
        : rankData.treeNodeCols,
      [...mappingPath, formatTreeRank(rankName)]
    )
  );

function parseTreeTypes(
  model: SpecifyModel,
  uploadPlan: TreeRecordVariety,
  makeMustMatch: (model: SpecifyModel) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> {
  if ('mustMatchTreeRecord' in uploadPlan) makeMustMatch(model);

  return parseTree(model, Object.values(uploadPlan)[0], mappingPath);
}

const parseWbCols = (
  model: SpecifyModel,
  wbCols: IR<ColumnDefinition>,
  mappingPath: MappingPath
) =>
  Object.entries(wbCols).map(([fieldName, fieldData]) => ({
    mappingPath: [
      ...mappingPath,
      defined(model.getLiteralField(fieldName)).name,
    ],
    headerName: typeof fieldData === 'string' ? fieldData : fieldData.column,
    columnOptions:
      typeof fieldData === 'string'
        ? defaultColumnOptions
        : parseColumnOptions(fieldData),
  }));

const parseUploadTable = (
  model: SpecifyModel,
  uploadPlan: UploadTable | NestedUploadTable,
  makeMustMatch: (model: SpecifyModel) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> => [
  ...parseWbCols(model, uploadPlan.wbcols, mappingPath),
  ...Object.entries(uploadPlan.toOne).flatMap(([relationshipName, mappings]) =>
    parseUploadable(
      defined(model.getRelationship(relationshipName)).relatedModel,
      mappings,
      makeMustMatch,
      [...mappingPath, defined(model.getRelationship(relationshipName)).name]
    )
  ),
  ...('toMany' in uploadPlan
    ? Object.entries(uploadPlan.toMany).flatMap(
        ([relationshipName, mappings]) =>
          Object.values(mappings).flatMap((mapping, index) =>
            parseUploadTable(
              defined(model.getRelationship(relationshipName)).relatedModel,
              mapping,
              makeMustMatch,
              [
                ...mappingPath,
                defined(model.getRelationship(relationshipName)).name,
                formatToManyIndex(index + 1),
              ]
            )
          )
      )
    : []),
];

function parseUploadTableTypes(
  model: SpecifyModel,
  uploadPlan: UploadTableVariety,
  makeMustMatch: (model: SpecifyModel) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> {
  if ('mustMatchTable' in uploadPlan) makeMustMatch(model);

  return parseUploadTable(
    model,
    Object.values(uploadPlan)[0],
    makeMustMatch,
    mappingPath
  );
}

const parseUploadable = (
  model: SpecifyModel,
  uploadPlan: Uploadable,
  makeMustMatch: (model: SpecifyModel) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> =>
  'treeRecord' in uploadPlan || 'mustMatchTreeRecord' in uploadPlan
    ? parseTreeTypes(model, uploadPlan, makeMustMatch, mappingPath)
    : parseUploadTableTypes(model, uploadPlan, makeMustMatch, mappingPath);

/**
 * Break down upload plan into components that are easier to manipulate
 */
export function parseUploadPlan(uploadPlan: UploadPlan): {
  baseTable: SpecifyModel;
  lines: RA<SplitMappingPath>;
  mustMatchPreferences: RR<keyof Tables, boolean>;
} {
  const mustMatchTables: Set<keyof Tables> = new Set();

  const makeMustMatch = (model: SpecifyModel): void =>
    void mustMatchTables.add(model.name);

  const baseTable = defined(getModel(uploadPlan.baseTableName));
  return {
    baseTable,
    lines: parseUploadable(baseTable, uploadPlan.uploadable, makeMustMatch, []),
    mustMatchPreferences: Object.fromEntries(
      Array.from(mustMatchTables, (tableName) => [tableName, true])
    ),
  };
}
