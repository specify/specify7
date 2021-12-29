/**
 * WbPlanView Action's Reducer
 *
 * @module
 */

import type { Action } from 'typesafe-reducer';
import { ensureState, generateReducer } from 'typesafe-reducer';

import * as cache from './cache';
import type {
  MappingState,
  WbPlanViewStates,
} from './components/wbplanviewstate';
import type { RA } from './types';
import type { UploadPlan } from './uploadplantomappingstree';
import {
  getLinesFromHeaders,
  getLinesFromUploadPlan,
} from './wbplanviewlinesgetter';

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

type OpenMappingScreenAction = Action<
  'OpenMappingScreenAction',
  {
    readonly headers: RA<string>;
    readonly uploadPlan: UploadPlan | null;
    readonly changesMade: boolean;
  }
>;

export type MappingActions = OpenMappingScreenAction;

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
    type: 'MappingState',
    changesMade: true,
    baseTableName: action.baseTableName,
    lines: getLinesFromHeaders({
      headers: action.headers,
      runAutoMapper: true,
      baseTableName: action.baseTableName,
    }),
    mustMatchPreferences: {},
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
      type: 'MappingState',
      changesMade: action.changesMade,
      mustMatchPreferences,
      baseTableName,
      lines,
    };

    if (newState.lines.some(({ mappingPath }) => mappingPath.length === 0))
      throw new Error('Mapping Path is invalid');

    return newState;
  },
});
