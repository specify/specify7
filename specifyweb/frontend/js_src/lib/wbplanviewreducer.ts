import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import * as cache from './cache';
import type {
  PublicWbPlanViewProps,
  WbPlanViewWrapperProps,
} from './components/wbplanview';
import type {
  AutoMapperSuggestion,
  MappingLine,
  MappingPath,
  SelectElementPosition,
} from './components/wbplanviewmapper';
import type {
  MappingState,
  WbPlanViewStates,
} from './components/wbplanviewstate';
import {
  getDefaultMappingState,
  mappingState,
} from './components/wbplanviewstate';
import wbText from './localization/workbench';
import type { RA } from './types';
import type { MatchBehaviors, UploadPlan } from './uploadplantomappingstree';
import { uniquifyHeaders } from './wbplanviewheaderhelper';
import {
  defaultColumnOptions,
  getLinesFromHeaders,
  getLinesFromUploadPlan,
} from './wbplanviewlinesgetter';
import {
  deduplicateMappings,
  getAutoMapperSuggestions,
  getMustMatchTables,
  mappingPathIsComplete,
  mutateMappingPath,
  savePlan,
  validate,
} from './wbplanviewutils';

const modifyLine = (
  state: MappingState,
  line: number,
  mappingLine: Partial<MappingLine>
): RA<MappingLine> => [
  ...state.lines.slice(0, line),
  {
    ...state.lines[line],
    ...mappingLine,
  },
  ...state.lines.slice(line + 1),
];

// Actions
type OpenBaseTableSelectionAction = Action<
  'OpenBaseTableSelectionAction',
  {
    referrer?: WbPlanViewStates['type'];
  }
>;

type SelectTableAction = Action<
  'SelectTableAction',
  {
    baseTableName: string;
    headers: RA<string>;
  }
>;

type ToggleHiddenTablesAction = Action<'ToggleHiddenTablesAction'>;

type UseTemplateAction = Action<
  'UseTemplateAction',
  {
    readonly dispatch: (action: WbPlanViewActions) => void;
  }
>;

type BaseTableSelectionActions =
  | OpenBaseTableSelectionAction
  | SelectTableAction
  | ToggleHiddenTablesAction
  | UseTemplateAction;

type CancelTemplateSelectionAction = Action<'CancelTemplateSelectionAction'>;

type TemplateSelectionActions = CancelTemplateSelectionAction;

export type OpenMappingScreenAction = Action<
  'OpenMappingScreenAction',
  {
    readonly headers: RA<string>;
    readonly uploadPlan: UploadPlan | null;
    readonly changesMade: boolean;
  }
>;

type SavePlanAction = Action<
  'SavePlanAction',
  WbPlanViewWrapperProps &
    PublicWbPlanViewProps & {
      ignoreValidation?: boolean;
    }
>;

type ToggleMappingViewAction = Action<
  'ToggleMappingViewAction',
  {
    isVisible: boolean;
  }
>;

type ToggleHiddenFieldsAction = Action<'ToggleHiddenFieldsAction'>;

type ResetMappingsAction = Action<'ResetMappingsAction'>;

type ValidationAction = Action<'ValidationAction'>;

type ClearValidationResultsAction = Action<'ClearValidationResultsAction'>;

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

type AddNewHeaderAction = Action<'AddNewHeaderAction'>;

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
    readonly newTableName: string;
    readonly currentTableName: string;
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

type OpenMatchingLogicDialogAction = Action<'OpenMatchingLogicDialogAction'>;

type CloseMatchingLogicDialogAction = Action<'CloseMatchingLogicDialogAction'>;

type MustMatchPrefChangeAction = Action<
  'MustMatchPrefChangeAction',
  {
    tableName: string;
    mustMatch: boolean;
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

type ChangeDefaultValue = Action<
  'ChangeDefaultValue',
  {
    line: number;
    defaultValue: string | null;
  }
>;

export type MappingActions =
  | OpenMappingScreenAction
  | SavePlanAction
  | ToggleMappingViewAction
  | ToggleHiddenFieldsAction
  | ResetMappingsAction
  | ValidationAction
  | ClearValidationResultsAction
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
  | OpenMatchingLogicDialogAction
  | MustMatchPrefChangeAction
  | CloseMatchingLogicDialogAction
  | ChangeMatchBehaviorAction
  | ToggleAllowNullsAction
  | ChangeDefaultValue;

export type WbPlanViewActions =
  | BaseTableSelectionActions
  | TemplateSelectionActions
  | MappingActions;

export const reducer = generateReducer<WbPlanViewStates, WbPlanViewActions>({
  // BaseTableSelectionState
  OpenBaseTableSelectionAction: ({ state, action }) =>
    !action.referrer || action.referrer === state.type
      ? {
          type: 'BaseTableSelectionState',
          showHiddenTables: cache.get('wbPlanViewUi', 'showHiddenTables', {
            defaultValue: true,
          }),
        }
      : state,
  SelectTableAction: ({ action }) => ({
    ...getDefaultMappingState(),
    changesMade: true,
    baseTableName: action.baseTableName,
    lines: getLinesFromHeaders({
      headers: action.headers,
      runAutoMapper: true,
      baseTableName: action.baseTableName,
    }),
  }),
  ToggleHiddenTablesAction: ensureState(
    ['BaseTableSelectionState'],
    ({ state }) => ({
      ...state,
      showHiddenTables: cache.set(
        'wbPlanViewUi',
        'showHiddenTables',
        'showHiddenTables' in state ? !state.showHiddenTables : false,
        {
          overwrite: true,
        }
      ),
    })
  ),
  UseTemplateAction: () => ({
    type: 'TemplateSelectionState',
  }),

  // TemplateSelectionState
  CancelTemplateSelectionAction: () => ({
    type: 'BaseTableSelectionState',
    showHiddenTables: cache.get('wbPlanViewUi', 'showHiddenTables', {
      defaultValue: true,
    }),
  }),

  // MappingState
  OpenMappingScreenAction: ({ action }) => {
    if (!action.uploadPlan) throw new Error('Upload Plan is not defined');

    const { baseTableName, lines, mustMatchPreferences } =
      getLinesFromUploadPlan(action.headers, action.uploadPlan);
    const newState: MappingState = {
      ...getDefaultMappingState(),
      changesMade: action.changesMade,
      mustMatchPreferences,
      baseTableName,
      lines,
    };

    if (newState.lines.some(({ mappingPath }) => mappingPath.length === 0))
      throw new Error('Mapping Path is invalid');

    return newState;
  },
  SavePlanAction: ensureState(['MappingState'], ({ state, action }) => {
    const validationResultsState = validate(state);
    if (
      !action.ignoreValidation &&
      validationResultsState.validationResults.length > 0
    )
      return validationResultsState;
    else
      return {
        type: 'LoadingState',
        loadingState: {
          type: 'SavePlanState',
          state,
          props: action,
        },
      };
  }),
  ToggleMappingViewAction: ensureState(
    ['MappingState'],
    ({ state, action }) => ({
      ...state,
      showMappingView: cache.set(
        'wbPlanViewUi',
        'showMappingView',
        action.isVisible,
        {
          overwrite: true,
        }
      ),
    })
  ),
  ValidationAction: ensureState(['MappingState'], ({ state }) =>
    validate(state)
  ),
  ClearValidationResultsAction: ensureState(['MappingState'], ({ state }) => ({
    ...state,
    validationResults: [],
  }),
  ResetMappingsAction: ({ state }) => ({
    ...mappingState(state),
    lines: mappingState(state).lines.map((line) => ({
      ...line,
      mappingPath: ['0'],
      columnOptions: defaultColumnOptions,
    })),
    changesMade: true,
    mappingsAreValidated: false,
    validationResults: [],
  }),
  ClearMappingLineAction: ({ state, action }) => ({
    ...mappingState(state),
    lines: modifyLine(mappingState(state), action.line, {
      mappingPath: ['0'],
      columnOptions: defaultColumnOptions,
    }),
    changesMade: true,
    mappingsAreValidated: false,
  }),
  FocusLineAction: ({ state, action }) => {
    if (action.line >= mappingState(state).lines.length)
      throw new Error(`Tried to focus a line that doesn't exist`);

    const focusedLineMappingPath =
      mappingState(state).lines[action.line].mappingPath;
    return {
      ...mappingState(state),
      focusedLine: action.line,
      mappingView: mappingPathIsComplete(focusedLineMappingPath)
        ? focusedLineMappingPath
        : mappingState(state).mappingView,
    };
  },
  MappingViewMapAction: ({ state }) => {
    const mappingViewMappingPath = mappingState(state).mappingView;
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
  AddNewHeaderAction: ({ state }) => ({
    ...mappingState(state),
    newHeaderId: mappingState(state).newHeaderId + 1,
    lines: [
      ...mappingState(state).lines,
      {
        headerName: uniquifyHeaders(
          [
            ...mappingState(state).lines.map(({ headerName }) => headerName),
            wbText('newHeaderName')(mappingState(state).newHeaderId),
          ],
          [mappingState(state).lines.length]
        ).slice(-1)[0],
        mappingType: 'existingHeader',
        mappingPath: ['0'],
        columnOptions: defaultColumnOptions,
      },
    ],
    focusedLine: mappingState(state).lines.length,
    mappingsAreValidated: false,
  }),
  ToggleHiddenFieldsAction: ({ state }) => ({
    ...mappingState(state),
    showHiddenFields: cache.set(
      'wbPlanViewUi',
      'showHiddenFields',
      !mappingState(state).showHiddenFields,
      {
        overwrite: true,
      }
    ),
    revealHiddenFieldsClicked: true,
  }),
  OpenSelectElementAction: ({ state, action }) => ({
    ...mappingState(state),
    openSelectElement: {
      line: action.line,
      index: action.index,
    },
    autoMapperSuggestionsPromise:
      typeof mappingState(state).lines[action.line].mappingPath[
        action.index
      ] === 'undefined'
        ? undefined
        : getAutoMapperSuggestions({
            lines: mappingState(state).lines,
            line: action.line,
            index: action.index,
            baseTableName: mappingState(state).baseTableName,
          }),
  }),
  CloseSelectElementAction: ({ state }) =>
    state.type === 'MappingState'
      ? {
          ...mappingState(state),
          openSelectElement: undefined,
          autoMapperSuggestionsPromise: undefined,
          autoMapperSuggestions: undefined,
        }
      : state,
  ChangeSelectElementValueAction: ({ state, action }) => {
    const newMappingPath = mutateMappingPath({
      lines: mappingState(state).lines,
      mappingView: mappingState(state).mappingView,
      line: action.line,
      index: action.index,
      newValue: action.newValue,
      isRelationship: action.isRelationship,
      currentTableName: action.currentTableName,
      newTableName: action.newTableName,
    });

    if (action.line === 'mappingView')
      return {
        ...mappingState(state),
        mappingView: newMappingPath,
      };

    return {
      ...mappingState(state),
      lines: deduplicateMappings(
        modifyLine(mappingState(state), action.line, {
          mappingPath: newMappingPath,
        }),
        mappingState(state).openSelectElement?.line ?? false
      ),
      openSelectElement: action.close
        ? undefined
        : mappingState(state).openSelectElement,
      autoMapperSuggestionsPromise: undefined,
      autoMapperSuggestions: undefined,
      changesMade: true,
      mappingsAreValidated: false,
    };
  },
  AutoMapperSuggestionsLoadedAction: ({ state, action }) => ({
    ...mappingState(state),
    autoMapperSuggestions: action.automapperSuggestions,
    autoMapperSuggestionsPromise: undefined,
  }),
  AutoMapperSuggestionSelectedAction: ({ state, action: { suggestion } }) => ({
    ...mappingState(state),
    lines: modifyLine(
      mappingState(state),
      mappingState(state).openSelectElement!.line,
      {
        mappingPath:
          mappingState(state).autoMapperSuggestions![Number(suggestion) - 1]
            .mappingPath,
      }
    ),
    openSelectElement: undefined,
    autoMapperSuggestionsPromise: undefined,
    autoMapperSuggestions: undefined,
    changesMade: true,
    mappingsAreValidated: false,
  }),
  ValidationResultClickAction: ({ state, action: { mappingPath } }) => ({
    ...mappingState(state),
    mappingView: mappingPath,
  }),
  OpenMatchingLogicDialogAction: ({ state: originalState }) => ({
    ...mappingState(originalState),
    displayMatchingOptionsDialog: true,
    mustMatchPreferences: getMustMatchTables(mappingState(originalState)),
  }),
  CloseMatchingLogicDialogAction: ({ state }) => ({
    ...mappingState(state),
    displayMatchingOptionsDialog: false,
  }),
  MustMatchPrefChangeAction: ({ state: initialState, action }) => {
    const state = mappingState(initialState);
    const newState = {
      ...state,
      changesMade: true,
      mustMatchPreferences: {
        ...state.mustMatchPreferences,
        [action.tableName]: action.mustMatch,
      },
    };

    /*
     * Since setting table as must match causes all of it's fields to be
     * optional, we may have to rerun validation on mustMatchPreferences changes
     */
    return newState.validationResults.length > 0 &&
      newState.lines.length > 0 &&
      newState.lines.some(({ mappingPath }) =>
        mappingPathIsComplete(mappingPath)
      )
      ? validate(newState)
      : newState;
  },
  ChangeMatchBehaviorAction: ({ state, action }) => ({
    ...mappingState(state),
    lines: modifyLine(mappingState(state), action.line, {
      ...mappingState(state).lines[action.line],
      columnOptions: {
        ...mappingState(state).lines[action.line].columnOptions,
        matchBehavior: action.matchBehavior,
      },
    }),
    changesMade: true,
  }),
  ToggleAllowNullsAction: ({ state, action }) => ({
    ...mappingState(state),
    lines: modifyLine(mappingState(state), action.line, {
      ...mappingState(state).lines[action.line],
      columnOptions: {
        ...mappingState(state).lines[action.line].columnOptions,
        nullAllowed: action.allowNull,
      },
    }),
    changesMade: true,
  }),
  ChangeDefaultValue: ({ state, action }) => ({
    ...mappingState(state),
    lines: modifyLine(mappingState(state), action.line, {
      ...mappingState(state).lines[action.line],
      columnOptions: {
        ...mappingState(state).lines[action.line].columnOptions,
        default: action.defaultValue,
      },
    }),
    changesMade: true,
  }),
});
