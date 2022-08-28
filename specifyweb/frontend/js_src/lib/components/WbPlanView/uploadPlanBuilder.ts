import type { Tables } from '../DataModel/types';
import { group, removeKey, split, toLowerCase } from '../../utils/utils';
import { getModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { isTreeModel } from '../InitialContext/treeRanks';
import type { IR, RA, RR } from '../../utils/types';
import { defined } from '../../utils/types';
import type {
  ColumnDefinition,
  ColumnOptions,
  TreeRecord,
  Uploadable,
  UploadPlan,
  UploadTable,
} from './uploadPlanParser';
import { defaultColumnOptions } from './linesGetter';
import type { SplitMappingPath } from './mappingHelpers';
import {
  getNameFromTreeRankName,
  valueIsToManyIndex,
} from './mappingHelpers';

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
      mappingPath[0].toLowerCase(),
      toColumnOptions(headerName, columnOptions),
    ])
  );

const toTreeRecordVariety = (lines: RA<SplitMappingPath>): TreeRecord => ({
  ranks: Object.fromEntries(
    indexMappings(lines).map(([fullRankName, rankMappedFields]) => [
      getNameFromTreeRankName(fullRankName),
      {
        treeNodeCols: toTreeRecordRanks(rankMappedFields),
      },
    ])
  ),
});

function toUploadTable(
  model: SpecifyModel,
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
              defined(model.getRelationship(fieldName)).relatedModel,
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
                  defined(model.getRelationship(fieldName)).relatedModel,
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
  model: SpecifyModel,
  lines: RA<SplitMappingPath>,
  mustMatchPreferences: RA<keyof Tables>,
  isRoot = false
): Uploadable =>
  isTreeModel(model.name)
    ? Object.fromEntries([
        [
          mustMatchPreferences.includes(model.name)
            ? 'mustMatchTreeRecord'
            : 'treeRecord',
          toTreeRecordVariety(lines),
        ] as const,
      ])
    : Object.fromEntries([
        [
          !isRoot && mustMatchPreferences.includes(model.name)
            ? 'mustMatchTable'
            : 'uploadTable',
          toUploadTable(model, lines, mustMatchPreferences),
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
    defined(getModel(baseTableName)),
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
