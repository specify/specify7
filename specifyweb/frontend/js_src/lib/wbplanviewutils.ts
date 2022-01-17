/**
 * High-level WbPlanView helpers
 *
 * @module
 */

import ajax, { Http, ping } from './ajax';
import AutoMapper from './automapper';
import type { Dataset } from './components/wbplanview';
import type {
  AutoMapperSuggestion,
  FullMappingPath,
  MappingLine,
  MappingPath,
  SelectElementPosition,
} from './components/wbplanviewmapper';
import { mappingsTreeToUploadPlan } from './mappingstreetouploadplan';
import * as navigation from './navigation';
import schema from './schema';
import type { IR, RA } from './types';
import { renameNewlyCreatedHeaders } from './wbplanviewheaderhelper';
import {
  findDuplicateMappings,
  formatReferenceItem,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import dataModelStorage from './wbplanviewmodel';
import { getMaxToManyValue, tableIsTree } from './wbplanviewmodelhelper';
import { getMappingLineData } from './wbplanviewnavigator';
import type { MappingsTree } from './wbplanviewtreehelper';
import {
  mappingPathsToMappingsTree,
  traverseTree,
} from './wbplanviewtreehelper';

export async function savePlan({
  dataset,
  baseTableName,
  lines,
  mustMatchPreferences,
}: {
  readonly dataset: Dataset;
  readonly baseTableName: string;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
}): Promise<void> {
  const renamedMappedLines = renameNewlyCreatedHeaders(
    baseTableName,
    dataset.columns,
    lines
  );

  const newlyAddedHeaders = renamedMappedLines
    .filter(
      ({ headerName, mappingPath }) =>
        mappingPath.length > 0 &&
        mappingPath[0] !== '0' &&
        !dataset.columns.includes(headerName)
    )
    .map(({ headerName }) => headerName);

  const uploadPlan = mappingsTreeToUploadPlan(
    baseTableName,
    getMappingsTree(renamedMappedLines, true),
    getMustMatchTables({ baseTableName, lines, mustMatchPreferences })
  );

  const dataSetRequestUrl = `/api/workbench/dataset/${dataset.id}/`;

  return ping(
    dataSetRequestUrl,
    {
      method: 'PUT',
      body: {
        uploadplan: uploadPlan,
      },
    },
    {
      expectedResponseCodes: [Http.NO_CONTENT],
    }
  ).then(async () =>
    (newlyAddedHeaders.length === 0
      ? Promise.resolve()
      : ajax<Dataset>(dataSetRequestUrl, {
          headers: { Accept: 'application/json' },
        }).then(async ({ data: { columns, visualorder } }) =>
          ping(
            dataSetRequestUrl,
            {
              method: 'PUT',
              body: {
                visualorder: [
                  ...(visualorder ??
                    Object.keys(dataset.columns).map((index) =>
                      Number.parseInt(index)
                    )),
                  ...newlyAddedHeaders.map((headerName) =>
                    columns.indexOf(headerName)
                  ),
                ],
              },
            },
            {
              expectedResponseCodes: [Http.NO_CONTENT],
            }
          )
        )
    ).then(() => goBack(dataset.id))
  );
}

export const goBack = (dataSetId: number): void =>
  navigation.go(`/workbench/${dataSetId}/`);

/* Unmap headers that have a duplicate mapping path */
export function deduplicateMappings(
  lines: RA<MappingLine>,
  focusedLine: number | false
): RA<MappingLine> {
  const mappingPaths = getMappingPaths(lines);
  const duplicateMappingIndexes = findDuplicateMappings(
    mappingPaths,
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
 *
 * @remarks
 * This is an expensive operation since it runs "getMappingLineData"
 * (with iterate:true) for each line
 */
export function getMustMatchTables({
  baseTableName,
  lines,
  mustMatchPreferences,
}: {
  readonly baseTableName: string;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
}): IR<boolean> {
  const baseTableIsTree = tableIsTree(baseTableName);
  const arrayOfMappingPaths = lines.map((line) => line.mappingPath);
  const arrayOfMappingLineData = arrayOfMappingPaths.flatMap((mappingPath) =>
    getMappingLineData({
      mappingPath,
      baseTableName,
      iterate: true,
    }).filter((mappingElementData, index, list) => {
      if (
        // Exclude base table
        index <= Number(baseTableIsTree) ||
        // Exclude -to-many
        mappingElementData.customSelectSubtype === 'toMany'
      )
        return false;

      if (typeof list[index - 1] === 'undefined') {
        if (
          baseTableName === 'collectionobject' &&
          list[index].tableName === 'collectingevent'
        )
          return false;
      } else {
        // Exclude direct child of -to-many
        if (list[index - 1].customSelectSubtype === 'toMany') return false;

        // Exclude embedded collecting event
        if (
          schema.embeddedCollectingEvent &&
          list[index - 1].tableName === 'collectionobject' &&
          list[index].tableName === 'collectingevent'
        )
          return false;
      }

      return true;
    })
  );

  const tables = arrayOfMappingLineData
    .map((mappingElementData) => mappingElementData.tableName ?? '')
    .filter(
      (tableName) =>
        tableName &&
        typeof dataModelStorage.tables[tableName] !== 'undefined' &&
        !tableName.endsWith('attribute') &&
        // Exclude embedded paleo context
        (!schema.embeddedPaleoContext || tableName !== 'paleocontext')
    );
  const distinctListOfTables = Array.from(new Set(tables));

  return {
    ...Object.fromEntries(
      distinctListOfTables.map((tableName) => [
        tableName,
        // Whether to check it by default
        tableName === 'preptype' && !('preptype' in mustMatchPreferences),
      ])
    ),
    ...mustMatchPreferences,
  };
}

export function getMappingPaths(
  lines: RA<MappingLine>,
  includeHeaders: true
): RA<FullMappingPath>;
export function getMappingPaths(
  lines: RA<MappingLine>,
  includeHeaders?: false
): RA<MappingPath>;
export function getMappingPaths(
  lines: RA<MappingLine>,
  includeHeaders = false
): RA<MappingPath | FullMappingPath> {
  return lines
    .filter(({ mappingPath }) => mappingPathIsComplete(mappingPath))
    .map(({ mappingPath, mappingType, headerName, columnOptions }) =>
      includeHeaders
        ? [...mappingPath, mappingType, headerName, columnOptions]
        : mappingPath
    );
}

export const getMappingsTree = (
  lines: RA<MappingLine>,
  includeHeaders = false
): MappingsTree =>
  mappingPathsToMappingsTree(
    // Overloading does not seem to work nicely with dynamic types
    includeHeaders
      ? getMappingPaths(lines, true)
      : getMappingPaths(lines, false),
    includeHeaders
  );

/* Get a mappings tree branch given a particular starting mapping path */
export function getMappedFields(
  lines: RA<MappingLine>,
  // A mapping path that would be used as a filter
  mappingPathFilter: MappingPath
): MappingsTree {
  const mappingsTree = traverseTree(getMappingsTree(lines), mappingPathFilter);
  return typeof mappingsTree === 'object' ? mappingsTree : {};
}

export const pathIsMapped = (
  lines: RA<MappingLine>,
  mappingPath: MappingPath
): boolean =>
  Object.keys(getMappedFields(lines, mappingPath.slice(0, -1))).includes(
    mappingPath.slice(-1)[0]
  );

export const mappingPathIsComplete = (mappingPath: MappingPath): boolean =>
  mappingPath[mappingPath.length - 1] !== '0';

/*
 * The most important function in `wbplanview`
 * It decides how to modify the mapping path when a different picklist
 *  item is selected.
 * It is also responsible for deciding when to spawn a new box to the right
 *  of the current one and whether to reset the mapping path to the right of
 *  the selected box on value changes (e.x the mapping path is preserved
 *  when the old value and the new value have the same relationship type and
 *  are both either from the same table or are -to-many reference numbers
 *  (#1) or are tree ranks ($Kingdom)).
 *
 */
export function mutateMappingPath({
  lines,
  mappingView,
  line,
  index,
  newValue,
  currentTableName,
  newTableName,
}: {
  readonly lines: RA<MappingLine>;
  readonly mappingView: MappingPath;
  readonly line: number | 'mappingView';
  readonly index: number;
  readonly newValue: string;
  readonly isRelationship: boolean;
  readonly currentTableName: string;
  readonly newTableName: string;
}): MappingPath {
  // Get mapping path from selected line or mapping view
  let mappingPath = Array.from(
    line === 'mappingView' ? mappingView : lines[line].mappingPath
  );

  /*
   * Get relationship type from current picklist to the next one both for
   * current value and next value
   */
  const currentRelationshipType =
    dataModelStorage.tables[currentTableName]?.fields[mappingPath[index] || '']
      ?.type ?? '';
  const newRelationshipType =
    dataModelStorage.tables[newTableName]?.fields[newValue]?.type ?? '';

  /*
   * Don't reset the boxes to the right of the current box if relationship
   * types are the same (or non-existent in both cases) and the new box is a
   * -to-many, a tree rank or a different relationship to the same table
   */
  const preserveMappingPathToRight =
    currentRelationshipType === newRelationshipType &&
    (valueIsReferenceItem(newValue) ||
      valueIsTreeRank(newValue) ||
      currentTableName === newTableName);

  /*
   * When `Add` is selected in the list of -to-many indexes, replace it by
   * creating a new -to-many index
   */
  if (newValue === 'add') {
    const mappedFields = Object.keys(
      getMappedFields(lines, mappingPath.slice(0, index))
    );
    const maxToManyValue = getMaxToManyValue(mappedFields);
    mappingPath[index] = formatReferenceItem(maxToManyValue + 1);
  } else if (preserveMappingPathToRight) mappingPath[index] = newValue;
  // Clear mapping path to the right of current box
  else mappingPath = [...mappingPath.slice(0, index), newValue];

  return mappingPath;
}

// The maximum number of suggestions to show in the suggestions box
const MAX_SUGGESTIONS_COUNT = 3;

/*
 * Show autoMapper suggestion on top of an opened `CLOSED_LIST`
 * The autoMapper suggestions are shown only if the current box doesn't have
 * a value selected
 */
export async function getAutoMapperSuggestions({
  lines,
  line,
  index,
  baseTableName,
}: SelectElementPosition & {
  readonly lines: RA<MappingLine>;
  readonly baseTableName: string;
}): Promise<RA<AutoMapperSuggestion>> {
  const localMappingPath = Array.from(lines[line].mappingPath);

  if (
    /*
     * Don't show suggestions
     * if opened picklist has a value selected
     */
    localMappingPath.length - 1 !== index ||
    // Or if header is a new column
    mappingPathIsComplete(localMappingPath) ||
    lines[line].mappingType !== 'existingHeader'
  )
    return [];

  const mappingLineData = getMappingLineData({
    baseTableName,
    mappingPath: mappingPathIsComplete(localMappingPath)
      ? localMappingPath
      : localMappingPath.slice(0, -1),
    customSelectType: 'SUGGESTION_LIST',
    showHiddenFields: true,
    getMappedFields: getMappedFields.bind(undefined, lines),
  });

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
    baseMappingPath.push('#1');
    pathOffset = 1;
  }

  const autoMapperResults = new AutoMapper({
    headers: [lines[line].headerName],
    baseTable: baseTableName,
    startingTable:
      mappingLineData.length === 0
        ? baseTableName
        : mappingLineData[mappingLineData.length - 1].tableName,
    path: baseMappingPath,
    pathOffset,
    scope: 'suggestion',
    pathIsMapped: pathIsMapped.bind(undefined, lines),
  }).map()[lines[line].headerName];

  if (typeof autoMapperResults === 'undefined') return [];

  return autoMapperResults
    .slice(0, MAX_SUGGESTIONS_COUNT)
    .map((autoMapperResult) => ({
      mappingPath: autoMapperResult,
      mappingLineData: getMappingLineData({
        baseTableName,
        mappingPath: autoMapperResult,
        iterate: true,
        customSelectType: 'SUGGESTION_LINE_LIST',
        getMappedFields: getMappedFields.bind(undefined, lines),
      }).slice(baseMappingPath.length - pathOffset),
    }));
}
