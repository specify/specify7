import ajax from './ajax';
import Automapper from './automapper';
import type {
  Dataset,
  IR,
  PublicWbPlanViewProps,
  RA,
  WbPlanViewWrapperProps,
} from './components/wbplanview';
import type {
  AutomapperSuggestion,
  FullMappingPath,
  MappingLine,
  MappingPath,
  SelectElementPosition,
} from './components/wbplanviewmapper';
import type { LoadingState, MappingState } from './components/wbplanviewstate';
import { mappingsTreeToUploadPlan } from './mappingstreetouploadplan';
import navigation from './navigation';
import schema from './schema';
import { renameNewlyCreatedHeaders } from './wbplanviewheaderhelper';
import {
  findDuplicateMappings,
  formatReferenceItem,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import dataModelStorage from './wbplanviewmodel';
import {
  findRequiredMissingFields,
  getMaxToManyValue,
  tableIsTree,
} from './wbplanviewmodelhelper';
import { getMappingLineData } from './wbplanviewnavigator';
import type { ChangeSelectElementValueAction } from './wbplanviewreducer';
import type { MappingsTree } from './wbplanviewtreehelper';
import {
  arrayOfMappingsToMappingsTree,
  traverseTree,
} from './wbplanviewtreehelper';

export const goBack = (props: PublicWbPlanViewProps): void =>
  navigation.go(`/workbench/${props.dataset.id}/`);

export function savePlan(
  props: WbPlanViewWrapperProps,
  state: MappingState,
  ignoreValidation = false
): LoadingState | MappingState {
  const validationResultsState = validate(state);
  if (!ignoreValidation && validationResultsState.validationResults.length > 0)
    return validationResultsState;

  const renamedMappedLines = renameNewlyCreatedHeaders(
    state.baseTableName,
    props.dataset.columns,
    state.lines
  );

  const newlyAddedHeaders = renamedMappedLines
    .filter(
      ({ headerName, mappingPath }) =>
        mappingPath.length > 0 &&
        mappingPath[0] !== '0' &&
        !props.dataset.columns.includes(headerName)
    )
    .map(({ headerName }) => headerName);

  const uploadPlan = mappingsTreeToUploadPlan(
    state.baseTableName,
    getMappingsTree(renamedMappedLines, true),
    getMustMatchTables(state)
  );

  const dataSetRequestUrl = `/api/workbench/dataset/${props.dataset.id}/`;

  void ajax(dataSetRequestUrl, {
    method: 'PUT',
    body: {
      uploadplan: uploadPlan,
    },
  }).then(() => {
    if (state.changesMade) props.removeUnloadProtect();

    if (newlyAddedHeaders.length > 0)
      void ajax<Dataset>(dataSetRequestUrl, {
        headers: {
          Accept: 'application/json',
        },
      }).then(({ data: { columns, visualorder } }) => {
        let newVisualOrder;
        newVisualOrder =
          visualorder === null
            ? Object.keys(props.dataset.columns)
            : visualorder;

        newlyAddedHeaders.forEach((headerName) =>
          newVisualOrder.push(columns.indexOf(headerName))
        );

        void ajax(dataSetRequestUrl, {
          method: 'PUT',
          body: {
            visualorder: newVisualOrder,
          },
        }).then(() => goBack(props));
      });
    else goBack(props);
  });

  return state;
}

/* Validates the current mapping and shows error messages if needed */
export function validate(state: MappingState): MappingState {
  const validationResults = findRequiredMissingFields(
    state.baseTableName,
    getMappingsTree(state.lines, true),
    state.mustMatchPreferences
  );

  return {
    ...state,
    type: 'MappingState',
    // Show mapping view panel if there were validation errors
    showMappingView:
      state.showMappingView || Object.values(validationResults).length > 0,
    mappingsAreValidated: Object.values(validationResults).length === 0,
    validationResults,
  };
}

/* Unmap headers that have a duplicate mapping path */
export function deduplicateMappings(
  lines: RA<MappingLine>,
  focusedLine: number | false
): RA<MappingLine> {
  const arrayOfMappings = getArrayOfMappings(lines);
  const duplicateMappingIndexes = findDuplicateMappings(
    arrayOfMappings,
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

export function getMustMatchTables(state: MappingState): IR<boolean> {
  const baseTableIsTree = tableIsTree(state.baseTableName);
  const arrayOfMappingPaths = state.lines.map((line) => line.mappingPath);
  const arrayOfMappingLineData = arrayOfMappingPaths.flatMap((mappingPath) =>
    getMappingLineData({
      mappingPath,
      baseTableName: state.baseTableName,
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
          state.baseTableName === 'collectionobject' &&
          list[index].tableName === 'collectingevent'
        )
          return false;
      } else {
        // Exclude direct child of -to-many
        if (list[index - 1].customSelectSubtype === 'toMany') return false;

        // Exclude embedded collecting event
        if (
          schema.embeddedCollectingEvent === true &&
          list[index - 1].tableName === 'collectionobject' &&
          list[index].tableName === 'collectingevent'
        )
          return false;
      }

      return true;
    })
  );

  const arrayOfTables = arrayOfMappingLineData
    .map((mappingElementData) => mappingElementData.tableName ?? '')
    .filter(
      (tableName) =>
        tableName &&
        typeof dataModelStorage.tables[tableName] !== 'undefined' &&
        !tableName.endsWith('attribute') &&
        // Exclude embedded paleo context
        (schema.embeddedPaleoContext === false || tableName !== 'paleocontext')
    );
  const distinctListOfTables = Array.from(new Set(arrayOfTables));

  return {
    ...Object.fromEntries(
      distinctListOfTables.map((tableName) => [
        tableName,
        // Whether to check it by default
        tableName === 'preptype' && !('preptype' in state.mustMatchPreferences),
      ])
    ),
    ...state.mustMatchPreferences,
  };
}

export function getArrayOfMappings(
  lines: RA<MappingLine>,
  includeHeaders: true
): RA<FullMappingPath>;
export function getArrayOfMappings(
  lines: RA<MappingLine>,
  includeHeaders?: false
): RA<MappingPath>;
export function getArrayOfMappings(
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
  arrayOfMappingsToMappingsTree(
    // Overloading does not seem to work nicely with dynamic types
    includeHeaders
      ? getArrayOfMappings(lines, true)
      : getArrayOfMappings(lines, false),
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
}: Omit<ChangeSelectElementValueAction, 'type' | 'close'> & {
  readonly lines: RA<MappingLine>;
  readonly mappingView: MappingPath;
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
   * type is the same (or non-existent in both cases) and the new box is a
   * -to-many index, a tree rank or a different relationship to the same table
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

// The maximum count of suggestions to show in the suggestions box
const MAX_SUGGESTIONS_COUNT = 3;

/*
 * Show automapper suggestion on top of an opened `CLOSED_LIST`
 * The automapper suggestions are shown only if the current box doesn't have
 * a value selected
 */
export async function getAutomapperSuggestions({
  lines,
  line,
  index,
  baseTableName,
}: SelectElementPosition & {
  readonly lines: RA<MappingLine>;
  readonly baseTableName: string;
}): Promise<RA<AutomapperSuggestion>> {
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

  const allAutomapperResults = Object.entries(
    new Automapper({
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
    }).map({
      commitToCache: false,
    })
  );

  if (allAutomapperResults.length === 0) return [];

  let automapperResults = allAutomapperResults[0][1];

  if (automapperResults.length > MAX_SUGGESTIONS_COUNT)
    automapperResults = automapperResults.slice(0, 3);

  return automapperResults.map((automapperResult) => ({
    mappingPath: automapperResult,
    mappingLineData: getMappingLineData({
      baseTableName,
      mappingPath: automapperResult,
      iterate: true,
      customSelectType: 'PREVIEW_LIST',
      getMappedFields: getMappedFields.bind(undefined, lines),
    }).slice(baseMappingPath.length - pathOffset),
  }));
}
