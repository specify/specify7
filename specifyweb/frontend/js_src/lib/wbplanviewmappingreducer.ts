/**
 * WbPlanView Action's Reducer
 *
 * @module
 */

import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import { setCache } from './cache';
import type {
  AutoMapperSuggestion,
  MappingLine,
  MappingPath,
  MappingState,
  SelectElementPosition,
} from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { f } from './functools';
import { replaceItem } from './helpers';
import type { IR, RA } from './types';
import type { MatchBehaviors } from './uploadplanparser';
import { uniquifyHeaders } from './wbplanviewheaderhelper';
import {
  defaultColumnOptions,
  getLinesFromHeaders,
} from './wbplanviewlinesgetter';
import {
  deduplicateMappings,
  mappingPathIsComplete,
  mutateMappingPath,
} from './wbplanviewutils';

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
    isVisible: boolean;
  }
>;

type ToggleHiddenFieldsAction = Action<'ToggleHiddenFieldsAction'>;

type ResetMappingsAction = Action<'ResetMappingsAction'>;

type ValidationAction = Action<
  'ValidationAction',
  { validationResults: RA<MappingPath> }
>;

type ClearValidationAction = Action<'ClearValidationAction'>;

type ClearMappingLineAction = Action<
  'ClearMappingLineAction',
  {
    line: number;
  }
>;

type FocusLineAction = Action<
  'FocusLineAction',
  {
    line: number;
  }
>;

type MappingViewMapAction = Action<'MappingViewMapAction'>;

type AddNewHeaderAction = Action<
  'AddNewHeaderAction',
  { newHeaderName: string }
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
    readonly close: boolean;
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
    autoMapperSuggestions: RA<AutoMapperSuggestion>;
  }
>;

type AutoMapperSuggestionSelectedAction = Action<
  'AutoMapperSuggestionSelectedAction',
  {
    suggestion: string;
  }
>;

type ValidationResultClickAction = Action<
  'ValidationResultClickAction',
  {
    mappingPath: MappingPath;
  }
>;

type MustMatchPrefChangeAction = Action<
  'MustMatchPrefChangeAction',
  {
    mustMatchPreferences: IR<boolean>;
  }
>;

type ChangeMatchBehaviorAction = Action<
  'ChangeMatchBehaviorAction',
  {
    line: number;
    matchBehavior: MatchBehaviors;
  }
>;

type ToggleAllowNullsAction = Action<
  'ToggleAllowNullsAction',
  {
    line: number;
    allowNull: boolean;
  }
>;

type ChangeDefaultValueAction = Action<
  'ChangeDefaultValueAction',
  {
    line: number;
    defaultValue: string | null;
  }
>;

type UpdateLinesAction = Action<
  'UpdateLinesAction',
  { lines: RA<MappingLine> }
>;

type ReRunAutoMapperAction = Action<
  'ReRunAutoMapperAction',
  {
    baseTableName: keyof Tables;
  }
>;

export type MappingActions =
  | ToggleMappingViewAction
  | ToggleHiddenFieldsAction
  | ResetMappingsAction
  | ValidationAction
  | ClearValidationAction
  | ClearMappingLineAction
  | FocusLineAction
  | MappingViewMapAction
  | AddNewHeaderAction
  | OpenSelectElementAction
  | CloseSelectElementAction
  | ChangeSelectElementValueAction
  | AutoMapperSuggestionsLoadedAction
  | AutoMapperSuggestionSelectedAction
  | ValidationResultClickAction
  | MustMatchPrefChangeAction
  | ChangeMatchBehaviorAction
  | ToggleAllowNullsAction
  | ChangeDefaultValueAction
  | UpdateLinesAction
  | ReRunAutoMapperAction;

export const reducer = generateReducer<MappingState, MappingActions>({
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
      mappingPath: ['0'],
      columnOptions: defaultColumnOptions,
    })),
    changesMade: true,
    mappingsAreValidated: false,
    validationResults: [],
  }),
  ClearMappingLineAction: ({ state, action }) => ({
    ...state,
    lines: modifyLine(state, action.line, {
      mappingPath: ['0'],
      columnOptions: defaultColumnOptions,
    }),
    changesMade: true,
    mappingsAreValidated: false,
  }),
  FocusLineAction: ({ state, action }) => {
    if (action.line >= state.lines.length)
      throw new Error(`Tried to focus a line that doesn't exist`);

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
        ).slice(-1)[0],
        mappingPath: ['0'],
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
  ChangeSelectElementValueAction: ({ state, action }) => {
    const newMappingPath = mutateMappingPath({
      lines: state.lines,
      mappingView: state.mappingView,
      line: action.line,
      index: action.index,
      newValue: action.newValue,
      isRelationship: action.isRelationship,
      parentTableName: action.parentTableName,
      currentTableName: action.currentTableName,
      newTableName: action.newTableName,
    });

    if (action.line === 'mappingView')
      return {
        ...state,
        mappingView: newMappingPath,
      };

    return {
      ...state,
      lines: deduplicateMappings(
        modifyLine(state, action.line, {
          mappingPath: newMappingPath,
        }),
        state.openSelectElement?.line ?? false
      ),
      openSelectElement: action.close ? undefined : state.openSelectElement,
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
  MustMatchPrefChangeAction: ({ state, action }) => ({
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
  ReRunAutoMapperAction: ({ state, action: { baseTableName } }) =>
    f.var(
      getLinesFromHeaders({
        headers: state.lines.map(({ headerName }) => headerName),
        runAutoMapper: true,
        baseTableName,
      }),
      (lines) => ({
        ...state,
        changesMade:
          state.changesMade ||
          JSON.stringify(state.lines) !== JSON.stringify(lines),
        lines,
      })
    ),
});
