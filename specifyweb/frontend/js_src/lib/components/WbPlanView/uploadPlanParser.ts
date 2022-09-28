import type { MappingPath } from './Mapper';
import type { Tables } from '../DataModel/types';
import { strictGetModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { IR, RA, RR } from '../../utils/types';
import { defaultColumnOptions } from './linesGetter';
import type { SplitMappingPath } from './mappingHelpers';
import { formatToManyIndex, formatTreeRank } from './mappingHelpers';

export type MatchBehaviors = 'ignoreAlways' | 'ignoreNever' | 'ignoreWhenBlank';

export type ColumnOptions = {
  readonly matchBehavior: MatchBehaviors;
  readonly nullAllowed: boolean;
  readonly default: string | null;
};

export type ColumnDefinition =
  | string
  | (ColumnOptions & { readonly column: string });

export type NestedUploadTable = Omit<UploadTable, 'toMany'>;

export type UploadTable = {
  readonly wbcols: IR<ColumnDefinition>;
  readonly static: RR<never, never>;
  readonly toOne: IR<Uploadable>;
  readonly toMany: IR<RA<NestedUploadTable>>;
};

type UploadTableVariety =
  | { readonly mustMatchTable: UploadTable }
  | { readonly uploadTable: UploadTable };

export type TreeRecord = {
  readonly ranks: IR<string | { readonly treeNodeCols: IR<ColumnDefinition> }>;
};

type TreeRecordVariety =
  | { readonly mustMatchTreeRecord: TreeRecord }
  | { readonly treeRecord: TreeRecord };

export type Uploadable = TreeRecordVariety | UploadTableVariety;

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

/** A fix for https://github.com/specify/specify7/issues/1378 */
function resolveField(model: SpecifyModel, fieldName: string): RA<string> {
  const field = model.strictGetField(fieldName);
  if (field.isRelationship) {
    console.error('Upload plan has a column mapped to a relationship', {
      model,
      fieldName,
    });
    return [field.name, field.relatedModel.idField.name];
  }
  return [field.name];
}

const parseWbCols = (
  model: SpecifyModel,
  wbCols: IR<ColumnDefinition>,
  mappingPath: MappingPath
) =>
  Object.entries(wbCols).map(([fieldName, fieldData]) => ({
    mappingPath: [...mappingPath, ...resolveField(model, fieldName)],
    headerName: typeof fieldData === 'string' ? fieldData : fieldData.column,
    columnOptions:
      typeof fieldData === 'string'
        ? defaultColumnOptions
        : parseColumnOptions(fieldData),
  }));

const parseUploadTable = (
  model: SpecifyModel,
  uploadPlan: NestedUploadTable | UploadTable,
  makeMustMatch: (model: SpecifyModel) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> => [
  ...parseWbCols(model, uploadPlan.wbcols, mappingPath),
  ...Object.entries(uploadPlan.toOne).flatMap(([relationshipName, mappings]) =>
    parseUploadable(
      model.strictGetRelationship(relationshipName).relatedModel,
      mappings,
      makeMustMatch,
      [...mappingPath, model.strictGetRelationship(relationshipName).name]
    )
  ),
  ...('toMany' in uploadPlan
    ? Object.entries(uploadPlan.toMany).flatMap(
        ([relationshipName, mappings]) =>
          Object.values(mappings).flatMap((mapping, index) =>
            parseUploadTable(
              model.strictGetRelationship(relationshipName).relatedModel,
              mapping,
              makeMustMatch,
              [
                ...mappingPath,
                model.strictGetRelationship(relationshipName).name,
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
  readonly baseTable: SpecifyModel;
  readonly lines: RA<SplitMappingPath>;
  readonly mustMatchPreferences: RR<keyof Tables, boolean>;
} {
  const mustMatchTables = new Set<keyof Tables>();

  const makeMustMatch = (model: SpecifyModel): void =>
    void mustMatchTables.add(model.name);

  const baseTable = strictGetModel(uploadPlan.baseTableName);
  return {
    baseTable,
    lines: parseUploadable(baseTable, uploadPlan.uploadable, makeMustMatch, []),
    mustMatchPreferences: Object.fromEntries(
      Array.from(mustMatchTables, (tableName) => [tableName, true])
    ),
  };
}
