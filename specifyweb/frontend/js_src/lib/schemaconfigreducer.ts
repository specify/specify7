import type { Action } from 'typesafe-reducer';
import { ensureState, generateReducer } from 'typesafe-reducer';

import type { SpLocaleItem } from './components/schemaconfig';
import type { States } from './components/schemaconfigstate';
import { SpLocaleContainer } from './components/schemaconfigwrapper';
import type { IR } from './components/wbplanview';

type ChooseLanguageAction = Action<
  'ChooseLanguageAction',
  {
    language: string;
  }
>;

type ChangeLanguageAction = Action<'ChangeLanguageAction'>;

type ChooseTableAction = Action<
  'ChooseTableAction',
  {
    table: SpLocaleContainer;
  }
>;

type SetTableItemsAction = Action<
  'SetTableItemsAction',
  {
    items: IR<SpLocaleItem>;
  }
>;

type ChangeItemAction = Action<
  'ChangeItemAction',
  {
    itemId: number;
  }
>;

export type Actions =
  | ChooseLanguageAction
  | ChangeLanguageAction
  | ChooseTableAction
  | SetTableItemsAction
  | ChangeItemAction;

export const reducer = generateReducer<States, Actions>({
  ChangeLanguageAction: () => ({
    type: 'ChooseLanguageState',
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
  SetTableItemsAction: ensureState(
    ['FetchingTableItemsState'],
    ({ action: { items }, state }) => ({
      type: 'MainState',
      table: state.table,
      language: state.language,
      items,
      itemId: Object.values(items)[0].id,
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
});
