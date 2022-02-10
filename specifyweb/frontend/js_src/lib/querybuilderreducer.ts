import type { Action, State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { MappingPath } from './components/wbplanviewmapper';
import type { QueryField } from './querybuilderutils';
import type { RA } from './types';
import { mutateMappingPath } from './wbplanviewutils';
import { Tables } from './datamodel';

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
    readonly baseTableName: Lowercase<keyof Tables>;
  }
>;
type Actions =
  | Action<
      'ChangeOpenedElementAction',
      { line: number; index: number | undefined }
    >
  | Action<'FocusLineAction', { readonly line: number }>
  | Action<'LineMoveAction', { line: number; direction: 'up' | 'down' }>
  | Action<'SaveRequiredAction'>
  | Action<'ChangeFieldsAction', { readonly fields: RA<QueryField> }>
  | Action<
      'ChangeFieldAction',
      { readonly line: number; readonly field: QueryField }
    >
  | Action<
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

export const reducer = generateReducer<MainState, Actions>({
  ChangeOpenedElementAction: ({ action, state }) => ({
    ...state,
    openedElement: {
      line: action.line,
      index: action.index,
    },
  }),
  FocusLineAction: ({ action, state }) =>
    state.openedElement.line === action.line
      ? state
      : {
          ...state,
          openedElement: {
            line: action.line,
            index: undefined,
          },
        },
  LineMoveAction: ({ state, action }) => ({
    ...state,
    openedElement: {
      line: action.direction === 'up' ? action.line - 1 : action.line + 1,
      index: undefined,
    },
    fields:
      action.direction === 'up'
        ? [
            ...state.fields.slice(0, action.line - 1),
            state.fields[action.line],
            state.fields[action.line - 1],
            ...state.fields.slice(action.line + 1),
          ]
        : [
            ...state.fields.slice(0, action.line),
            state.fields[action.line + 1],
            state.fields[action.line],
            ...state.fields.slice(action.line + 2),
          ],
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
      {
        ...action.field,
        isNot: action.field.isNot && action.field.filter !== 'any',
      },
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
    };
  },
});
