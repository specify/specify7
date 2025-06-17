import type { IR, RA, RR } from '../../utils/types';
import { group, split, toLowerCase } from '../../utils/utils';
import type { AnyTree } from '../DataModel/helperTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { getTreeDefinitions, isTreeTable } from '../InitialContext/treeRanks';
import { defaultColumnOptions } from './linesGetter';
import type { BatchEditPrefs } from './Mapper';
import type { SplitMappingPath } from './mappingHelpers';
import { valueIsTreeMeta } from './mappingHelpers';
import {
  getNameFromTreeDefinitionName,
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
      /*
       * Use the last element of the mapping path to get the field name
       * e.g: mappingPath when a tree is specified: ['$Kingdom', 'name'] vs when no tree is specified: ['name']
       */
      mappingPath.at(-1)?.toLowerCase(),
      toColumnOptions(headerName, columnOptions),
    ])
  );

const toTreeRecordVariety = (
  tableName: AnyTree['tableName'],
  lines: RA<SplitMappingPath>
): TreeRecord => {
  const treeDefinitions = getTreeDefinitions(tableName, 'all');

  return {
    ranks: Object.fromEntries(
      indexMappings(lines).flatMap(([fullName, rankMappedFields]) => {
        /*
         * For collections with only 1 tree, rankMappedFields already has the correct format for generating an upload plan
         * When there are multiple trees in the mapper, rankMappedFields is actually a mapping path of trees mapped to ranks
         * which means we need to get the index mappings of it again to get the actual rankMappedFields
         */
        const rankMappings: RA<readonly [string, RA<SplitMappingPath>]> =
          valueIsTreeRank(fullName)
            ? [[fullName, rankMappedFields]]
            : indexMappings(rankMappedFields);

        const treeName: string | undefined = valueIsTreeDefinition(fullName)
          ? getNameFromTreeDefinitionName(fullName)
          : undefined;

        return rankMappings.map(([fullName, mappedFields]) => {
          const rankName = getNameFromTreeRankName(fullName);

          // Resolve treeId using treeName or using rankName as fallback
          const treeId =
            treeName === undefined
              ? treeDefinitions.find(({ ranks }) =>
                  ranks.find((r) => r.name === rankName)
                )?.definition.id
              : treeDefinitions.find(
                  ({ definition }) => definition.name === treeName
                )?.definition.id;

          // Key can be either <rankName> or <treeName>~><rankName>
          return [
            treeId === undefined || treeName === undefined
              ? rankName
              : formatTreeRankKey(rankName, treeName),
            {
              treeNodeCols: toTreeRecordRanks(mappedFields),
              treeId: treeDefinitions.length > 1 ? treeId : undefined,
            },
          ];
        });
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
              toUploadTable(
                table.strictGetRelationship(fieldName).relatedTable,
                lines,
                mustMatchPreferences
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
  /**
   * NOTE: pathHasTreeMeta handles the case where a Batch Edit dataset has a mapping line with a (any rank) query
   * A mapping line like that requires a uploadTable record rather than a treeRecord in the upload plan
   */
  isTreeTable(table.name) && pathHasTreeMeta(lines)
    ? Object.fromEntries([
        [
          mustMatchPreferences.includes(table.name)
            ? 'mustMatchTreeRecord'
            : 'treeRecord',
          toTreeRecordVariety(table.name, lines),
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

const pathHasTreeMeta = (lines: RA<SplitMappingPath>) =>
  lines.some(({ mappingPath }) =>
    mappingPath.some((value) => valueIsTreeMeta(value))
  );

/**
 * Build an upload plan from individual mapping lines
 */
export const uploadPlanBuilder = (
  baseTableName: keyof Tables,
  lines: RA<SplitMappingPath>,
  mustMatchPreferences: RR<keyof Tables, boolean>,
  batchEditPrefs?: BatchEditPrefs
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
  batchEditPrefs,
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

// Delimiter used for rank name keys i.e: <treeName>~><rankName>
export const RANK_KEY_DELIMITER = '~>';

/**
 * Returns a formatted tree rank name along with its tree name: (e.x Taxonomy~>Kingdom)
 * Used for generating unique key names in the upload plan when there are multiple trees with the same rank name.
 * NOTE: Opposite of uploadPlanParser.ts > getRankNameFromKey()
 */
const formatTreeRankKey = (rankName: string, treeName: string): string =>
  `${treeName}${RANK_KEY_DELIMITER}${rankName}`;
