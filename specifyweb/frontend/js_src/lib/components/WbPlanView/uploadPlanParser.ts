import type { IR, RA, RR } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { getTreeDefinitions } from '../InitialContext/treeRanks';
import { defaultColumnOptions } from './linesGetter';
import type { MappingPath } from './Mapper';
import { getRankNameWithoutTreeId, SplitMappingPath } from './mappingHelpers';
import { formatTreeDefinition } from './mappingHelpers';
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
  readonly ranks: IR<
    | string
    | { readonly treeNodeCols: IR<ColumnDefinition>; readonly treeId?: number }
  >;
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
  table: SpecifyTable,
  uploadPlan: TreeRecord,
  mappingPath: MappingPath
): RA<SplitMappingPath> =>
  Object.entries(uploadPlan.ranks).flatMap(([rankName, rankData]) =>
    parseWbCols(
      table,
      typeof rankData === 'string'
        ? {
            name: rankData,
          }
        : rankData.treeNodeCols,
      [
        ...mappingPath,
        ...(typeof rankData === 'object' &&
        typeof rankData.treeId === 'number' &&
        getTreeDefinitions('Taxon', 'all').length > 1
          ? [resolveTreeId(rankData.treeId)]
          : []),
        formatTreeRank(getRankNameWithoutTreeId(rankName)),
      ]
    )
  );

const resolveTreeId = (id: number): string => {
  const treeDefinition = getTreeDefinitions('Taxon', id);
  return formatTreeDefinition(treeDefinition[0].definition.name);
};

function parseTreeTypes(
  table: SpecifyTable,
  uploadPlan: TreeRecordVariety,
  makeMustMatch: (table: SpecifyTable) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> {
  if ('mustMatchTreeRecord' in uploadPlan) makeMustMatch(table);

  return parseTree(table, Object.values(uploadPlan)[0], mappingPath);
}

/** A fix for https://github.com/specify/specify7/issues/1378 */
function resolveField(table: SpecifyTable, fieldName: string): RA<string> {
  const field = table.strictGetField(fieldName);
  if (field.isRelationship) {
    softFail(new Error('Upload plan has a column mapped to a relationship'), {
      table,
      fieldName,
    });
    return [field.name, field.relatedTable.idField.name];
  }
  return [field.name];
}

const parseWbCols = (
  table: SpecifyTable,
  wbCols: IR<ColumnDefinition>,
  mappingPath: MappingPath
) =>
  Object.entries(wbCols).map(([fieldName, fieldData]) => ({
    mappingPath: [...mappingPath, ...resolveField(table, fieldName)],
    headerName: typeof fieldData === 'string' ? fieldData : fieldData.column,
    columnOptions:
      typeof fieldData === 'string'
        ? defaultColumnOptions
        : parseColumnOptions(fieldData),
  }));

const parseUploadTable = (
  table: SpecifyTable,
  uploadPlan: NestedUploadTable | UploadTable,
  makeMustMatch: (model: SpecifyTable) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> => [
  ...parseWbCols(table, uploadPlan.wbcols, mappingPath),
  ...Object.entries(uploadPlan.toOne).flatMap(([relationshipName, mappings]) =>
    parseUploadable(
      table.strictGetRelationship(relationshipName).relatedTable,
      mappings,
      makeMustMatch,
      [...mappingPath, table.strictGetRelationship(relationshipName).name]
    )
  ),
  ...('toMany' in uploadPlan
    ? Object.entries(uploadPlan.toMany).flatMap(
        ([relationshipName, mappings]) =>
          Object.values(mappings).flatMap((mapping, index) =>
            parseUploadTable(
              table.strictGetRelationship(relationshipName).relatedTable,
              mapping,
              makeMustMatch,
              [
                ...mappingPath,
                table.strictGetRelationship(relationshipName).name,
                formatToManyIndex(index + 1),
              ]
            )
          )
      )
    : []),
];

function parseUploadTableTypes(
  table: SpecifyTable,
  uploadPlan: UploadTableVariety,
  makeMustMatch: (table: SpecifyTable) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> {
  if ('mustMatchTable' in uploadPlan) makeMustMatch(table);

  return parseUploadTable(
    table,
    Object.values(uploadPlan)[0],
    makeMustMatch,
    mappingPath
  );
}

const parseUploadable = (
  table: SpecifyTable,
  uploadPlan: Uploadable,
  makeMustMatch: (table: SpecifyTable) => void,
  mappingPath: MappingPath
): RA<SplitMappingPath> =>
  'treeRecord' in uploadPlan || 'mustMatchTreeRecord' in uploadPlan
    ? parseTreeTypes(table, uploadPlan, makeMustMatch, mappingPath)
    : parseUploadTableTypes(table, uploadPlan, makeMustMatch, mappingPath);

/**
 * Break down upload plan into components that are easier to manipulate
 */
export function parseUploadPlan(uploadPlan: UploadPlan): {
  readonly baseTable: SpecifyTable;
  readonly lines: RA<SplitMappingPath>;
  readonly mustMatchPreferences: RR<keyof Tables, boolean>;
} {
  const mustMatchTables = new Set<keyof Tables>();

  const makeMustMatch = (table: SpecifyTable): void =>
    void mustMatchTables.add(table.name);

  const baseTable = strictGetTable(uploadPlan.baseTableName);
  return {
    baseTable,
    lines: parseUploadable(baseTable, uploadPlan.uploadable, makeMustMatch, []),
    mustMatchPreferences: Object.fromEntries(
      Array.from(mustMatchTables, (tableName) => [tableName, true])
    ),
  };
}
