/*
*
* Contains WbPlanView logic for when the application is in the Mapping State
* (when base table is selected and headers are loaded)
*
* */

'use strict';

import $                                 from 'jquery';
import {
  arrayOfMappingsToMappingsTree,
  mappingsTreeToArrayOfMappings,
  MappingsTree,
  traverseTree,
}                                        from '../wbplanviewtreehelper';
import {
  findDuplicateMappings,
  fullMappingPathParser,
} from '../wbplanviewhelper';
import {
  MappingElement,
  MappingLine,
  MappingPath,
  MappingPathProps, StaticHeader,
} from './wbplanviewcomponents';
import {
  formatReferenceItem,
  getMaxToManyValue,
  showRequiredMissingFields,
  valueIsReferenceItem,
  valueIsTreeRank,
}                                        from '../wbplanviewmodelhelper';
import navigation                        from '../navigation';
import { getMappingLineData }            from '../wbplanviewnavigator';
import automapper, { AutoMapperResults } from '../automapper';
import {
  mappingsTreeToUploadPlan,
  MatchBehaviors,
  ColumnOptions,
  uploadPlanToMappingsTree,
  UploadPlan,
}                                        from '../wbplanviewconverter';
import React              from 'react';
import { namedComponent } from '../statemanagement';
import {
  AutoScrollTypes,
  ChangeSelectElementValueAction,
  LoadingState,
  MappingActions,
  MappingState,
  PublicWBPlanViewProps,
  RefMappingState,
  WBPlanViewWrapperProps,
}                         from './wbplanview';


/* Scope is used to differentiate between mapper definitions that should
* be used by the automapper and suggestion boxes*/
export type AutomapperScope =
  'automapper'  // used when selecting a base table
  | 'suggestion';  // suggestion boxes - used when opening a picklist
export type MappingPath = string[];
export type FullMappingPath = [...string[], MappingType, string, ColumnOptions];
export type ListOfHeaders = string[];
export type MappingType = 'existingHeader'
  | 'newColumn'
  | 'newStaticColumn';
export type RelationshipType = 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

export interface SelectElementPosition {
  readonly line: number,
  readonly index: number,
}

export interface MappingLine {
  readonly type: MappingType,
  readonly name: string,
  readonly mappingPath: MappingPath,
  readonly options: ColumnOptions
  readonly isFocused?: boolean,
}

export interface AutomapperSuggestion extends MappingPathProps {
  mappingPath: MappingPath,
}

export interface WBPlanViewMapperBaseProps {
  readonly mappingIsTemplated: boolean,
  readonly showHiddenFields: boolean,
  readonly showMappingView: boolean,
  readonly baseTableName: string,
  // the index that would be shown in the header name the next time the user
  // presses `New Column`
  readonly newHeaderId: number,
  readonly mappingView: MappingPath,
  readonly validationResults: MappingPath[],
  readonly lines: MappingLine[],
  readonly openSelectElement?: SelectElementPosition,
  readonly focusedLine?: number,
  readonly automapperSuggestions?: AutomapperSuggestion[],
}

export type GetMappedFieldsBind = (
  // a mapping path that would be used as a filter
  mappingPathFilter: MappingPath,
) => MappingsTree;

export type PathIsMappedBind = (
  // a mapping path that would be used as a filter
  mappingPathFilter: MappingPath,
) => boolean;


// the maximum count of suggestions to show in the suggestions box
const MAX_SUGGESTIONS_COUNT = 3;

const MappingsControlPanel = React.memo(namedComponent(
  'MappingsControlPanel',
  ({
    showHiddenFields,
    handleChange,
    mappingIsTemplated,
    handleToggleMappingIsTemplated,
    // handleAddNewColumn,
    // handleAddNewStaticColumn,
  }: {
    readonly showHiddenFields: boolean,
    readonly handleChange: () => void,
    readonly handleAddNewColumn: () => void,
    readonly handleAddNewStaticColumn: () => void,
    readonly mappingIsTemplated: boolean,
    readonly handleToggleMappingIsTemplated: () => void,
  }) =>
    <div>
      <label>
        <input
          type="checkbox"
          checked={mappingIsTemplated}
          onChange={handleToggleMappingIsTemplated}
        />
        Use this mapping as a template
      </label>
      {/*<button onClick={handleAddNewColumn}>Add new column</button>*/}
      {/*<button onClick={handleAddNewStaticColumn}>
        Add new static column
      </button>*/}
      <label>
        {' '}<input
        type="checkbox"
        checked={showHiddenFields}
        onChange={handleChange}
      />
        Reveal hidden fields
      </label>
    </div>),
);

function FormatValidationResults(props: {
  readonly baseTableName: string,
  readonly validationResults: MappingPath[],
  readonly handleSave: () => void
  readonly getMappedFields: GetMappedFieldsBind,
  readonly onValidationResultClick: (mappingPath: MappingPath) => void,
}) {
  if (props.validationResults.length === 0)
    return null;

  return <div className="validation-results">
    <span>
      The following fields should be mapped before you can upload
      the dataset:
    </span>
    {props.validationResults.map((fieldPath, index) =>
      <div
        className="wbplanview-mapping-line-elements"
        key={index}
        onClick={props.onValidationResultClick.bind(null, fieldPath)}
      >
        <MappingPath
          mappingLineData={getMappingLineData({
            baseTableName: props.baseTableName,
            mappingPath: fieldPath,
            generateLastRelationshipData: false,
            customSelectType: 'PREVIEW_LIST',
            getMappedFields: props.getMappedFields,
          })}
        />
      </div>,
    )}
    <span>
      Or you can <button
      onClick={props.handleSave}>Save Unfinished Mapping</button>
      and finish editing it later
    </span>
  </div>;
}

export const goBack = (props: PublicWBPlanViewProps): void =>
  navigation.go(`/workbench/${props.dataset.id}/`);

export function savePlan(
  props: WBPlanViewWrapperProps,
  state: MappingState,
  ignoreValidation = false,
): LoadingState | MappingState {
  const validationResultsState = validate(state);
  if (
    !ignoreValidation &&
    validationResultsState.validationResults.length !== 0
  )
    return validationResultsState;

  // props.wb.set('ownerPermissionLevel', props.mappingIsTemplated ? 1 : 0);
  const uploadPlan = mappingsTreeToUploadPlan(
    state.baseTableName,
    getMappingsTree(state.lines, true),
    state.mustMatchPreferences,
  );

  void (
    $.ajax(`/api/workbench/dataset/${props.dataset.id}/`, {
      type: 'PUT',
      data: JSON.stringify({
        'uploadplan':
        uploadPlan,
      }),
      dataType: 'json',
      processData: false,
    }).done(() => {

      if (state.changesMade)
        props.removeUnloadProtect();

      goBack(props);

    })
  );

  return state;
}

/* Validates the current mapping and shows error messages if needed */
export function validate(state: MappingState): MappingState {

  const validationResults = showRequiredMissingFields(
    state.baseTableName,
    getMappingsTree(state.lines, true),
  );

  return {
    ...state,
    type: 'MappingState',
    // Show mapping view panel if there were validation errors
    showMappingView:
      state.showMappingView ||
      Object.values(validationResults).length !== 0,
    mappingsAreValidated: Object.values(validationResults).length === 0,
    validationResults,
  };
}

export const defaultLineOptions: ColumnOptions = {
  matchBehavior: 'ignoreNever',
  nullAllowed: false,
  default: null,
} as const;

export function getLinesFromHeaders({
  headers = [],
  runAutomapper,
  baseTableName = '',
}: {
  headers?: ListOfHeaders
} & (
  {
    runAutomapper: true,
    baseTableName: string,
  } |
  {
    runAutomapper: false,
    baseTableName?: string,
  }
  )): MappingLine[] {

  const lines = headers.map((headerName): MappingLine => (
    {
      mappingPath: ['0'],
      type: 'existingHeader',
      name: headerName,
      options: defaultLineOptions,
    }
  ));

  if (!runAutomapper || typeof baseTableName === 'undefined')
    return lines;

  const automapperResults: AutoMapperResults = (
    new automapper({
      headers,
      baseTable: baseTableName,
      scope: 'automapper',
      checkForExistingMappings: false,
    })
  ).map();

  return lines.map(line => {
    const {name: headerName} = line;
    const automapperMappingPaths = automapperResults[headerName];
    if (typeof automapperMappingPaths === 'undefined')
      return line;
    else
      return {
        mappingPath: automapperMappingPaths[0],
        type: 'existingHeader',
        name: headerName,
        options: defaultLineOptions,
      };
  });

}

export function getLinesFromUploadPlan(
  headers: ListOfHeaders = [],
  uploadPlan: UploadPlan,
): {
  readonly baseTableName: string,
  readonly lines: MappingLine[],
  readonly mustMatchPreferences: Record<string, boolean>
} {

  const lines = getLinesFromHeaders({
    headers,
    runAutomapper: false,
  });
  const {
    baseTableName,
    mappingsTree,
    mustMatchPreferences,
  } = uploadPlanToMappingsTree(headers, uploadPlan);

  const arrayOfMappings = mappingsTreeToArrayOfMappings(mappingsTree);
  arrayOfMappings.forEach(fullMappingPath => {
    const [
      mappingPath,
      mappingType,
      headerName,
      options
    ] = fullMappingPathParser(fullMappingPath);
    const headerIndex = headers.indexOf(headerName);
    if (headerIndex !== -1)
      lines[headerIndex] = {
        mappingPath,
        type: mappingType,
        name: headerName,
        options
      };
  });

  return {
    baseTableName,
    lines,
    mustMatchPreferences,
  };

}

function getArrayOfMappings(
  lines: MappingLine[],
  includeHeaders:true
):FullMappingPath[];
function getArrayOfMappings(
  lines: MappingLine[],
  includeHeaders?:false
):MappingPath[];
function getArrayOfMappings(
  lines: MappingLine[],
  includeHeaders = false,
): (MappingPath|FullMappingPath)[] {
  return lines.filter(({mappingPath: mappingPath}) =>
    mappingPathIsComplete(mappingPath),
  ).map(({mappingPath, type, name, options}) =>
    includeHeaders ?
      [...mappingPath, type, name, options] :
      mappingPath,
  );
}

export const getMappingsTree = (
  lines: MappingLine[],
  includeHeaders = false,
): MappingsTree =>
  arrayOfMappingsToMappingsTree(
    // overloading does not seem to work nicely with dynamic types
    includeHeaders ?
      getArrayOfMappings(lines, true) :
      getArrayOfMappings(lines, false),
    includeHeaders
  );

/* Get a mappings tree branch given a particular starting mapping path */
export function getMappedFields(
  lines: MappingLine[],
  // a mapping path that would be used as a filter
  mappingPathFilter: MappingPath,
): MappingsTree {
  const mappingsTree = traverseTree(getMappingsTree(lines),mappingPathFilter);
  return typeof mappingsTree === 'object' ?
    mappingsTree :
    {};
}

export const pathIsMapped = (
  lines: MappingLine[],
  mappingPath: MappingPath,
): boolean =>
  Object.keys(
    getMappedFields(lines, mappingPath.slice(0, -1)),
  ).indexOf(mappingPath.slice(-1)[0]) !== -1;


export const mappingPathIsComplete = (mappingPath: MappingPath): boolean =>
  mappingPath[mappingPath.length - 1] !== '0';

/* Unmap headers that have a duplicate mapping path */
export function deduplicateMappings(
  lines: MappingLine[],
  focusedLine: number | false,
): MappingLine[] {

  const arrayOfMappings = getArrayOfMappings(lines);
  const duplicateMappingIndexes = findDuplicateMappings(
    arrayOfMappings,
    focusedLine,
  );

  return lines.map((line, index) =>
    duplicateMappingIndexes.indexOf(index) === -1 ?
      line :
      {
        ...line,
        mappingPath: line.mappingPath.slice(0, -1),
      },
  );

}


/*
* Show automapper suggestion on top of an opened `CLOSED_LIST`
* The automapper suggestions are shown only if the current box doesn't have
* a value selected
* */
export const getAutomapperSuggestions = ({
  lines,
  line,
  index,
  baseTableName,
}: SelectElementPosition & {
  readonly lines: MappingLine[],
  readonly baseTableName: string,
}): Promise<AutomapperSuggestion[]> =>
  new Promise((resolve) => {

    const localMappingPath = [...lines[line].mappingPath];

    if (  // don't show suggestions
      (  // if opened picklist has a value selected
        localMappingPath.length - 1 !== index ||
        mappingPathIsComplete(localMappingPath)
      ) ||  // or if header is a new column / new static column
      lines[line].type !== 'existingHeader'
    )
      return resolve([]);

    const mappingLineData = getMappingLineData({
      baseTableName,
      mappingPath: mappingPathIsComplete(localMappingPath) ?
        localMappingPath :
        localMappingPath.slice(0, localMappingPath.length - 1),
      iterate: false,
      customSelectType: 'SUGGESTION_LIST',
      getMappedFields: getMappedFields.bind(null, lines),
    });

    // don't show suggestions if picklist has only one field / no fields
    if (
      mappingLineData.length === 1 &&
      Object.keys(mappingLineData[0].fieldsData).length < 2
    )
      return resolve([]);

    const baseMappingPath = localMappingPath.slice(0, -1);

    let pathOffset = 0;
    if (
      mappingLineData.length === 1 &&
      mappingLineData[0].customSelectSubtype === 'toMany'
    ) {
      baseMappingPath.push('#1');
      pathOffset = 1;
    }

    const allAutomapperResults = Object.entries((
      new automapper({
        headers: [lines[line].name],
        baseTable: baseTableName,
        startingTable: mappingLineData.length === 0 ?
          baseTableName :
          mappingLineData[mappingLineData.length - 1].tableName,
        path: baseMappingPath,
        pathOffset,
        allowMultipleMappings: true,
        checkForExistingMappings: true,
        scope: 'suggestion',
        pathIsMapped: pathIsMapped.bind(null, lines),
      })
    ).map({
      commitToCache: false,
    }));

    if (allAutomapperResults.length === 0)
      return resolve([]);

    let automapperResults = allAutomapperResults[0][1];

    if (automapperResults.length > MAX_SUGGESTIONS_COUNT)
      automapperResults = automapperResults.slice(0, 3);

    resolve(automapperResults.map(automapperResult => (
      {
        mappingPath: automapperResult,
        mappingLineData: getMappingLineData({
          baseTableName,
          mappingPath: automapperResult,
          customSelectType: 'SUGGESTION_LINE_LIST',
          getMappedFields: getMappedFields.bind(null, lines),
        }).slice(baseMappingPath.length - pathOffset),
      }
    )));

  });

function MappingView(props: {
  readonly baseTableName: string,
  readonly focusedLineExists: boolean,
  readonly mappingPath: MappingPath,
  mapButtonIsEnabled: boolean,
  readonly handleMapButtonClick: () => void
  readonly handleMappingViewChange: (
    index: number,
    newValue: string,
    isRelationship: boolean,
    currentTable: string,
    newTable: string,
  ) => void,
  readonly getMappedFields: GetMappedFieldsBind,
  readonly automapperSuggestions?: AutomapperSuggestion[],
  readonly showHiddenFields?: boolean,
}) {

  const mappingLineData = getMappingLineData({
    baseTableName: props.baseTableName,
    mappingPath: props.mappingPath,
    generateLastRelationshipData: true,
    customSelectType: 'OPENED_LIST',
    handleChange: props.handleMappingViewChange,
    getMappedFields: props.getMappedFields,
    showHiddenFields: props.showHiddenFields,
  });
  const mapButtonIsEnabled =
    props.mapButtonIsEnabled && (
      Object.entries(
        mappingLineData[mappingLineData.length - 1]?.fieldsData,
      ).filter(([, {isDefault: isDefault}]) =>
        isDefault,
      )?.[0]?.[1].isEnabled ?? false
    );

  return <>
    <div className="mapping-view">
      <MappingPath
        mappingLineData={mappingLineData}
      />
    </div>
    <button
      className="wbplanview-mapping-view-map-button"
      disabled={!mapButtonIsEnabled}
      onClick={
        mapButtonIsEnabled && props.focusedLineExists ?
          props.handleMapButtonClick :
          undefined
      }
    >
      Map
      <span
        className="wbplanview-mapping-view-map-button-arrow">&#8594;</span>
    </button>
  </>;
}

export function mutateMappingPath({
  lines,
  mappingView,
  line,
  index,
  value,
  isRelationship,
  currentTableName,
  newTableName
}: Omit<ChangeSelectElementValueAction, 'type'> & {
  readonly lines: MappingLine[],
  readonly mappingView: MappingPath,
  readonly isRelationship: boolean,
  readonly currentTableName: string,
  readonly newTableName: string,
}): MappingPath {

  let mappingPath = [...(
    line === 'mappingView' ?
      mappingView :
      lines[line].mappingPath
  )];

  const changeMappingPath =
    !valueIsReferenceItem(value) &&
    !valueIsTreeRank(value) &&
    currentTableName !== newTableName;

  if (value === 'add') {
    const mappedFields = Object.keys(
      getMappedFields(lines, mappingPath.slice(0, index)),
    );
    const maxToManyValue = getMaxToManyValue(mappedFields);
    mappingPath[index] = formatReferenceItem(maxToManyValue + 1);
  }
  else if (changeMappingPath)
    mappingPath = [...mappingPath.slice(0, index), value];
  else
    mappingPath[index] = value;

  if ((
    changeMappingPath || isRelationship
  ) && mappingPath.length - 1 === index)
    return [...mappingPath, '0'];

  return mappingPath;

}

export const defaultMappingViewHeight = 300;
export const minMappingViewHeight = 250;


export default function WBPlanViewMapper(
  props: WBPlanViewMapperBaseProps & {
    readonly mapperDispatch: (action: MappingActions) => void,
    readonly refObject: React.MutableRefObject<Partial<RefMappingState>>
    readonly handleSave: () => void,
    readonly handleFocus: (lineIndex: number) => void,
    readonly handleMappingViewMap: () => void,
    readonly handleAddNewHeader: () => void,
    readonly handleAddNewStaticHeader: () => void,
    readonly handleToggleHiddenFields: () => void,
    readonly handleAddNewColumn: () => void,
    readonly handleAddNewStaticColumn: () => void,
    readonly handleOpen: (
      line: number,
      index: number,
    ) => void;
    readonly handleClose: () => void
    readonly handleChange: (
      line: 'mappingView' | number,
      index: number,
      newValue: string,
      isRelationship: boolean,
      currentTable: string,
      newTable: string,
    ) => void,
    readonly handleClearMapping: (
      index: number,
    ) => void,
    readonly handleStaticHeaderChange:
      (
        index: number,
        event: React.ChangeEvent<HTMLTextAreaElement>,
      ) => void,
    readonly handleAutomapperSuggestionSelection:
      (suggestion: string) => void,
    readonly handleValidationResultClick:
      (mappingPath: MappingPath) => void,
    readonly handleToggleMappingIsTemplated: () => void,
    readonly handleToggleMappingView: () => void,
    readonly handleMappingViewResize: (height: number) => void,
    readonly handleAutoscrollStatusChange: (
      autoscrollType: AutoScrollTypes,
      status: boolean,
    ) => void,
    readonly handleChangeMatchBehaviorAction: (
      line: number,
      matchBehavior: MatchBehaviors
    )=>void
    readonly handleToggleAllowNullsAction: (
      line: number,
      allowNull: boolean,
    )=>void,
    readonly handleChangeDefaultValue: (
      line: number,
      defaultValue: string|null
    )=>void
  }): JSX.Element {
  const getMappedFieldsBind = getMappedFields.bind(
    null,
    props.lines,
  );
  const listOfMappings = React.useRef<HTMLDivElement>(
    null,
  );

  const mappingViewParentRef = React.useRef<HTMLDivElement | null>(null);

  // scroll listOfMappings/mappingView/open picklist to correct position
  React.useEffect(() => {

    if (
      typeof props.refObject.current.autoscroll === 'undefined' ||
      !listOfMappings.current ||
      !mappingViewParentRef.current
    )
      return;

    (
      Object.entries(
        props.refObject.current.autoscroll,
      ) as [AutoScrollTypes, boolean][]
    ).filter(([, autoscroll]) =>
      autoscroll,
    ).map(([autoscrollType]) => {
      if (autoscrollType === 'listOfMappings') {

        if (!listOfMappings.current)
          return;

        listOfMappings.current.scrollTop =
          listOfMappings.current.scrollHeight;
      }

      if (autoscrollType === 'mappingView') {

        if (!mappingViewParentRef.current)
          return;

        if (props.validationResults.length !== 0)
          mappingViewParentRef.current.scrollLeft = 0;

      }

      props.handleAutoscrollStatusChange(
        autoscrollType,
        false,
      );

    });
  });

  // `resize` event listener for the mapping view
  React.useEffect(() => {

    if (
      // @ts-ignore
      typeof ResizeObserver === 'undefined' ||
      mappingViewParentRef === null ||
      !mappingViewParentRef.current
    )
      return;

    const resizeObserver =
      // @ts-ignore
      new ResizeObserver(() =>
        mappingViewParentRef.current &&
        props.handleMappingViewResize.bind(
          null,
          mappingViewParentRef.current.clientHeight,
        ),
      );

    resizeObserver.observe(mappingViewParentRef.current);

    return () =>
      resizeObserver.disconnect();
  }, [mappingViewParentRef.current]);

  // reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {

    if (
      typeof props.automapperSuggestions === 'undefined' ||
      props.automapperSuggestions.length === 0
    )
      return;

    if (listOfMappings.current === null)
      return;

    const automapperSuggestions =
      listOfMappings.current.getElementsByClassName(
        'custom-select-suggestion-list',
      )[0] as HTMLElement | undefined;

    if (!automapperSuggestions)
      return;

    const customSelectElement = automapperSuggestions.parentElement;

    if (!customSelectElement)
      return;

    const automapperSuggestionsHeight = automapperSuggestions.clientHeight;

    const listOfMappingsPosition = listOfMappings.current.offsetTop;
    const currentScrollTop = listOfMappings.current.scrollTop;
    const picklistPosition = customSelectElement.offsetTop;

    // suggestions list fits on the screen. nothing to do
    if (
      picklistPosition
      - listOfMappingsPosition
      - automapperSuggestionsHeight >= 0
    )
      return;

    if (!automapperSuggestions.classList.contains('controlled'))
      automapperSuggestions.classList.add('controlled');

    const suggestionsListPosition =
      picklistPosition - automapperSuggestionsHeight - currentScrollTop;

    const scrollPosition =
      picklistPosition - currentScrollTop - listOfMappingsPosition;

    // hide suggestions box once its parent picklist becomes hidden
    automapperSuggestions.style.visibility = scrollPosition > 0 ?
      'visible' :
      'hidden';

    if (scrollPosition > 0)
      automapperSuggestions.style.top = `${
        suggestionsListPosition
      }px`;

  }

  React.useEffect(
    repositionSuggestionBox,
    [props.automapperSuggestions, listOfMappings],
  );

  React.useEffect(() => {
    window.addEventListener('resize', repositionSuggestionBox);
    return () =>
      window.removeEventListener('resize', repositionSuggestionBox);
  }, []);

  return <>
    {
      props.showMappingView &&
      <div
        className="mapping-view-parent"
        style={{
          'minHeight': minMappingViewHeight,
          '--original-height':
            `${
              props.refObject.current.mappingViewHeight || ''
            }px`,
        } as React.CSSProperties}
        ref={mappingViewParentRef}
      >
        <div
          className="mapping-view-container"
        >
          <FormatValidationResults
            baseTableName={props.baseTableName}
            validationResults={props.validationResults}
            handleSave={props.handleSave}
            getMappedFields={getMappedFieldsBind}
            onValidationResultClick={
              props.handleValidationResultClick
            }
          />
          <MappingView
            baseTableName={props.baseTableName}
            focusedLineExists={
              typeof props.focusedLine !== 'undefined'
            }
            mappingPath={props.mappingView}
            showHiddenFields={props.showHiddenFields}
            mapButtonIsEnabled={
              typeof props.focusedLine !== 'undefined' &&
              mappingPathIsComplete(props.mappingView)
            }
            handleMapButtonClick={props.handleMappingViewMap}
            handleMappingViewChange={props.handleChange.bind(
              null,
              'mappingView',
            )}
            getMappedFields={getMappedFieldsBind}
            automapperSuggestions={props.automapperSuggestions}
          />
        </div>
      </div>
    }

    <div
      className="mapping-line-list"
      ref={listOfMappings}
      onScroll={repositionSuggestionBox}
    >{
      props.lines.map(({mappingPath, name, type, options}, index) =>
        <MappingLine
          key={index}
          headerName={name}
          mappingType={type}
          isFocused={index === props.focusedLine}
          handleFocus={props.handleFocus.bind(null, index)}
          handleClearMapping={props.handleClearMapping.bind(null, index)}
          handleStaticHeaderChange={
            props.handleStaticHeaderChange.bind(null, index)
          }
          lineData={
            getMappingLineData({
              baseTableName: props.baseTableName,
              mappingPath,
              generateLastRelationshipData: true,
              customSelectType: 'CLOSED_LIST',
              handleChange: props.handleChange.bind(null, index),
              handleOpen: props.handleOpen.bind(null, index),
              handleClose: props.handleClose.bind(null, index),
              handleAutomapperSuggestionSelection:
              props.handleAutomapperSuggestionSelection,
              getMappedFields: getMappedFieldsBind,
              openSelectElement:
                typeof props.openSelectElement !== 'undefined' &&
                props.openSelectElement.line === index ?
                  props.openSelectElement :
                  undefined,
              showHiddenFields: props.showHiddenFields,
              automapperSuggestions: props.automapperSuggestions,
              mappingOptionsMenuGenerator: ()=>({
                'matchBehavior': {
                  fieldFriendlyName: <label>
                    Match behavior:
                    <MappingElement
                      isOpen={true}
                      customSelectType='MAPPING_OPTION_LINE_LIST'
                      handleChange={(matchBehavior)=>
                        props.handleChangeMatchBehaviorAction(
                          index,
                          matchBehavior as MatchBehaviors,
                        )
                      }
                      fieldsData={{
                        'ignoreWhenBlank': {
                          fieldFriendlyName: 'Ignore when Blank',
                          title: 'When set to "Ignore when Blank" blank ' +
                            'values in this column will not be ' +
                            'considered for matching purposes. Blank ' +
                            'values are ignored when matching even if a ' +
                            'default value is provided',
                          isEnabled: true,
                          isRequired: false,
                          isHidden: false,
                          isDefault:
                            options.matchBehavior === 'ignoreWhenBlank',
                        },
                        'ignoreAlways': {
                          fieldFriendlyName: 'Always ignore',
                          title: 'When set to ignoreAlways the value in ' +
                            'this column will never be considered for ' +
                            'matching purposes, only for uploading.',
                          isEnabled: true,
                          isRequired: false,
                          isHidden: false,
                          isDefault:
                            options.matchBehavior === 'ignoreAlways',
                        },
                        'ignoreNever': {
                          fieldFriendlyName: 'Never ignore',
                          title: 'This column would always be considered ' +
                            'for matching purposes, regardless of it\'s ' +
                            'value',
                          isEnabled: true,
                          isRequired: false,
                          isHidden: false,
                          isDefault:
                            options.matchBehavior === 'ignoreNever',
                        }
                      }}
                    />
                  </label>,
                },
                'nullAllowed': {
                  fieldFriendlyName: <label>
                    <input
                      type='checkbox'
                      checked={options.nullAllowed}
                      onChange={(event)=>
                        props.handleToggleAllowNullsAction(
                          index,
                          event.target.checked,
                        )
                      }
                    />
                    {' '}Allow Null values
                  </label>
                },
                'default': {
                  fieldFriendlyName: <>
                    <label>
                      <input
                        type='checkbox'
                        checked={options.default !== null}
                        onChange={()=>
                          props.handleChangeDefaultValue(
                            index,
                            options.default === null ?
                              '' :
                              null,
                          )
                        }
                      />
                      {' '}Use default value{options.default !== null && ':'}
                    </label>
                    {
                      typeof options.default === 'string' &&
                      <>
                        <br />
                        <StaticHeader
                          defaultValue={options.default || ''}
                          onChange={(event)=>
                            props.handleChangeDefaultValue(
                              index,
                              event.target.value
                            )
                          }
                        />
                      </>
                    }
                  </>,
                  title: 'This value would be used in place of empty cells'
                }
              })
            })
          }
        />,
      )
    }</div>

    <MappingsControlPanel
      showHiddenFields={props.showHiddenFields}
      handleChange={props.handleToggleHiddenFields}
      handleAddNewColumn={props.handleAddNewColumn}
      handleAddNewStaticColumn={props.handleAddNewStaticColumn}
      handleToggleMappingIsTemplated={props.handleToggleMappingIsTemplated}
      mappingIsTemplated={props.mappingIsTemplated}
    />
  </>;

}
