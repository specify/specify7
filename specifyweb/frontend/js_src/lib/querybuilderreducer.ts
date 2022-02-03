import type { Action, State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { MappingPath } from './components/wbplanviewmapper';
import type { QueryField } from './querybuilderutils';
import type { RA } from './types';
import { mappingPathIsComplete, mutateMappingPath } from './wbplanviewutils';

export type MainState = State<
  'MainState',
  {
    readonly fields: RA<QueryField>;
    readonly mappingView: MappingPath;
    readonly openedElement: {
      readonly line: number;
      readonly index: number | undefined;
    };
    readonly saveRequired: boolean;
  }
>;
type ChangeOpenedElementAction = Action<
  'ChangeOpenedElementAction',
  {
    readonly line: number;
    readonly index: number | undefined;
  }
>;
type SaveRequiredAction = Action<'SaveRequiredAction'>;
type ChangeFieldsAction = Action<
  'ChangeFieldsAction',
  {
    readonly fields: RA<QueryField>;
  }
>;
type ChangeFieldAction = Action<
  'ChangeFieldAction',
  {
    readonly line: number;
    readonly field: QueryField;
  }
>;
type ChangeSelectElementValueAction = Action<
  'ChangeSelectElementValueAction',
  {
    readonly line: number | 'mappingView';
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly parentTableName: string;
    readonly newTableName: string;
    readonly currentTableName: string;
  }
>;
type MappingViewMapAction = Action<'MappingViewMapAction'>;
type Actions =
  | ChangeOpenedElementAction
  | SaveRequiredAction
  | ChangeFieldsAction
  | ChangeFieldAction
  | ChangeSelectElementValueAction
  | MappingViewMapAction;

export const reducer = generateReducer<MainState, Actions>({
  ChangeOpenedElementAction: ({ action, state }) => ({
    ...state,
    openedElement: {
      line: action.line,
      index: action.index,
    },
  }),
  SaveRequiredAction: ({ state }) => ({
    ...state,
    saveRequired: true,
  }),
  ChangeFieldsAction: ({ action, state }) => ({
    ...state,
    fields: action.fields,
    saveRequired: true,
  }),
  ChangeFieldAction: ({ action, state }) => ({
    ...state,
    fields: [
      ...state.fields.slice(0, action.line),
      action.field,
      ...state.fields.slice(action.line + 1),
    ],
    saveRequired: true,
  }),
  ChangeSelectElementValueAction: ({ state, action }) => {
    const newMappingPath = mutateMappingPath({
      lines: [],
      mappingView:
        action.line === 'mappingView'
          ? state.mappingView
          : state.fields[action.line].mappingPath,
      line: 'mappingView',
      index: action.index,
      newValue: action.newValue,
      isRelationship: action.isRelationship,
      parentTableName: action.parentTableName,
      currentTableName: action.currentTableName,
      newTableName: action.newTableName,
      ignoreToMany: true,
    });

    if (action.line === 'mappingView')
      return {
        ...state,
        mappingView: newMappingPath,
      };

    return {
      ...state,
      fields: [
        ...state.fields.slice(0, action.line),
        {
          ...state.fields[action.line],
          mappingPath: newMappingPath,
        },
        ...state.fields.slice(action.line + 1),
      ],
      openedElement: {
        line: state.openedElement.line,
        index: action.close ? undefined : state.openedElement.index,
      },
      autoMapperSuggestions: undefined,
      saveRequired: true,
      mappingsAreValidated: false,
    };
  },
  MappingViewMapAction: ({ state }) => {
    const mappingViewPath = state.mappingView;
    const focusedLine = state.openedElement.line;
    if (
      !mappingPathIsComplete(mappingViewPath) ||
      typeof focusedLine === 'undefined' ||
      focusedLine >= state.fields.length
    )
      return state;

    return {
      ...state,
      fields: [
        ...state.fields.slice(0, focusedLine),
        {
          ...state.fields[focusedLine],
          mappingPath: mappingViewPath,
        },
        ...state.fields.slice(focusedLine + 1),
      ],
      changesMade: true,
      mappingsAreValidated: false,
    };
  },
});
