import type { IR, RA, RR } from '../../utils/types';
import { group, removeKey, split, toLowerCase } from '../../utils/utils';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { getTreeDefinitions, isTreeTable } from '../InitialContext/treeRanks';
import { defaultColumnOptions } from './linesGetter';
import {
  getNameFromTreeDefinitionName,
  SplitMappingPath,
  valueIsTreeDefinition,
  valueIsTreeRank,
} from './mappingHelpers';
import { getNameFromTreeRankName, valueIsToManyIndex } from './mappingHelpers';
import type {
  ColumnDefinition,
  ColumnOptions,
  TreeRecord,
  Uploadable,
  UploadPlan,
  UploadTable,
} from './uploadPlanParser';

export const toColumnOptions = (
  headerName: string,
  columnOptions: ColumnOptions
): ColumnDefinition =>
  JSON.stringify(columnOptions) === JSON.stringify(defaultColumnOptions)
    ? headerName
    : {
        ...defaultColumnOptions,
        column: headerName,
        ...columnOptions,
      };

const toTreeRecordRanks = (
  rankMappedFields: RA<SplitMappingPath>
): IR<ColumnDefinition> =>
  Object.fromEntries(
    rankMappedFields.map(({ mappingPath, headerName, columnOptions }) => [
      // Use the last element of the mapping path to get the field name
      // e.g: mappingPath when a tree is specified: ['$Kingdom', 'name'] vs when no tree is specified: ['name']
      mappingPath[mappingPath.length - 1].toLowerCase(),
      toColumnOptions(headerName, columnOptions),
    ])
  );

const toTreeRecordVariety = (lines: RA<SplitMappingPath>): TreeRecord => {
  const treeDefinitions = getTreeDefinitions('Taxon', 'all');

  return {
    ranks: Object.fromEntries(
      indexMappings(lines).map(([fullName, rankMappedFields]) => {
        const rankName = valueIsTreeRank(fullName)
          ? getNameFromTreeRankName(fullName)
          : getNameFromTreeRankName(rankMappedFields[0].mappingPath[0]);

        const treeName = valueIsTreeDefinition(fullName)
          ? getNameFromTreeDefinitionName(fullName)
          : undefined;

        const treeId =
          treeName !== undefined
            ? treeDefinitions.find(
                ({ definition }) => definition.name === treeName
              )?.definition.id
            : treeDefinitions.find(({ ranks }) =>
                ranks.find((r) => r.name === rankName)
              )?.definition.id;

        return [
          rankName,
          {
            treeNodeCols: toTreeRecordRanks(rankMappedFields),
            treeId,
          },
        ];
      })
    ),
  };
};

function toUploadTable(
  table: SpecifyTable,
  lines: RA<SplitMappingPath>,
  mustMatchPreferences: RA<keyof Tables>
): UploadTable {
  const [fields, relationships] = split(
    lines,
    ({ mappingPath }) => mappingPath.length > 1
  );
  const [toOne, toMany] = split(relationships, ({ mappingPath }) =>
    valueIsToManyIndex(mappingPath[1])
  ).map(indexMappings);

  return {
    wbcols: Object.fromEntries(
      fields.map(
        ({ mappingPath, headerName, columnOptions }) =>
          [
            mappingPath[0].toLowerCase(),
            toColumnOptions(headerName, columnOptions),
          ] as const
      )
    ),
    static: {},
    toOne: Object.fromEntries(
      toOne.map(
        ([fieldName, lines]) =>
          [
            fieldName.toLowerCase(),
            toUploadable(
              table.strictGetRelationship(fieldName).relatedTable,
              lines,
              mustMatchPreferences
            ),
          ] as const
      )
    ),
    toMany: Object.fromEntries(
      toMany.map(
        ([fieldName, lines]) =>
          [
            fieldName.toLowerCase(),
            indexMappings(lines).map(([_index, lines]) =>
              removeKey(
                toUploadTable(
                  table.strictGetRelationship(fieldName).relatedTable,
                  lines,
                  mustMatchPreferences
                ),
                'toMany'
              )
            ),
          ] as const
      )
    ),
  };
}

const toUploadable = (
  table: SpecifyTable,
  lines: RA<SplitMappingPath>,
  mustMatchPreferences: RA<keyof Tables>,
  isRoot = false
): Uploadable =>
  isTreeTable(table.name)
    ? Object.fromEntries([
        [
          mustMatchPreferences.includes(table.name)
            ? 'mustMatchTreeRecord'
            : 'treeRecord',
          toTreeRecordVariety(lines),
        ] as const,
      ])
    : Object.fromEntries([
        [
          !isRoot && mustMatchPreferences.includes(table.name)
            ? 'mustMatchTable'
            : 'uploadTable',
          toUploadTable(table, lines, mustMatchPreferences),
        ] as const,
      ]);

/**
 * Build an upload plan from individual mapping lines
 */
export const uploadPlanBuilder = (
  baseTableName: keyof Tables,
  lines: RA<SplitMappingPath>,
  mustMatchPreferences: RR<keyof Tables, boolean>
): UploadPlan => ({
  baseTableName: toLowerCase(baseTableName),
  uploadable: toUploadable(
    strictGetTable(baseTableName),
    lines,
    Object.entries(mustMatchPreferences)
      .filter(([_, mustMatch]) => mustMatch)
      .map(([tableName]) => tableName),
    true
  ),
});

const indexMappings = (
  mappings: RA<SplitMappingPath>
): RA<readonly [string, RA<SplitMappingPath>]> =>
  group(
    mappings.map(
      ({ mappingPath, ...rest }) =>
        [
          mappingPath[0],
          {
            ...rest,
            mappingPath: mappingPath.slice(1),
          },
        ] as const
    )
  );
