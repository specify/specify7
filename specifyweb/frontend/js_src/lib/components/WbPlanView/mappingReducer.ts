/**
 * WbPlanView Action's Reducer
 *
 * @module
 */

import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import { setCache } from '../../utils/cache';
import type { IR, RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { uniquifyHeaders } from './headerHelper';
import {
  deduplicateMappings,
  mappingPathIsComplete,
  mutateMappingPath,
} from './helpers';
import { defaultColumnOptions, getLinesFromHeaders } from './linesGetter';
import type {
  AutoMapperSuggestion,
  BatchEditPrefs,
  MappingLine,
  MappingPath,
  MappingState,
  SelectElementPosition,
} from './Mapper';
import { emptyMapping } from './mappingHelpers';
import type { MatchBehaviors } from './uploadPlanParser';

const modifyLine = (
  state: MappingState,
  line: number,
  mappingLine: Partial<MappingLine>
): RA<MappingLine> =>
  replaceItem(state.lines, line, {
    ...state.lines[line],
    ...mappingLine,
  });

// Actions
type ToggleMappingViewAction = Action<
  'ToggleMappingViewAction',
  {
    readonly isVisible: boolean;
  }
>;

type ToggleHiddenFieldsAction = Action<'ToggleHiddenFieldsAction'>;

type ResetMappingsAction = Action<'ResetMappingsAction'>;

type ValidationAction = Action<
  'ValidationAction',
  { readonly validationResults: RA<MappingPath> }
>;

type ClearValidationAction = Action<'ClearValidationAction'>;

type ClearMappingLineAction = Action<
  'ClearMappingLineAction',
  {
    readonly line: number;
  }
>;

type FocusLineAction = Action<
  'FocusLineAction',
  {
    readonly line: number;
  }
>;

type MappingViewMapAction = Action<'MappingViewMapAction'>;

type AddNewHeaderAction = Action<
  'AddNewHeaderAction',
  { readonly newHeaderName: string }
>;

type OpenSelectElementAction = Action<
  'OpenSelectElementAction',
  SelectElementPosition
>;

type CloseSelectElementAction = Action<'CloseSelectElementAction'>;

export type ChangeSelectElementValueAction = Action<
  'ChangeSelectElementValueAction',
  {
    readonly line: number | 'mappingView';
    readonly index: number;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly parentTableName: keyof Tables | undefined;
    readonly newTableName: keyof Tables | undefined;
    readonly currentTableName: keyof Tables | undefined;
  }
>;

type AutoMapperSuggestionsLoadedAction = Action<
  'AutoMapperSuggestionsLoadedAction',
  {
    readonly autoMapperSuggestions: RA<AutoMapperSuggestion>;
  }
>;

type AutoMapperSuggestionSelectedAction = Action<
  'AutoMapperSuggestionSelectedAction',
  {
    readonly suggestion: string;
  }
>;

type ValidationResultClickAction = Action<
  'ValidationResultClickAction',
  {
    readonly mappingPath: MappingPath;
  }
>;

type ChangMustMatchPrefAction = Action<
  'ChangeMustMatchPrefAction',
  {
    readonly mustMatchPreferences: IR<boolean>;
  }
>;

type ChangeMatchBehaviorAction = Action<
  'ChangeMatchBehaviorAction',
  {
    readonly line: number;
    readonly matchBehavior: MatchBehaviors;
  }
>;

type ToggleAllowNullsAction = Action<
  'ToggleAllowNullsAction',
  {
    readonly line: number;
    readonly allowNull: boolean;
  }
>;

type ChangeDefaultValueAction = Action<
  'ChangeDefaultValueAction',
  {
    readonly line: number;
    readonly defaultValue: string | null;
  }
>;

type UpdateLinesAction = Action<
  'UpdateLinesAction',
  { readonly lines: RA<MappingLine> }
>;

type ReRunAutoMapperAction = Action<
  'ReRunAutoMapperAction',
  {
    readonly baseTableName: keyof Tables;
  }
>;

type ChangeBatchEditPrefs = Action<
  "ChangeBatchEditPrefs",
  {
    readonly prefs: BatchEditPrefs
  }
>;

export type MappingActions =
  | AddNewHeaderAction
  | AutoMapperSuggestionSelectedAction
  | AutoMapperSuggestionsLoadedAction
  | ChangeDefaultValueAction
  | ChangeMatchBehaviorAction
  | ChangeSelectElementValueAction
  | ClearMappingLineAction
  | ClearValidationAction
  | CloseSelectElementAction
  | FocusLineAction
  | MappingViewMapAction
  | ChangMustMatchPrefAction
  | OpenSelectElementAction
  | ReRunAutoMapperAction
  | ResetMappingsAction
  | ToggleAllowNullsAction
  | ToggleHiddenFieldsAction
  | ToggleMappingViewAction
  | UpdateLinesAction
  | ValidationAction
  | ValidationResultClickAction
  | ChangeBatchEditPrefs;

export const reducer = generateReducer<MappingState, MappingActions>({
  /* Workbench Actions (Shared with Batch-Edit) */
  ToggleMappingViewAction: ({ state, action }) => ({
    ...state,
    // REFACTOR: replace setState calls in reducers with useCachedState hooks
    showMappingView: setCache(
      'wbPlanViewUi',
      'showMappingView',
      action.isVisible
    ),
  }),
  ValidationAction: ({ state, action: { validationResults } }) => ({
    ...state,
    validationResults,
    mappingsAreValidated: validationResults.length === 0,
  }),
  ClearValidationAction: ({ state }) => ({
    ...state,
    validationResults: [],
  }),
  ResetMappingsAction: ({ state }) => ({
    ...state,
    lines: state.lines.map((line) => ({
      ...line,
      mappingPath: [emptyMapping],
      columnOptions: defaultColumnOptions,
    })),
    changesMade: true,
    mappingsAreValidated: false,
    validationResults: [],
  }),
  ClearMappingLineAction: ({ state, action }) => ({
    ...state,
    lines: modifyLine(state, action.line, {
      mappingPath: [emptyMapping],
      columnOptions: defaultColumnOptions,
    }),
    changesMade: true,
    mappingsAreValidated: false,
  }),
  FocusLineAction: ({ state, action }) => {
    if (action.line >= state.lines.length)
      softFail(new Error(`Tried to focus a line that doesn't exist`));

    const focusedLineMappingPath = state.lines[action.line].mappingPath;
    return {
      ...state,
      focusedLine: action.line,
      mappingView: mappingPathIsComplete(focusedLineMappingPath)
        ? focusedLineMappingPath
        : state.mappingView,
    };
  },
  MappingViewMapAction: ({ state }) => {
    const mappingViewMappingPath = state.mappingView;
    const focusedLine = state.focusedLine;
    /*
     * This is needed here to prevent double-click on an incomplete path
     * from mapping
     */
    if (
      !mappingPathIsComplete(mappingViewMappingPath) ||
      focusedLine >= state.lines.length
    )
      return state;

    return {
      ...state,
      lines: replaceItem(state.lines, focusedLine, {
        ...state.lines[focusedLine],
        mappingPath: mappingViewMappingPath,
      }),
      changesMade: true,
      mappingsAreValidated: false,
    };
  },
  AddNewHeaderAction: ({ action: { newHeaderName }, state }) => ({
    ...state,
    lines: [
      ...state.lines,
      {
        headerName: uniquifyHeaders(
          [...state.lines.map(({ headerName }) => headerName), newHeaderName],
          [state.lines.length]
        ).at(-1)!,
        mappingPath: [emptyMapping],
        columnOptions: defaultColumnOptions,
      },
    ],
    focusedLine: state.lines.length,
    mappingsAreValidated: false,
  }),
  ToggleHiddenFieldsAction: ({ state }) => ({
    ...state,
    showHiddenFields: setCache(
      'wbPlanViewUi',
      'showHiddenFields',
      !state.showHiddenFields
    ),
    revealHiddenFieldsClicked: true,
  }),
  OpenSelectElementAction: ({ state, action }) => ({
    ...state,
    openSelectElement: {
      line: action.line,
      index: action.index,
    },
  }),
  CloseSelectElementAction: ({ state }) => ({
    ...state,
    openSelectElement: undefined,
    autoMapperSuggestions: undefined,
  }),
  ChangeSelectElementValueAction: ({ state, action: { line, ...action } }) => {
    const newMappingPath = mutateMappingPath({
      ...action,
      mappingPath:
        line === 'mappingView'
          ? state.mappingView
          : state.lines[line].mappingPath,
    });

    if (line === 'mappingView')
      return {
        ...state,
        mappingView: newMappingPath,
      };

    return {
      ...state,
      lines: deduplicateMappings(
        modifyLine(state, line, {
          mappingPath: newMappingPath,
        }),
        state.openSelectElement?.line ?? false
      ),
      autoMapperSuggestions: undefined,
      changesMade: true,
      mappingsAreValidated: false,
    };
  },
  AutoMapperSuggestionsLoadedAction: ({ state, action }) => ({
    ...state,
    autoMapperSuggestions: action.autoMapperSuggestions,
  }),
  AutoMapperSuggestionSelectedAction: ({ state, action: { suggestion } }) => ({
    ...state,
    lines: modifyLine(state, state.openSelectElement!.line, {
      mappingPath:
        state.autoMapperSuggestions![Number(suggestion) - 1].mappingPath,
    }),
    openSelectElement: undefined,
    autoMapperSuggestions: undefined,
    changesMade: true,
    mappingsAreValidated: false,
  }),
  ValidationResultClickAction: ({ state, action: { mappingPath } }) => ({
    ...state,
    mappingView: mappingPath,
  }),
  ChangeMustMatchPrefAction: ({ state, action }) => ({
    ...state,
    changesMade: true,
    mustMatchPreferences: action.mustMatchPreferences,
  }),
  ChangeMatchBehaviorAction: ({ state, action }) => ({
    ...state,
    lines: modifyLine(state, action.line, {
      ...state.lines[action.line],
      columnOptions: {
        ...state.lines[action.line].columnOptions,
        matchBehavior: action.matchBehavior,
      },
    }),
    changesMade: true,
  }),
  ToggleAllowNullsAction: ({ state, action }) => ({
    ...state,
    lines: modifyLine(state, action.line, {
      ...state.lines[action.line],
      columnOptions: {
        ...state.lines[action.line].columnOptions,
        nullAllowed: action.allowNull,
      },
    }),
    changesMade: true,
  }),
  ChangeDefaultValueAction: ({ state, action }) => ({
    ...state,
    lines: modifyLine(state, action.line, {
      ...state.lines[action.line],
      columnOptions: {
        ...state.lines[action.line].columnOptions,
        default: action.defaultValue,
      },
    }),
    changesMade: true,
  }),
  UpdateLinesAction: ({ state, action: { lines } }) => ({
    ...state,
    lines,
  }),
  ReRunAutoMapperAction({ state, action: { baseTableName } }) {
    const lines = getLinesFromHeaders({
      headers: state.lines.map(({ headerName }) => headerName),
      runAutoMapper: true,
      baseTableName,
    });
    return {
      ...state,
      changesMade:
        state.changesMade ||
        JSON.stringify(state.lines) !== JSON.stringify(lines),
      lines,
    };
  },
  /* Batch-Edit Specific Actions */
  ChangeBatchEditPrefs: ({state, action})=>({...state, changesMade: true, batchEditPrefs: action.prefs})
});
