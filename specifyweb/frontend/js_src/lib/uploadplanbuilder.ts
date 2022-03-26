/**
 * Helper function for converting from mapping tree
 * (internal structure used in WbPlanView) to upload plan
 *
 * @module
 */

import type { Tables } from './datamodel';
import { getModel } from './schema';
import type { SpecifyModel } from './specifymodel';
import { isTreeModel } from './treedefinitions';
import type { IR, RA, RR } from './types';
import { defined } from './types';
import type {
  ColumnDefinition,
  ColumnOptions,
  TreeRecord,
  Uploadable,
  UploadPlan,
  UploadTable,
} from './uploadplanparser';
import { group, omit, split, toLowerCase } from './helpers';
import { defaultColumnOptions } from './wbplanviewlinesgetter';
import type { SplitMappingPath } from './wbplanviewmappinghelper';
import {
  getNameFromTreeRankName,
  valueIsToManyIndex,
} from './wbplanviewmappinghelper';

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
      mappingPath[0],
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
      toMany.map(([fieldName, lines]) => {
        return [
          fieldName.toLowerCase(),
          indexMappings(lines).map(([_index, lines]) =>
            omit(
              toUploadTable(
                defined(model.getRelationship(fieldName)).relatedModel,
                lines,
                mustMatchPreferences
              ),
              ['toMany']
            )
          ),
        ] as const;
      })
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

const indexMappings = (mappings: RA<SplitMappingPath>) =>
  Object.entries(
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
    )
  );
