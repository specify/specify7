/**
 * High-level WbPlanView helpers
 *
 * @module
 */

import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { schema } from '../DataModel/schema';
import { getTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { isTreeTable } from '../InitialContext/treeRanks';
import { AutoMapper } from './autoMapper';
import { renameNewlyCreatedHeaders } from './headerHelper';
import type {
  AutoMapperSuggestion,
  BatchEditPrefs,
  MappingLine,
  MappingPath,
  SelectElementPosition,
} from './Mapper';
import {
  anyTreeRank,
  emptyMapping,
  findDuplicateMappings,
  formatToManyIndex,
  formatTreeRank,
  mappingPathToString,
  relationshipIsToMany,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './mappingHelpers';
import { getMappingLineData } from './navigator';
import { navigatorSpecs } from './navigatorSpecs';
import { uploadPlanBuilder } from './uploadPlanBuilder';
import type { Dataset } from './Wrapped';

export async function savePlan({
  dataset,
  baseTableName,
  lines,
  mustMatchPreferences,
  batchEditPrefs,
}: {
  readonly dataset: Dataset;
  readonly baseTableName: keyof Tables;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
  readonly batchEditPrefs?: BatchEditPrefs;
}): Promise<void> {
  const renamedLines = renameNewlyCreatedHeaders(
    baseTableName,
    dataset.columns,
    lines.filter(({ mappingPath }) => mappingPathIsComplete(mappingPath))
  );

  const newlyAddedHeaders = renamedLines
    .filter(
      ({ headerName, mappingPath }) =>
        mappingPath.length > 0 &&
        mappingPath[0] !== emptyMapping &&
        !dataset.columns.includes(headerName)
    )
    .map(({ headerName }) => headerName);

  const uploadPlan = uploadPlanBuilder(
    baseTableName,
    renamedLines,
    getMustMatchTables({ baseTableName, lines, mustMatchPreferences }),
    batchEditPrefs
  );

  const dataSetRequestUrl = `/api/workbench/dataset/${dataset.id}/`;

  return ping(dataSetRequestUrl, {
    method: 'PUT',
    body: {
      uploadplan: uploadPlan,
    },
  }).then(async () =>
    newlyAddedHeaders.length === 0
      ? Promise.resolve()
      : ajax<Dataset>(dataSetRequestUrl, {
          headers: { Accept: 'application/json' },
        }).then(async ({ data: { columns, visualorder } }) =>
          ping(dataSetRequestUrl, {
            method: 'PUT',
            body: {
              visualorder: [
                ...(visualorder ??
                  Object.keys(dataset.columns).map(f.unary(Number.parseInt))),
                ...newlyAddedHeaders.map((headerName) =>
                  columns.indexOf(headerName)
                ),
              ],
            },
          }).then(f.void)
        )
  );
}

/* Unmap headers that have a duplicate mapping path */
export function deduplicateMappings(
  lines: RA<MappingLine>,
  focusedLine: number | false
): RA<MappingLine> {
  const duplicateMappingIndexes = findDuplicateMappings(
    lines.map(({ mappingPath }) => mappingPath).filter(mappingPathIsComplete),
    focusedLine
  );

  return lines.map((line, index) =>
    duplicateMappingIndexes.includes(index)
      ? {
          ...line,
          mappingPath: line.mappingPath.slice(0, -1),
        }
      : line
  );
}

/**
 * Get list of tables available for must match given current Mapping Paths
 * and merge that list with the current must match config
 */
export function getMustMatchTables({
  baseTableName,
  lines,
  mustMatchPreferences,
}: {
  readonly baseTableName: keyof Tables;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
}): IR<boolean> {
  const baseTableIsTree = isTreeTable(baseTableName);
  const arrayOfMappingPaths = lines.map((line) => line.mappingPath);
  const arrayOfMappingLineData = arrayOfMappingPaths.flatMap((mappingPath) =>
    getMappingLineData({
      mappingPath,
      baseTableName,
      generateFieldData: 'none',
      spec: navigatorSpecs.wbPlanView,
    }).filter(
      (mappingElementData, index, list) =>
        // Exclude base table
        index > Number(baseTableIsTree) &&
        // Exclude -to-many
        mappingElementData.customSelectSubtype !== 'toMany' &&
        // Exclude direct child of -to-many
        list[index - 1]?.customSelectSubtype !== 'toMany' &&
        // Exclude embedded collecting event
        (!schema.embeddedCollectingEvent ||
          (list[index - 1]?.tableName ?? baseTableName) !==
            'CollectionObject' ||
          list[index].tableName !== 'CollectingEvent')
    )
  );

  const tables = arrayOfMappingLineData
    .map(({ tableName = '' }) => tableName)
    .filter(
      (tableName) =>
        getTable(tableName) === undefined ||
        (!tableName.endsWith('attribute') &&
          // Exclude embedded paleo context
          (!schema.embeddedPaleoContext || tableName !== 'PaleoContext'))
    )
    .sort(sortFunction((tableName) => getTable(tableName)?.label ?? null));

  return {
    ...Object.fromEntries(
      Array.from(new Set(tables), (tableName) => [
        tableName,
        // Whether "mustMatch" is checked by default
        tableName === 'PrepType' && !('preptype' in mustMatchPreferences),
      ])
    ),
    ...mustMatchPreferences,
  };
}

export const pathStartsWith = (
  mappingPath: MappingPath,
  subPath: MappingPath
): boolean =>
  /*
   * Can't use String.prototype.startsWith here.
   * See https://github.com/specify/specify7/issues/1355
   */
  mappingPathToString(mappingPath.slice(0, subPath.length)).toLowerCase() ===
  mappingPathToString(subPath).toLowerCase();

export const getMappedFields = (
  lines: RA<{ readonly mappingPath: MappingPath }>,
  // A mapping path that would be used as a filter
  mappingPathFilter: MappingPath
): RA<string> =>
  lines
    .filter((line) => pathStartsWith(line.mappingPath, mappingPathFilter))
    .map((line) => line.mappingPath[mappingPathFilter.length]);

export const mappingPathIsComplete = (mappingPath: MappingPath): boolean =>
  mappingPath.at(-1) !== emptyMapping;

/*
 * The most important function in WbPlanView
 *
 * It decides how to modify the mapping path when a different combo box
 *  item is selected.
 *
 * It is also responsible for deciding when to spawn a new box to the right
 *  of the current one and whether to reset the mapping path to the right of
 *  the selected box when value changes
 */
export function mutateMappingPath({
  mappingPath: originalPath,
  index: originalIndex,
  newValue,
  isRelationship,
  parentTableName,
  currentTableName,
  newTableName,
  ignoreToMany = false,
  ignoreTreeRanks = false,
}: {
  readonly mappingPath: MappingPath;
  readonly index: number;
  readonly newValue: string;
  readonly isRelationship: boolean;
  readonly parentTableName: keyof Tables | undefined;
  readonly currentTableName: keyof Tables | undefined;
  readonly newTableName: keyof Tables | undefined;
  /*
   * If false, allows to choose the index for the -to-many mapping
   * (in WbPlanView). Else, #1 is selected automatically (in QueryBuilder)
   */
  readonly ignoreToMany?: boolean;
  /*
   * If false, allows to choose a tree rank (or "any rank")
   * Else, "any rank" is selected automatically
   */
  readonly ignoreTreeRanks?: boolean;
}): MappingPath {
  let mappingPath = Array.from(originalPath);

  /*
   * If ignoring -to-many or tree ranks, originalIndex needs to be corrected
   * since -to-many boxes were not rendered
   */
  const index =
    ignoreToMany || ignoreTreeRanks
      ? mappingPath.reduce(
          (index, part, partIndex) =>
            partIndex <= index &&
            ((ignoreToMany && valueIsToManyIndex(part)) ||
              (ignoreTreeRanks && valueIsTreeRank(part)))
              ? index + 1
              : index,
          originalIndex
        )
      : originalIndex;

  /*
   * Get relationship type from current picklist to the next one both for
   * current value and next value
   */
  const table = getTable(parentTableName ?? '');
  const currentField = table?.getField(mappingPath[index] ?? '');
  const isCurrentToMany =
    currentField?.isRelationship === true && relationshipIsToMany(currentField);
  const newField = table?.getField(newValue);
  const isNewToMany =
    newField?.isRelationship === true && relationshipIsToMany(newField);
  const isNewTree =
    newField?.isRelationship === true &&
    isTreeTable(newField.relatedTable.name);

  /*
   * Don't reset the boxes to the right of the current box if relationship
   * types are the same (or non-existent in both cases) and the new box is a
   * -to-many, a non-any tree rank or a different relationship to the same table
   */
  const preserveMappingPathToRight =
    isCurrentToMany === isNewToMany &&
    (valueIsToManyIndex(newValue) ||
      valueIsTreeRank(newValue) ||
      currentTableName === newTableName) &&
    mappingPath[index] !== formatTreeRank(anyTreeRank);

  if (preserveMappingPathToRight) mappingPath[index] = newValue;
  // Clear mapping path to the right of current box
  else mappingPath = [...mappingPath.slice(0, index), newValue];

  return isRelationship
    ? [
        ...mappingPath.slice(0, index + 1),
        ...(mappingPath.length > index + 1
          ? mappingPath.slice(index + 1)
          : [
              ...(ignoreToMany && isNewToMany ? [formatToManyIndex(1)] : []),
              ...(ignoreTreeRanks && isNewTree
                ? [formatTreeRank(anyTreeRank)]
                : []),
              emptyMapping,
            ]),
      ]
    : mappingPath;
}

// The maximum number of suggestions to show in the suggestions box
const MAX_SUGGESTIONS_COUNT = 3;

/*
 * Show autoMapper suggestion on top of an opened `CLOSED_LIST`
 * The autoMapper suggestions are shown only if the current box doesn't have
 * a value selected
 */
export async function fetchAutoMapperSuggestions({
  lines,
  line,
  index,
  baseTableName,
}: SelectElementPosition & {
  readonly lines: RA<MappingLine>;
  readonly baseTableName: keyof Tables;
}): Promise<RA<AutoMapperSuggestion>> {
  const localMappingPath = Array.from(lines[line].mappingPath);

  if (
    /*
     * Don't show suggestions
     * if opened picklist has a value selected
     */
    localMappingPath.length - 1 !== index ||
    // Or if header is a new column
    mappingPathIsComplete(localMappingPath)
  )
    return [];

  const mappingLineData = getMappingLineData({
    baseTableName,
    mappingPath: localMappingPath,
    showHiddenFields: true,
    getMappedFields: getMappedFields.bind(undefined, lines),
    generateFieldData: 'all',
    spec: navigatorSpecs.wbPlanView,
  }).slice(-1);

  // Don't show suggestions if picklist has only one field / no fields
  if (
    mappingLineData.length === 1 &&
    Object.keys(mappingLineData[0].fieldsData).length < 2
  )
    return [];

  const baseMappingPath = localMappingPath.slice(0, -1);

  let pathOffset = 0;
  if (
    mappingLineData.length === 1 &&
    mappingLineData[0].customSelectSubtype === 'toMany'
  ) {
    baseMappingPath.push(formatToManyIndex(1));
    pathOffset = 1;
  }

  const autoMapperResults = new AutoMapper({
    headers: [lines[line].headerName],
    baseTableName,
    startingTable: mappingLineData.at(-1)?.tableName ?? baseTableName,
    path: baseMappingPath,
    pathOffset,
    scope: 'suggestion',
    getMappedFields: getMappedFields.bind(undefined, lines),
  }).map()[lines[line].headerName];

  if (autoMapperResults === undefined) return [];

  return autoMapperResults
    .slice(0, MAX_SUGGESTIONS_COUNT)
    .map((autoMapperResult) => ({
      mappingPath: autoMapperResult,
      mappingLineData: getMappingLineData({
        baseTableName,
        mappingPath: autoMapperResult,
        getMappedFields: getMappedFields.bind(undefined, lines),
        generateFieldData: 'selectedOnly',
        spec: navigatorSpecs.wbPlanView,
      })
        .slice(baseMappingPath.length - pathOffset)
        .map((data) => ({
          ...data,
          customSelectType: 'PREVIEW_LIST',
          isOpen: true,
        })),
    }));
}
