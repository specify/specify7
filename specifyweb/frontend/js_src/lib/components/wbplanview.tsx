/*
*
* Workbench plan mapper
*
* */

'use strict';

import React                  from 'react';
import '../../css/wbplanview.css';
import navigation             from '../navigation';
import * as cache             from '../wbplanviewcache';
import schema                 from '../schema';
import fetchDataModel         from '../wbplanviewmodelfetcher';
import WBPlanViewMapper, {
  AutomapperSuggestion,
  deduplicateMappings,
  defaultLineOptions,
  defaultMappingViewHeight,
  getAutomapperSuggestions,
  getLinesFromHeaders,
  getLinesFromUploadPlan,
  goBack,
  MappingLine,
  MappingPath,
  mappingPathIsComplete,
  minMappingViewHeight,
  mutateMappingPath,
  savePlan,
  SelectElementPosition,
  validate,
  WBPlanViewMapperBaseProps,
}                             from './wbplanviewmapper';
import {
  LoadingScreen,
  ModalDialog,
}                             from './modaldialog';
import dataModelStorage       from '../wbplanviewmodel';
import { ListOfBaseTables }   from './wbplanviewcomponents';
import {
  Action,
  generateDispatch,
  generateReducer,
  State,
}                             from '../statemanagement';
import { Icon }               from './customselectelement';
import createBackboneView     from './reactbackboneextend';
import { JqueryPromise }      from '../legacytypes';
import {
  MatchBehaviors,
  UploadPlan,
  uploadPlanStringToObject,
}                             from '../wbplanviewconverter';
import { getMappingLineData } from '../wbplanviewnavigator';

// general definitions
export type Dataset = {
  id: number,
  name: string,
  columns: string[],
  rows: string[][],
  uploadplan: UploadPlan | null,
  uploaderstatus: Record<string, unknown> | null,
  uploadresult: Record<string, unknown> | null,
}

export interface SpecifyResource {
  readonly id: number;
  readonly get: (query: string) => SpecifyResource | any,
  readonly rget: (query: string) =>
    JqueryPromise<SpecifyResource | any>,
  readonly set: (query: string, value: any) => void,
  readonly save: () => void,
}

//states

interface LoadingStateBase<T extends string> extends State<T> {
  dispatchAction?: (action: WBPlanViewActions) => void,
}

type LoadTemplateSelectionState =
  LoadingStateBase<'LoadTemplateSelectionState'>

interface NavigateBackState extends State<'NavigateBackState'> {
  readonly wb: SpecifyResource,
}

type LoadingStates =
  LoadTemplateSelectionState
  | NavigateBackState;

export interface LoadingState extends State<'LoadingState'> {
  readonly loadingState?: LoadingStates,
  readonly dispatchAction?: WBPlanViewActions,
}

interface BaseTableSelectionState extends State<'BaseTableSelectionState'> {
  readonly showHiddenTables: boolean,
}

interface TemplateSelectionState extends State<'TemplateSelectionState'> {
  readonly templates: {
    datasetName: string,
    uploadPlan: UploadPlan
  }[],
}

export interface MappingState extends State<'MappingState'>,
  WBPlanViewMapperBaseProps {
  readonly automapperSuggestionsPromise?:
    Promise<AutomapperSuggestion[]>,
  readonly changesMade: boolean,
  readonly mappingsAreValidated: boolean,
  readonly displayMatchingOptionsDialog: boolean,
  readonly mustMatchPreferences: Record<string, boolean>,
}

type WBPlanViewStates =
  BaseTableSelectionState
  | LoadingState
  | TemplateSelectionState
  | MappingState;

type WBPlanViewStatesWithParams = WBPlanViewStates & {
  readonly dispatch: (action: WBPlanViewActions) => void,
  readonly props: WBPlanViewProps,
  readonly refObject: React.MutableRefObject<RefStates>,
  readonly refObjectDispatch: (action: RefActions) => void
}


//actions
interface OpenBaseTableSelectionAction
  extends Action<'OpenBaseTableSelectionAction'> {
  referrer?: WBPlanViewStates['type'],
}

interface SelectTableAction extends Action<'SelectTableAction'> {
  readonly tableName: string,
  readonly mappingIsTemplated: boolean,
  readonly headers: string[]
}

type ToggleHiddenTablesAction = Action<'ToggleHiddenTablesAction'>

interface UseTemplateAction extends Action<'UseTemplateAction'> {
  readonly dispatch: (action: WBPlanViewActions) => void,
}

type BaseTableSelectionActions =
  OpenBaseTableSelectionAction
  | SelectTableAction
  | ToggleHiddenTablesAction
  | UseTemplateAction;

type CancelTemplateSelectionAction =
  Action<'CancelTemplateSelectionAction'>

interface TemplatesLoadedAction extends Action<'TemplatesLoadedAction'> {
  readonly templates: {
    datasetName: string,
    uploadPlan: UploadPlan
  }[],
}

type TemplateSelectionActions =
  TemplatesLoadedAction
  | CancelTemplateSelectionAction;

type CancelMappingAction =
  Action<'CancelMappingAction'>
  & PublicWBPlanViewProps
  & PartialWBPlanViewProps;

type CommonActions = CancelMappingAction;

interface OpenMappingScreenAction
  extends Action<'OpenMappingScreenAction'> {
  readonly mappingIsTemplated: boolean,
  readonly headers: string[],
  readonly uploadPlan: UploadPlan | null,
}

interface SavePlanAction extends Action<'SavePlanAction'>,
  WBPlanViewWrapperProps,
  PublicWBPlanViewProps {
  readonly ignoreValidation?: boolean
}

type ToggleMappingViewAction = Action<'ToggleMappingViewAction'>

type ToggleMappingIsTemplatedAction =
  Action<'ToggleMappingIsTemplatedAction'>

type ToggleHiddenFieldsAction = Action<'ToggleHiddenFieldsAction'>

type ResetMappingsAction = Action<'ResetMappingsAction'>

type ValidationAction = Action<'ValidationAction'>

interface ClearMappingLineAction
  extends Action<'ClearMappingLineAction'> {
  readonly line: number,
}

interface FocusLineAction extends Action<'FocusLineAction'> {
  readonly line: number,
}

type MappingViewMapAction = Action<'MappingViewMapAction'>

type AddNewHeaderAction = Action<'AddNewHeaderAction'>

type AddNewStaticHeaderAction = Action<'AddNewStaticHeaderAction'>

type OpenSelectElementAction =
  Action<'OpenSelectElementAction'>
  & SelectElementPosition

type CloseSelectElementAction = Action<'CloseSelectElementAction'>

export interface ChangeSelectElementValueAction
  extends Action<'ChangeSelectElementValueAction'> {
  readonly value: string,
  readonly isRelationship: boolean,
  readonly line: number | 'mappingView',
  readonly index: number,
  readonly currentTableName: string,
  readonly newTableName: string,
}

interface AutomapperSuggestionsLoadedAction
  extends Action<'AutomapperSuggestionsLoadedAction'> {
  readonly automapperSuggestions: AutomapperSuggestion[],
}

interface AutomapperSuggestionSelectedAction
  extends Action<'AutomapperSuggestionSelectedAction'> {
  readonly suggestion: string,
}

interface StaticHeaderChangeAction
  extends Action<'StaticHeaderChangeAction'> {
  readonly line: number,
  readonly event: React.ChangeEvent<HTMLTextAreaElement>,
}

interface ValidationResultClickAction
  extends Action<'ValidationResultClickAction'> {
  readonly mappingPath: MappingPath,
}

type OpenMatchingLogicDialogAction =
  Action<'OpenMatchingLogicDialogAction'>;

type CloseMatchingLogicDialogAction =
  Action<'CloseMatchingLogicDialogAction'>;

interface MustMatchPrefChangeAction
  extends Action<'MustMatchPrefChangeAction'> {
  readonly tableName: string,
  readonly mustMatch: boolean,
}

interface ChangeMatchBehaviorAction
  extends Action<'ChangeMatchBehaviorAction'> {
  readonly line: number,
  readonly matchBehavior: MatchBehaviors,
}

interface ToggleAllowNullsAction
  extends Action<'ToggleAllowNullsAction'> {
  readonly line: number,
  readonly allowNull: boolean,
}

interface ChangeDefaultValue
  extends Action<'ChangeDefaultValue'> {
  readonly line: number,
  readonly defaultValue: string | null,
}

export type MappingActions =
  OpenMappingScreenAction
  | SavePlanAction
  | ToggleMappingViewAction
  | ToggleMappingIsTemplatedAction
  | ToggleHiddenFieldsAction
  | ResetMappingsAction
  | ValidationAction
  | ClearMappingLineAction
  | FocusLineAction
  | MappingViewMapAction
  | AddNewHeaderAction
  | AddNewStaticHeaderAction
  | OpenSelectElementAction
  | CloseSelectElementAction
  | ChangeSelectElementValueAction
  | AutomapperSuggestionsLoadedAction
  | AutomapperSuggestionSelectedAction
  | StaticHeaderChangeAction
  | ValidationResultClickAction
  | OpenMatchingLogicDialogAction
  | MustMatchPrefChangeAction
  | CloseMatchingLogicDialogAction
  | ChangeMatchBehaviorAction
  | ToggleAllowNullsAction
  | ChangeDefaultValue;

type WBPlanViewActions =
  BaseTableSelectionActions
  | TemplateSelectionActions
  | CommonActions
  | MappingActions;


interface WBPlanViewProps extends WBPlanViewWrapperProps,
  PublicWBPlanViewProps {
  readonly uploadPlan: UploadPlan | null,
  readonly headers: string[],
  readonly setUnloadProtect: () => void,
}

interface PartialWBPlanViewProps {
  readonly removeUnloadProtect: () => void,
}

export interface WBPlanViewWrapperProps extends PartialWBPlanViewProps,
  PublicWBPlanViewProps {
  mappingIsTemplated: boolean,
  readonly setUnloadProtect: () => void,
}

export interface PublicWBPlanViewProps {
  dataset: Dataset,
}

interface WBPlanViewBackboneProps extends WBPlanViewWrapperProps,
  PublicWBPlanViewProps {
  header: HTMLElement,
  handleResize: () => void,
}


const schemaFetchedPromise = fetchDataModel();


function WBPlanViewHeader({
  stateType,
  title,
  buttonsLeft,
  buttonsRight,
}: {
  stateType: WBPlanViewStates['type'],
  title: string,
  buttonsLeft: JSX.Element,
  buttonsRight: JSX.Element
}): JSX.Element {
  return <div className={
    `wbplanview-header wbplanview-header-${stateType}`
  }>
    <div>
      <span>{title}</span>
      {buttonsLeft}
    </div>
    <div>{buttonsRight}</div>
  </div>;
}

function HeaderWrapper(props: {
  readonly children: React.ReactNode,
  readonly header: JSX.Element,
  readonly stateName: WBPlanViewStates['type'],
  readonly handleClick?: () => void,
  readonly extraContainerProps?: Record<string, unknown>
}): JSX.Element {
  return <div className="wbplanview-event-listener" onClick={(event) =>
    (
      (
        event.target as HTMLElement
      ).closest(
        '.custom-select-closed-list',
      ) === null &&
      (
        event.target as HTMLElement
      ).closest(
        '.custom-select-mapping-options-list',
      ) === null
      && props.handleClick
    ) ?
      props.handleClick() :
      undefined
  }>
    {props.header}
    <div
      className={
        `wbplanview-container wbplanview-container-${props.stateName}`
      }
      {...props.extraContainerProps}
    >
      {props.children}
    </div>
  </div>;
}

const getInitialWBPlanViewState = (
  props: OpenMappingScreenAction,
): WBPlanViewStates => (
  {
    type: 'LoadingState',
    dispatchAction: props.uploadPlan ?
      {
        ...props,
        type: 'OpenMappingScreenAction',
      } :
      {
        type: 'OpenBaseTableSelectionAction',
      },
  }
);


function mappingState(
  state: WBPlanViewStates,
): MappingState {
  if (state.type === 'MappingState')
    return state;
  else
    throw new Error('Dispatching this action requires the state ' +
      'to be of type `MappingState`');
}


const modifyLine = (
  state: MappingState,
  line: number,
  mappingLine: Partial<MappingLine>,
): MappingLine[] => [
  ...state.lines.slice(0, line),
  {
    ...state.lines[line],
    ...mappingLine,
  },
  ...state.lines.slice(line + 1),
];

const getDefaultMappingState = (): MappingState => (
  {
    type: 'MappingState',
    mappingIsTemplated: false,
    showHiddenFields:
      cache.get<boolean>(
        'ui',
        'showHiddenFields',
      ),
    showMappingView:
      cache.get<boolean>(
        'ui',
        'showMappingView',
        {
          defaultValue: true,
        },
      ),
    baseTableName: '',
    newHeaderId: 1,
    mappingView: ['0'],
    mappingsAreValidated: false,
    validationResults: [],
    lines: [],
    changesMade: false,
    displayMatchingOptionsDialog: false,
    mustMatchPreferences: {},
  }
);

const reducer = generateReducer<WBPlanViewStates, WBPlanViewActions>({

  //BaseTableSelectionState
  'OpenBaseTableSelectionAction': ({
    state,
    action,
  }) =>
    (
      !action.referrer || action.referrer === state.type
    ) ?
      (
        {
          type: 'BaseTableSelectionState',
          showHiddenTables:
            cache.get<boolean>(
              'ui',
              'showHiddenTables',
            ),
        }
      ) :
      state,
  'SelectTableAction': ({action}) => (
    {
      ...getDefaultMappingState(),
      mappingIsTemplated: action.mappingIsTemplated,
      baseTableName: action.tableName,
      lines: getLinesFromHeaders({
        headers: action.headers,
        runAutomapper: true,
        baseTableName: action.tableName,
      }),
    }
  ),
  'ToggleHiddenTablesAction': ({state}) => (
    {
      ...state,
      showHiddenTables: cache.set(
        'ui',
        'showHiddenTables',
        'showHiddenTables' in state ?
          !state.showHiddenTables :
          false,
        {
          overwrite: true,
          priorityCommit: true,
        },
      ),
    }
  ),
  'UseTemplateAction': ({action}) => (
    {
      type: 'LoadingState',
      loadingState: {
        type: 'LoadTemplateSelectionState',
        dispatchAction: action.dispatch,
      },
    }
  ),

  //TemplateSelectionState
  'TemplatesLoadedAction': ({action}) => (
    {
      type: 'TemplateSelectionState',
      templates: action.templates,
    }
  ),
  'CancelTemplateSelectionAction': () => (
    {
      type: 'BaseTableSelectionState',
      showHiddenTables: cache.get<boolean>(
        'ui',
        'showHiddenTables',
      ),
    }
  ),

  //common
  'CancelMappingAction': ({
    state,
    action,
  }) =>
    void (
      goBack(action)
    ) || state,

  //MappingState
  'OpenMappingScreenAction': ({
    action,
  }) => {
    if (!action.uploadPlan)
      throw new Error('Upload plan is not defined');

    const {
      baseTableName,
      lines,
      mustMatchPreferences,
    } = getLinesFromUploadPlan(
      action.headers,
      action.uploadPlan,
    );
    const newState: MappingState = {
      ...getDefaultMappingState(),
      mappingIsTemplated: action.mappingIsTemplated,
      mustMatchPreferences,
      baseTableName,
      lines,
    };

    if (
      newState.lines.some(({mappingPath}) =>
        mappingPath.length === 0,
      )
    )
      throw new Error('Mapping Path is invalid');

    return newState;
  },
  'SavePlanAction': ({
    state,
    action,
  }) =>
    savePlan(
      action,
      mappingState(state),
      action.ignoreValidation,
    ),
  'ToggleMappingViewAction': ({state}) => (
    {
      ...mappingState(state),
      showMappingView: cache.set(
        'ui',
        'showMappingView',
        !mappingState(state).showMappingView,
        {
          overwrite: true,
          priorityCommit: true,
        }),
    }
  ),
  'ToggleMappingIsTemplatedAction': ({state}) => (
    {
      ...mappingState(state),
      mappingIsTemplated:
        !mappingState(state).mappingIsTemplated,
    }
  ),
  'ValidationAction': ({state}) =>
    validate(mappingState(state)),
  'ResetMappingsAction': ({state}) => (
    {
      ...mappingState(state),
      lines: mappingState(state).lines.map(line => (
        {
          ...line,
          mappingPath: ['0'],
        }
      )),
      changesMade: true,
      mappingsAreValidated: false,
      validationResults: [],
    }
  ),
  'ClearMappingLineAction': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      lines: modifyLine(
        mappingState(state),
        action.line,
        {
          mappingPath: ['0'],
        },
      ),
      changesMade: true,
      mappingsAreValidated: false,
    }
  ),
  'FocusLineAction': ({
    state,
    action,
  }) => {
    if (action.line >= mappingState(state).lines.length)
      throw new Error(`Tried to focus a line that doesn't exist`);

    const focusedLineMappingPath =
      mappingState(state).lines[action.line].mappingPath;
    return {
      ...mappingState(state),
      focusedLine: action.line,
      mappingView:
        mappingPathIsComplete(focusedLineMappingPath) ?
          focusedLineMappingPath :
          mappingState(state).mappingView,
    };
  },
  'MappingViewMapAction': ({state}) => {
    const mappingViewMappingPath =
      mappingState(state).mappingView;
    const focusedLine = mappingState(state).focusedLine;
    if (
      !mappingPathIsComplete(mappingViewMappingPath) ||
      typeof focusedLine === 'undefined' ||
      focusedLine >= mappingState(state).lines.length
    )
      return state;

    return {
      ...mappingState(state),
      lines: [
        ...mappingState(state).lines.slice(0, focusedLine),
        {
          ...mappingState(state).lines[focusedLine],
          mappingPath: mappingViewMappingPath,
        },
        ...mappingState(state).lines.slice(focusedLine + 1),
      ],
      changesMade: true,
      mappingsAreValidated: false,
    };
  },
  'AddNewHeaderAction': ({state}) => (
    {
      ...mappingState(state),
      newHeaderId: mappingState(state).newHeaderId + 1,
      lines: [
        ...mappingState(state).lines,
        {
          name: `New Header ${
            mappingState(state).newHeaderId
          }`,
          type: 'newColumn',
          mappingPath: ['0'],
          options: defaultLineOptions,
        },
      ],
      changesMade: true,
      mappingsAreValidated: false,
    }
  ),
  'AddNewStaticHeaderAction': ({state}) => (
    {
      ...mappingState(state),
      lines: [
        ...mappingState(state).lines,
        {
          name: '',
          type: 'newStaticColumn',
          mappingPath: ['0'],
          options: defaultLineOptions,
        },
      ],
      changesMade: true,
      mappingsAreValidated: false,
    }
  ),
  'ToggleHiddenFieldsAction': ({state}) => (
    {
      ...mappingState(state),
      showHiddenFields: cache.set(
        'ui',
        'showHiddenFields',
        !mappingState(state).showHiddenFields,
        {
          overwrite: true,
          priorityCommit: true,
        }),
      revealHiddenFieldsClicked: true,
    }
  ),
  'OpenSelectElementAction': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      openSelectElement: {
        line: action.line,
        index: action.index,
      },
      automapperSuggestionsPromise:
        typeof mappingState(state).lines[action.line].mappingPath[
          action.index] === 'undefined' ?
          undefined :
          getAutomapperSuggestions({
              lines: mappingState(state).lines,
              line: action.line,
              index: action.index,
              baseTableName: mappingState(state).baseTableName,
            },
          ),
    }
  ),
  'CloseSelectElementAction': ({state}) =>
    state.type === 'MappingState' ?
      (
        {
          ...mappingState(state),
          openSelectElement: undefined,
          automapperSuggestionsPromise: undefined,
          automapperSuggestions: undefined,
        }
      ) :
      state,
  'ChangeSelectElementValueAction': ({
    state,
    action,
  }) => {
    const newMappingPath =
      mutateMappingPath({
          lines: mappingState(state).lines,
          mappingView: mappingState(state).mappingView,
          line: action.line,
          index: action.index,
          value: action.value,
          isRelationship: action.isRelationship,
          currentTableName: action.currentTableName,
          newTableName: action.newTableName,
        },
      );

    if (action.line === 'mappingView')
      return {
        ...mappingState(state),
        mappingView: newMappingPath,
      };

    return {
      ...mappingState(state),
      lines: deduplicateMappings(
        modifyLine(
          mappingState(state),
          action.line,
          {
            mappingPath: newMappingPath,
          },
        ),
        mappingState(
          state,
        ).openSelectElement?.line ?? false,
      ),
      openSelectElement: undefined,
      automapperSuggestionsPromise: undefined,
      automapperSuggestions: undefined,
      changesMade: true,
      mappingsAreValidated: false,
    };
  },
  'AutomapperSuggestionsLoadedAction': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      automapperSuggestions: action.automapperSuggestions,
      automapperSuggestionsPromise: undefined,
    }
  ),
  'AutomapperSuggestionSelectedAction': ({
    state,
    action: {suggestion},
  }) => (
    {
      ...mappingState(state),
      lines: modifyLine(
        mappingState(state),
        mappingState(state).openSelectElement!.line,
        {
          mappingPath: mappingState(
            state,
          ).automapperSuggestions![~~suggestion - 1].mappingPath,
        },
      ),
      openSelectElement: undefined,
      automapperSuggestionsPromise: undefined,
      automapperSuggestions: undefined,
      changesMade: true,
      mappingsAreValidated: false,
    }
  ),
  'StaticHeaderChangeAction': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      lines: modifyLine(
        mappingState(state),
        action.line,
        {
          name: action.event.target.value,
        },
      ),
    }
  ),
  'ValidationResultClickAction': ({
    state,
    action: {mappingPath},
  }) => (
    {
      ...mappingState(state),
      mappingView: mappingPath,
    }
  ),
  'OpenMatchingLogicDialogAction': ({
    state: originalState,
  }) => {

    const state = mappingState(originalState);

    const arrayOfMappingPaths = state.lines.map(line =>
      line.mappingPath,
    );
    const arrayOfMappingLineData = arrayOfMappingPaths.flatMap(
      mappingPath =>
        getMappingLineData({
          mappingPath,
          baseTableName: state.baseTableName,
          customSelectType: 'OPENED_LIST',
        }).filter((mappingElementData, index, list) => {
          if (
            index === 0 ||  // exclude base table
            // exclude -to-many
            mappingElementData.customSelectSubtype === 'toMany'
          )
            return false;

          if (typeof list[index - 1] === 'undefined') {

            if (
              state.baseTableName === 'collectionobject' &&
              list[index].tableName === 'collectingevent'
            )
              return false;

          }
          else {

            // exclude direct child of -to-many
            if (list[index - 1].customSelectSubtype === 'toMany')
              return false;

            // exclude embedded collecting event
            if (
              schema.embeddedCollectingEvent === true &&
              list[index - 1].tableName === 'collectionobject' &&
              list[index].tableName === 'collectingevent'
            )
              return false;
          }

          return true;
        }),
    );

    const arrayOfTables = arrayOfMappingLineData.map(
      mappingElementData =>
        mappingElementData.tableName || '',
    ).filter(tableName =>
      tableName &&
      typeof dataModelStorage.tables[tableName] !== 'undefined' &&
      !tableName.endsWith('attribute') &&
      (
        //exclude embedded paleo context
        schema.embeddedPaleoContext === false ||
        tableName !== 'paleocontext'
      ),
    );
    const distinctListOfTables = [...new Set(arrayOfTables)];
    const mustMatchPreferences = {
      ...Object.fromEntries(
        distinctListOfTables.map(tableName =>
          [tableName, false],
        ),
      ),
      ...state.mustMatchPreferences,
    };

    return {
      ...state,
      displayMatchingOptionsDialog: true,
      mustMatchPreferences,
    };
  },
  'CloseMatchingLogicDialogAction': ({state}) => (
    {
      ...mappingState(state),
      displayMatchingOptionsDialog: false,
    }
  ),
  'MustMatchPrefChangeAction': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      mustMatchPreferences: {
        ...mappingState(state).mustMatchPreferences,
        [action.tableName]: action.mustMatch,
      },
    }
  ),
  'ChangeMatchBehaviorAction': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      lines: modifyLine(
        mappingState(state),
        action.line,
        {
          ...mappingState(state).lines[action.line],
          options: {
            ...mappingState(state).lines[action.line].options,
            matchBehavior: action.matchBehavior,
          },
        },
      ),
    }
  ),
  'ToggleAllowNullsAction': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      lines: modifyLine(
        mappingState(state),
        action.line,
        {
          ...mappingState(state).lines[action.line],
          options: {
            ...mappingState(state).lines[action.line].options,
            nullAllowed: action.allowNull,
          },
        },
      ),
    }
  ),
  'ChangeDefaultValue': ({
    state,
    action,
  }) => (
    {
      ...mappingState(state),
      lines: modifyLine(
        mappingState(state),
        action.line,
        {
          ...mappingState(state).lines[action.line],
          options: {
            ...mappingState(state).lines[action.line].options,
            default: action.defaultValue,
          },
        },
      ),
    }
  ),
});

const loadingStateDispatch = generateDispatch<LoadingStates>({
  'LoadTemplateSelectionState': state => {

    if (typeof state.dispatchAction !== 'function')
      throw new Error('Dispatch function was not provided');

    const wbs = new (
      schema as any
    ).models.Workbench.LazyCollection({
      filters: {orderby: 'name', ownerpermissionlevel: 1},
    });
    wbs.fetch({limit: 5000}).done(() =>
      Promise.all(
        wbs.models.map((wb: any) =>
          wb.rget('workbenchtemplate'),
        ),
      ).then((workbenchTemplates: any) =>
        state.dispatchAction!({
          type: 'TemplatesLoadedAction',
          templates: workbenchTemplates.map((wbt: any) => [
            uploadPlanStringToObject(
              wbt.get('remarks') as string,
            ),
            wbt.get('name') as string,
          ]).filter(([uploadPlan]: [UploadPlan | null]) =>
            uploadPlan != null,
          ).map(([
            uploadPlan,
            datasetName,
          ]: [UploadPlan, string]) => (
            {
              datasetName,
              uploadPlan,
            }
          )),
        }),
      ).catch(error => {
        throw error;
      }),
    );
  },
  'NavigateBackState': state =>  // need to make the `Loading`
    // dialog
    // appear before the `Leave Page?` dialog
    setTimeout(() =>
      navigation.go(`/workbench/${state.wb.id}/`), 10,
    ),
});

const stateReducer = generateReducer<JSX.Element,
  WBPlanViewStatesWithParams>({
  'LoadingState': ({action: state}) => {
    if (typeof state.loadingState !== 'undefined')
      Promise.resolve('').then(() =>
        loadingStateDispatch(state.loadingState!),
      ).catch(error => {
        throw error;
      });
    if (typeof state.dispatchAction !== 'undefined')
      state.dispatch(state.dispatchAction);
    return <LoadingScreen />;
  },
  'BaseTableSelectionState': ({
    action: state,
  }) => <HeaderWrapper
    stateName={state.type}
    header={
      <WBPlanViewHeader
        title='Select Base Table'
        stateType={state.type}
        buttonsLeft={<label>
          <input
            type='checkbox'
            checked={state.showHiddenTables}
            onChange={() => state.dispatch({
              type: 'ToggleHiddenTablesAction',
            })}
          />
          Show advanced tables
        </label>}
        buttonsRight={<>
          <button onClick={() => state.dispatch({
            type: 'UseTemplateAction',
            dispatch: state.dispatch,
          })}>Use template
          </button>
          <button onClick={() => state.dispatch({
            type: 'CancelMappingAction',
            dataset: state.props.dataset,
            removeUnloadProtect: state.props.removeUnloadProtect,
          })}>Cancel
          </button>
        </>}
      />
    }>
    <ListOfBaseTables
      listOfTables={dataModelStorage.listOfBaseTables}
      showHiddenTables={state.showHiddenTables}
      handleChange={(
        (tableName: string) => state.dispatch({
          type: 'SelectTableAction',
          tableName,
          mappingIsTemplated: state.props.mappingIsTemplated,
          headers: state.props.headers,
        })
      )}
    />
  </HeaderWrapper>,
  'TemplateSelectionState': ({action: state}) =>
    <ModalDialog
      properties={{title: 'Select Template'}}
      onCloseCallback={() => state.dispatch({
        type: 'OpenBaseTableSelectionAction',
        referrer: state.type,
      })}
    >{
      state.templates.map(({datasetName}, index) =>
        <a key={index} onClick={() =>
          state.dispatch({
            type: 'OpenMappingScreenAction',
            uploadPlan: state.templates[index].uploadPlan,
            mappingIsTemplated: state.props.mappingIsTemplated,
            headers: state.props.headers,
          })
        }>{datasetName}</a>,
      )
    }</ModalDialog>,
  'MappingState': ({action: state}) => {
    const refObject = getRefMappingState(
      state.refObject,
      state,
    );

    if (typeof refObject.current.mappingViewHeight === 'undefined')
      refObject.current.mappingViewHeight = cache.get<number>(
        'ui',
        'mappingViewHeight',
        {
          defaultValue: defaultMappingViewHeight,
        },
      );

    const handleSave = (ignoreValidation: boolean) =>
      state.dispatch({
          type: 'SavePlanAction',
          dataset: state.props.dataset,
          removeUnloadProtect: state.props.removeUnloadProtect,
          setUnloadProtect: state.props.setUnloadProtect,
          mappingIsTemplated: state.mappingIsTemplated,
          ignoreValidation,
        },
      );
    const handleClose = () => state.dispatch({
      type: 'CloseSelectElementAction',
    });
    const handleMappingOptionsDialogClose = () => state.dispatch({
      type: 'CloseMatchingLogicDialogAction',
    });

    return <HeaderWrapper
      stateName={state.type}
      header={
        <WBPlanViewHeader
          title={
            dataModelStorage.tables[
              state.baseTableName
              ].tableFriendlyName
          }
          stateType={state.type}
          buttonsLeft={
            <button
              onClick={() => state.dispatch({
                type: 'OpenBaseTableSelectionAction',
              })}
            >Change table</button>
          }
          buttonsRight={<>
            {
              !state.showMappingView &&
              <button
                onClick={() =>
                  state.dispatch({
                    type: 'ToggleMappingViewAction',
                  })
                }
              >Show mapping view</button>
            }
            <button
              onClick={() => state.dispatch({
                type: 'OpenMatchingLogicDialogAction',
              })}
            >Matching logic
            </button>
            <button onClick={() => state.dispatch({
              type: 'ResetMappingsAction',
            })}>Clear Mappings
            </button>
            <button onClick={() =>
              void (
                state.dispatch({
                  type: 'ValidationAction',
                })
              ) ||
              void (
                state.refObjectDispatch({
                  type: 'AutoscrollStatusChangeAction',
                  autoscrollType: 'mappingView',
                  status: true,
                })
              )
            }>
              Check mappings
              {
                state.mappingsAreValidated &&
                <i style={{
                  color: '#4f2',
                  fontSize: '12px',
                }}>✓</i>
              }
            </button>
            <button onClick={
              () => handleSave(false)
            }>Save
            </button>
            <button onClick={() => state.dispatch({
              type: 'CancelMappingAction',
              dataset: state.props.dataset,
              removeUnloadProtect: state.props.removeUnloadProtect,
            })}>Cancel
            </button>
          </>}
        />
      }
      handleClick={handleClose}
    >
      <WBPlanViewMapper
        mappingIsTemplated={state.mappingIsTemplated}
        showHiddenFields={state.showHiddenFields}
        showMappingView={state.showMappingView}
        baseTableName={state.baseTableName}
        newHeaderId={state.newHeaderId}
        lines={state.lines}
        mappingView={state.mappingView}
        validationResults={state.validationResults}
        mapperDispatch={state.dispatch}
        openSelectElement={state.openSelectElement}
        automapperSuggestions={state.automapperSuggestions}
        focusedLine={state.focusedLine}
        refObject={refObject}
        handleSave={() => handleSave(true)}
        handleToggleHiddenFields={() =>
          state.dispatch({type: 'ToggleHiddenFieldsAction'})
        }
        handleFocus={(line: number) =>
          state.dispatch({
            type: 'FocusLineAction',
            line,
          })}
        handleMappingViewMap={() =>
          state.dispatch({type: 'MappingViewMapAction'})
        }
        handleAddNewHeader={() =>
          state.dispatch({type: 'AddNewHeaderAction'})
        }
        handleAddNewStaticHeader={() =>
          state.dispatch({type: 'AddNewStaticHeaderAction'})
        }
        handleAddNewColumn={() =>
          state.dispatch({type: 'AddNewHeaderAction'})
        }
        handleAddNewStaticColumn={() =>
          state.dispatch({type: 'AddNewStaticHeaderAction'})
        }
        handleOpen={(line: number, index: number) =>
          state.dispatch({
            type: 'OpenSelectElementAction',
            line,
            index,
          })
        }
        handleClose={handleClose}
        handleChange={(
          line: 'mappingView' | number,
          index: number,
          value: string,
          isRelationship: boolean,
          currentTableName: string,
          newTableName: string,
        ) => state.dispatch({
          type: 'ChangeSelectElementValueAction',
          line,
          index,
          value,
          isRelationship,
          currentTableName,
          newTableName,
        })}
        handleClearMapping={(line: number) =>
          state.dispatch({
            type: 'ClearMappingLineAction',
            line,
          })
        }
        handleStaticHeaderChange={(
          line: number,
          event: React.ChangeEvent<HTMLTextAreaElement>,
        ) => state.dispatch({
          type: 'StaticHeaderChangeAction',
          line,
          event,
        })}
        handleAutomapperSuggestionSelection={(suggestion: string) =>
          state.dispatch({
            type: 'AutomapperSuggestionSelectedAction',
            suggestion,
          })
        }
        handleValidationResultClick={(mappingPath: MappingPath) =>
          state.dispatch({
            type: 'ValidationResultClickAction',
            mappingPath,
          })
        }
        handleToggleMappingIsTemplated={() =>
          state.dispatch({
            type: 'ToggleMappingIsTemplatedAction',
          })
        }
        handleToggleMappingView={() =>
          state.dispatch({type: 'ToggleMappingViewAction'})
        }
        handleMappingViewResize={(height) =>
          state.refObjectDispatch({
            type: 'MappingViewResizeAction',
            height,
          })
        }
        handleAutoscrollStatusChange={(
          autoscrollType,
          status,
        ) =>
          state.refObjectDispatch({
            type: 'AutoscrollStatusChangeAction',
            autoscrollType,
            status,
          })}
        handleChangeMatchBehaviorAction={(
          line: number,
          matchBehavior: MatchBehaviors,
        ) => state.dispatch({
          type: 'ChangeMatchBehaviorAction',
          line,
          matchBehavior,
        })}
        handleToggleAllowNullsAction={(
          line: number,
          allowNull: boolean,
        ) => state.dispatch({
          type: 'ToggleAllowNullsAction',
          line,
          allowNull,
        })}
        handleChangeDefaultValue={(
          line: number,
          defaultValue: string | null,
        ) => state.dispatch({
          type: 'ChangeDefaultValue',
          line,
          defaultValue,
        })}
      />
      {
        state.displayMatchingOptionsDialog ?
          <ModalDialog
            onCloseCallback={handleMappingOptionsDialogClose}
            properties={{
              title: 'Change Matching Logic',
              buttons: {
                'Done': handleMappingOptionsDialogClose,
              },
            }}
          >{
            Object.keys(state.mustMatchPreferences).length === 0 ?
              'Matching logic is unavailable for current mappings' :
              <table>
                <thead>
                <tr>
                  <th>Table Name</th>
                  <th>Must Match</th>
                </tr>
                </thead>
                <tbody>{
                  Object.entries(
                    state.mustMatchPreferences,
                  ).map(([tableName, mustMatch]) => <tr
                    key={tableName}
                  >
                    <td>
                      <div className='must-match-line'>
                        <Icon
                          tableName={tableName}
                          optionLabel={tableName}
                          isRelationship={true}
                        />
                        {dataModelStorage.tables[
                          tableName
                          ].tableFriendlyName}
                      </div>
                    </td>
                    <td>
                      <label>
                        <input
                          type="checkbox"
                          checked={mustMatch}
                          onChange={() => state.dispatch({
                            type: 'MustMatchPrefChangeAction',
                            tableName,
                            mustMatch: !mustMatch,
                          })}
                        />
                      </label>
                    </td>
                  </tr>)
                }</tbody>
              </table>
          }</ModalDialog> :
          null
      }
    </HeaderWrapper>;
  },
});


type RefUndefinedState = State<'RefUndefinedState'>;
export type AutoScrollTypes =
  'listOfMappings'
  | 'mappingView';

export interface RefMappingState extends State<'RefMappingState'> {
  unloadProtectIsSet: boolean,
  mappingViewHeight: number,
  mappingViewHeightChangeTimeout: NodeJS.Timeout,
  autoscroll: Record<AutoScrollTypes, boolean>,
}

type RefStatesBase = RefUndefinedState | RefMappingState;
// make all properties optional, except for `type`
type RefStates = Partial<RefStatesBase> & State<RefStatesBase['type']>;

const refInitialState: RefUndefinedState = {
  type: 'RefUndefinedState',
};

const refStatesMapper = {
  'MappingState': 'RefMappingState',
} as const;
const flippedRefStatesMapper = Object.fromEntries(
  Object.entries(refStatesMapper).map(([k, v]) =>
    [v, k],
  ),
);

type RefChangeStateAction = Action<'RefChangeStateAction'>;
type RefSetUnloadProtectAction = Action<'RefSetUnloadProtectAction'>;
type RefUnsetUnloadProtectAction = Action<'RefUnsetUnloadProtectAction'>;

interface MappingViewResizeAction
  extends Action<'MappingViewResizeAction'> {
  height: number;
}

interface AutoscrollStatusChangeAction
  extends Action<'AutoscrollStatusChangeAction'> {
  autoscrollType: AutoScrollTypes,
  status: boolean,
}

type RefActions =
  RefChangeStateAction
  | RefSetUnloadProtectAction
  | RefUnsetUnloadProtectAction
  | MappingViewResizeAction
  | AutoscrollStatusChangeAction;

type RefActionsWithPayload = RefActions & {
  payload: {
    refObject: React.MutableRefObject<RefStates>,
    state: WBPlanViewStates,
    stateDispatch: (action: WBPlanViewActions) => void,
    props: WBPlanViewProps,
  }
};

function getRefMappingState(
  refObject: React.MutableRefObject<RefStates>,
  state: WBPlanViewStates,
  quiet = false,
): React.MutableRefObject<RefMappingState> {

  const refWrongStateMessage = 'Tried to change the refObject while' +
    'in a wrong state';

  if (state.type !== flippedRefStatesMapper[refObject.current.type])
    if (quiet)
      console.error(refWrongStateMessage);
    else
      throw Error(refWrongStateMessage);

  return refObject as React.MutableRefObject<RefMappingState>;

}

const refObjectDispatch = generateDispatch<RefActionsWithPayload>({
  'RefChangeStateAction': ({
    payload: {
      refObject,
      state,
    },
  }) => {
    refObject.current = {
      type: refStatesMapper[
        state.type as keyof typeof refStatesMapper
        ] ?? 'RefUndefinedState',
    };
  },
  'RefSetUnloadProtectAction': ({
    payload: {
      refObject,
      props,
      state,
    },
  }) => {
    props.removeUnloadProtect();
    getRefMappingState(
      refObject,
      state,
    ).current.unloadProtectIsSet = false;
  },
  'RefUnsetUnloadProtectAction': ({
    payload: {
      refObject,
      props,
      state,
    },
  }) => {
    props.removeUnloadProtect();
    getRefMappingState(
      refObject,
      state,
    ).current.unloadProtectIsSet = false;
  },
  'MappingViewResizeAction': ({
    height: initialHeight,
    payload: {
      refObject,
      state,
      stateDispatch,
    },
  }) => {
    const refMappingObject = getRefMappingState(
      refObject,
      state,
    );

    if (refMappingObject.current.mappingViewHeightChangeTimeout)
      clearTimeout(
        refMappingObject.current.mappingViewHeightChangeTimeout,
      );

    let height = initialHeight;
    if (initialHeight <= minMappingViewHeight) {
      height = minMappingViewHeight + 1;
      stateDispatch({
        type: 'ToggleMappingViewAction',
      });
    }

    refMappingObject.current.mappingViewHeight = height;
    refMappingObject.current.mappingViewHeightChangeTimeout =
      setTimeout(
        () =>
          cache.set(
            'ui',
            'mappingViewHeight',
            height,
            {
              overwrite: true,
              priorityCommit: true,
            },
          ),
        150,
      );
  },
  'AutoscrollStatusChangeAction': ({
    autoscrollType,
    status,
    payload: {
      refObject,
      state,
    },
  }) => {
    const refMappingObject = getRefMappingState(
      refObject,
      state,
    );

    refMappingObject.current.autoscroll ??= {
      mappingView: false,
      listOfMappings: false,
    };
    refMappingObject.current.autoscroll[autoscrollType] = status;
  },
});


function WBPlanView(props: WBPlanViewProps) {

  const [state, dispatch] = React.useReducer(
    reducer,
    {
      uploadPlan: props.uploadPlan,
      headers: props.headers,
      mappingIsTemplated: props.mappingIsTemplated,
    } as OpenMappingScreenAction,
    getInitialWBPlanViewState,
  );

  // `refObject` is like `state`, but does not cause re-render on change
  const refObject = React.useRef<RefStates>(refInitialState);
  const refObjectDispatchCurried = (action: RefActions) =>
    refObjectDispatch({
      ...action,
      payload: {
        refObject,
        state,
        props,
        stateDispatch: dispatch,
      },
    });

  // reset refObject on state change
  if (
    refObject.current.type !== (
      // @ts-ignore
      refStatesMapper[state.type] ?? 'RefUndefinedState'
    )
  )
    refObjectDispatchCurried({
      type: 'RefChangeStateAction',
    });

  // set/unset unload protect
  React.useEffect(() => {
    const changesMade = 'changesMade' in state ?
      state.changesMade :
      false;

    if (
      state.type === 'LoadingState' ||
      refObject.current.type !== 'RefMappingState'
    )
      return;

    if (refObject.current.unloadProtectIsSet && !changesMade)
      refObjectDispatchCurried({
        type: 'RefUnsetUnloadProtectAction',
      });
    else if (!refObject.current.unloadProtectIsSet && changesMade)
      refObjectDispatchCurried({
        type: 'RefSetUnloadProtectAction',
      });

  }, [
    'changesMade' in state ?
      state.changesMade :
      false,
  ]);

  // wait for automapper suggestions to fetch
  React.useEffect(() => {

    if (!(
      'automapperSuggestionsPromise' in state
    ))
      return;

    state.automapperSuggestionsPromise?.then(automapperSuggestions =>
      dispatch({
        type: 'AutomapperSuggestionsLoadedAction',
        automapperSuggestions,
      }),
    ).catch(console.error);

  }, [
    'automapperSuggestionsPromise' in state ?
      state.automapperSuggestionsPromise :
      undefined,
  ]);

  return stateReducer(<i />, {
    ...state,
    props,
    dispatch,
    refObject,
    refObjectDispatch: refObjectDispatchCurried,
  });

}

function WBPlanViewWrapper(props: WBPlanViewWrapperProps): JSX.Element {

  const [schemaLoaded, setSchemaLoaded] =
    React.useState<boolean>(
      typeof dataModelStorage.tables !== 'undefined',
    );

  React.useEffect(() => {
    if (schemaLoaded)
      return;

    schemaFetchedPromise.then(() =>
      setSchemaLoaded(true),
    ).catch(error => {
      throw error;
    });

  }, [schemaLoaded]);

  const uploadPlan = props.dataset.uploadplan ?
    props.dataset.uploadplan :
    null;
  return (
    schemaLoaded ?
      <WBPlanView {...props} uploadPlan={uploadPlan}
        headers={props.dataset.columns} />
      : <LoadingScreen />
  );
}


const setUnloadProtect = (self: WBPlanViewBackboneProps) =>
  navigation.addUnloadProtect(
    self,
    'This mapping has not been saved.',
  );

const removeUnloadProtect = (self: WBPlanViewBackboneProps) =>
  navigation.removeUnloadProtect(self);

export default createBackboneView<PublicWBPlanViewProps,
  WBPlanViewBackboneProps,
  WBPlanViewWrapperProps>
({
  moduleName: 'WBPlanView',
  title: (self) =>
    self.dataset.name,
  className: 'wb-plan-view',
  initialize(
    self,
    {dataset},
  ) {
    self.dataset = dataset;
    self.mappingIsTemplated = false;
    const header = document.getElementById('site-header');
    if (header === null)
      throw new Error(`Can't find site's header`);
    self.header = header;
    self.handleResize = () =>
      self.el.style.setProperty(
        '--menu-size',
        `${Math.ceil(self.header.clientHeight)}px`,
      );
  },
  renderPre(self) {
    self.el.classList.add('wbplanview');
  },
  renderPost(self) {
    self.handleResize();
    window.addEventListener('resize', self.handleResize);
  },
  remove(self) {
    window.removeEventListener('resize', self.handleResize);
    removeUnloadProtect(self);
  },
  Component: WBPlanViewWrapper,
  getComponentProps: self => (
    {
      dataset: self.dataset,
      removeUnloadProtect:
        removeUnloadProtect.bind(null, self),
      setUnloadProtect:
        setUnloadProtect.bind(null, self),
      mappingIsTemplated: self.mappingIsTemplated,
    }
  ),
});
