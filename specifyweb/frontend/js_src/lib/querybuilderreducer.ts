import type { Action, State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQuery, Tables } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import type { QueryField } from './querybuilderutils';
import { parseQueryFields } from './querybuilderutils';
import type { SpecifyModel } from './specifymodel';
import type { RA } from './types';
import { mutateMappingPath } from './wbplanviewutils';

type MainState = State<
  'MainState',
  {
    readonly fields: RA<QueryField>;
    readonly mappingView: MappingPath;
    readonly openedElement: {
      readonly line: number;
      readonly index: number | undefined;
    };
    readonly queryRunCount: number;
    readonly saveRequired: boolean;
    readonly baseTableName: keyof Tables;
  }
>;

export const getInitialState = ({
  query,
  queryResource,
  model,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly model: SpecifyModel;
}): MainState => ({
  type: 'MainState',
  fields: parseQueryFields(query.fields ?? []),
  mappingView: ['0'],
  queryRunCount: 0,
  openedElement: { line: 1, index: undefined },
  saveRequired: queryResource.isNew(),
  /*
   * This value never changes. It is part of the state to be accessible by
   * the reducer
   */
  baseTableName: model.name,
});

type Actions =
  | Action<'RunQuery'>
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
        readonly parentTableName: keyof Tables | undefined;
        readonly newTableName: keyof Tables | undefined;
        readonly currentTableName: keyof Tables | undefined;
      }
    >;

export const reducer = generateReducer<MainState, Actions>({
  RunQuery: ({ state }) => ({
    ...state,
    queryRunCount: state.queryRunCount + 1,
  }),
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
