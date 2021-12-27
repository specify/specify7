/**
 * WbPlanView Action's Reducer
 *
 * @module
 */

import type { Action } from 'typesafe-reducer';
import { ensureState, generateReducer } from 'typesafe-reducer';

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
import { getDefaultMappingState } from './components/wbplanviewstate';
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
    return !action.ignoreValidation &&
      validationResultsState.validationResults.length > 0
      ? validationResultsState
      : {
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
  })),
  ResetMappingsAction: ensureState(['MappingState'], ({ state }) => ({
    ...state,
    lines: state.lines.map((line) => ({
      ...line,
      mappingPath: ['0'],
      columnOptions: defaultColumnOptions,
    })),
    changesMade: true,
    mappingsAreValidated: false,
    validationResults: [],
  })),
  ClearMappingLineAction: ensureState(
    ['MappingState'],
    ({ state, action }) => ({
      ...state,
      lines: modifyLine(state, action.line, {
        mappingPath: ['0'],
        columnOptions: defaultColumnOptions,
      }),
      changesMade: true,
      mappingsAreValidated: false,
    })
  ),
  FocusLineAction: ensureState(['MappingState'], ({ state, action }) => {
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
  }),
  MappingViewMapAction: ensureState(['MappingState'], ({ state }) => {
    const mappingViewMappingPath = state.mappingView;
    const focusedLine = state.focusedLine;
    if (
      !mappingPathIsComplete(mappingViewMappingPath) ||
      typeof focusedLine === 'undefined' ||
      focusedLine >= state.lines.length
    )
      return state;

    return {
      ...state,
      lines: [
        ...state.lines.slice(0, focusedLine),
        {
          ...state.lines[focusedLine],
          mappingPath: mappingViewMappingPath,
        },
        ...state.lines.slice(focusedLine + 1),
      ],
      changesMade: true,
      mappingsAreValidated: false,
    };
  }),
  AddNewHeaderAction: ensureState(['MappingState'], ({ state }) => ({
    ...state,
    newHeaderId: state.newHeaderId + 1,
    lines: [
      ...state.lines,
      {
        headerName: uniquifyHeaders(
          [
            ...state.lines.map(({ headerName }) => headerName),
            wbText('newHeaderName')(state.newHeaderId),
          ],
          [state.lines.length]
        ).slice(-1)[0],
        mappingType: 'existingHeader',
        mappingPath: ['0'],
        columnOptions: defaultColumnOptions,
      },
    ],
    focusedLine: state.lines.length,
    mappingsAreValidated: false,
  })),
  ToggleHiddenFieldsAction: ensureState(['MappingState'], ({ state }) => ({
    ...state,
    showHiddenFields: cache.set(
      'wbPlanViewUi',
      'showHiddenFields',
      !state.showHiddenFields,
      {
        overwrite: true,
      }
    ),
    revealHiddenFieldsClicked: true,
  })),
  OpenSelectElementAction: ensureState(
    ['MappingState'],
    ({ state, action }) => ({
      ...state,
      openSelectElement: {
        line: action.line,
        index: action.index,
      },
      autoMapperSuggestionsPromise:
        typeof state.lines[action.line].mappingPath[action.index] ===
        'undefined'
          ? undefined
          : getAutoMapperSuggestions({
              lines: state.lines,
              line: action.line,
              index: action.index,
              baseTableName: state.baseTableName,
            }),
    })
  ),
  CloseSelectElementAction: ({ state }) =>
    state.type === 'MappingState'
      ? {
          ...state,
          openSelectElement: undefined,
          autoMapperSuggestionsPromise: undefined,
          autoMapperSuggestions: undefined,
        }
      : state,
  ChangeSelectElementValueAction: ensureState(
    ['MappingState'],
    ({ state, action }) => {
      const newMappingPath = mutateMappingPath({
        lines: state.lines,
        mappingView: state.mappingView,
        line: action.line,
        index: action.index,
        newValue: action.newValue,
        isRelationship: action.isRelationship,
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
        autoMapperSuggestionsPromise: undefined,
        autoMapperSuggestions: undefined,
        changesMade: true,
        mappingsAreValidated: false,
      };
    }
  ),
  AutoMapperSuggestionsLoadedAction: ensureState(
    ['MappingState'],
    ({ state, action }) => ({
      ...state,
      autoMapperSuggestions: action.autoMapperSuggestions,
      autoMapperSuggestionsPromise: undefined,
    })
  ),
  AutoMapperSuggestionSelectedAction: ensureState(
    ['MappingState'],
    ({ state, action: { suggestion } }) => ({
      ...state,
      lines: modifyLine(state, state.openSelectElement!.line, {
        mappingPath:
          state.autoMapperSuggestions![Number(suggestion) - 1].mappingPath,
      }),
      openSelectElement: undefined,
      autoMapperSuggestionsPromise: undefined,
      autoMapperSuggestions: undefined,
      changesMade: true,
      mappingsAreValidated: false,
    })
  ),
  ValidationResultClickAction: ensureState(
    ['MappingState'],
    ({ state, action: { mappingPath } }) => ({
      ...state,
      mappingView: mappingPath,
    })
  ),
  OpenMatchingLogicDialogAction: ensureState(['MappingState'], ({ state }) => ({
    ...state,
    displayMatchingOptionsDialog: true,
    mustMatchPreferences: getMustMatchTables(state),
  })),
  CloseMatchingLogicDialogAction: ensureState(
    ['MappingState'],
    ({ state }) => ({
      ...state,
      displayMatchingOptionsDialog: false,
    })
  ),
  MustMatchPrefChangeAction: ensureState(
    ['MappingState'],
    ({ state, action }) => {
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
    }
  ),
  ChangeMatchBehaviorAction: ensureState(
    ['MappingState'],
    ({ state, action }) => ({
      ...state,
      lines: modifyLine(state, action.line, {
        ...state.lines[action.line],
        columnOptions: {
          ...state.lines[action.line].columnOptions,
          matchBehavior: action.matchBehavior,
        },
      }),
      changesMade: true,
    })
  ),
  ToggleAllowNullsAction: ensureState(
    ['MappingState'],
    ({ state, action }) => ({
      ...state,
      lines: modifyLine(state, action.line, {
        ...state.lines[action.line],
        columnOptions: {
          ...state.lines[action.line].columnOptions,
          nullAllowed: action.allowNull,
        },
      }),
      changesMade: true,
    })
  ),
  ChangeDefaultValue: ensureState(['MappingState'], ({ state, action }) => ({
    ...state,
    lines: modifyLine(state, action.line, {
      ...state.lines[action.line],
      columnOptions: {
        ...state.lines[action.line].columnOptions,
        default: action.defaultValue,
      },
    }),
    changesMade: true,
  })),
});
