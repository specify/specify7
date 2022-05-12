/**
 * React action reducer for Schema Config
 */

import type { Action } from 'typesafe-reducer';
import { ensureState, generateReducer } from 'typesafe-reducer';

import type { ItemType } from './components/schemaconfig';
import type { States } from './components/schemaconfigstate';
import type {
  WithFetchedStrings,
  WithFieldInfo,
  WithTableInfo,
} from './components/toolbar/schemaconfig';
import type { SpLocaleContainer, SpLocaleContainerItem } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import { f } from './functools';
import type { IR } from './types';
import { sortFunction } from './helpers';

type ChooseLanguageAction = Action<
  'ChooseLanguageAction',
  {
    language: string;
  }
>;

type AddLanguageAction = Action<'AddLanguageAction'>;

type ChangeLanguageAction = Action<'ChangeLanguageAction'>;

type ChooseTableAction = Action<
  'ChooseTableAction',
  {
    table: SerializedResource<SpLocaleContainer>;
  }
>;

type FetchedTableDataAction = Action<
  'FetchedTableDataAction',
  {
    table: SerializedResource<SpLocaleContainer> &
      WithFetchedStrings &
      WithTableInfo;
    items: IR<
      SerializedResource<SpLocaleContainerItem> &
        WithFetchedStrings &
        WithFieldInfo
    >;
  }
>;

type ChangeItemAction = Action<
  'ChangeItemAction',
  {
    itemId: number;
  }
>;

type TableModifiedAction = Action<
  'TableModifiedAction',
  {
    field: 'name' | 'desc' | 'isHidden' | 'format' | 'aggregator';
    value: string | boolean | null;
  }
>;

type FieldModifiedAction = Action<
  'FieldModifiedAction',
  {
    field: 'name' | 'desc' | 'isHidden' | 'isRequired';
    value: string | boolean;
  }
>;

type ChangeFieldFormatAction = Action<
  'ChangeFieldFormatAction',
  {
    format: ItemType;
    value: string | null;
  }
>;

export type Actions =
  | ChooseLanguageAction
  | AddLanguageAction
  | ChangeLanguageAction
  | ChooseTableAction
  | FetchedTableDataAction
  | ChangeItemAction
  | TableModifiedAction
  | FieldModifiedAction
  | ChangeFieldFormatAction;

export const reducer = generateReducer<States, Actions>({
  ChangeLanguageAction: () => ({
    type: 'ChooseLanguageState',
  }),
  AddLanguageAction: () => ({
    type: 'AddLanguageState',
  }),
  ChooseLanguageAction: ({ action: { language } }) => ({
    type: 'ChooseTableState',
    language,
  }),
  ChooseTableAction: ensureState(
    ['ChooseTableState', 'MainState'],
    ({ action: { table }, state: { language } }) => ({
      type: 'FetchingTableItemsState',
      language,
      table,
    })
  ),
  FetchedTableDataAction: ensureState(
    ['FetchingTableItemsState'],
    ({ action: { items, table }, state }) => ({
      type: 'MainState',
      table,
      language: state.language,
      items,
      itemId:
        Object.values(items)
          .sort(sortFunction(({ name }) => name))
          .find((item) => !item.dataModel.isRelationship)?.id ??
        Object.values(items)[0].id,
      tableWasModified: false,
      modifiedItems: [],
    })
  ),
  ChangeItemAction: ensureState(
    ['MainState'],
    ({ action: { itemId }, state }) => ({
      ...state,
      itemId,
    })
  ),
  TableModifiedAction: ensureState(
    ['MainState'],
    ({ action: { field, value }, state }) => ({
      ...state,
      tableWasModified: true,
      table: {
        ...state.table,
        ...(field === 'name' || field === 'desc'
          ? {
              strings: {
                ...state.table.strings,
                [field]: {
                  ...state.table.strings[field],
                  text: value,
                },
              },
            }
          : {
              [field]: value,
            }),
      },
    })
  ),
  FieldModifiedAction: ensureState(
    ['MainState'],
    ({ action: { field, value }, state }) => ({
      ...state,
      modifiedItems: f.unique([...state.modifiedItems, state.itemId]),
      items: {
        ...state.items,
        [state.itemId]: {
          ...state.items[state.itemId],
          ...(field === 'desc' || field === 'name'
            ? {
                strings: {
                  ...state.items[state.itemId].strings,
                  [field]: {
                    ...state.items[state.itemId].strings[field],
                    text: value,
                  },
                },
              }
            : {
                [field]: value as boolean,
              }),
        },
      },
    })
  ),
  ChangeFieldFormatAction: ensureState(
    ['MainState'],
    ({ action: { format, value }, state }) => ({
      ...state,
      modifiedItems: f.unique([...state.modifiedItems, state.itemId]),
      items: {
        ...state.items,
        [state.itemId]: {
          ...state.items[state.itemId],
          format: format === 'formatted' ? value : null,
          webLinkName: format === 'webLink' ? value : null,
          pickListName: format === 'pickList' ? value : null,
        },
      },
    })
  ),
});
