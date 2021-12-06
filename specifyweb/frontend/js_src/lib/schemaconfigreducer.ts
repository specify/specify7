import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';
import { SpLocaleItem } from './components/schemaconfig';
import { mainState } from './components/schemaconfigstate';

import type { States } from './components/schemaconfigstate';
import { RA } from './components/wbplanview';

type ChooseLanguageAction = Action<
  'ChooseLanguageAction',
  {
    language: string;
  }
>;

type ChangeLanguageAction = Action<'ChangeLanguageAction'>;

type ChangeTableAction = Action<
  'ChangeTableAction',
  {
    tableId: number;
  }
>;

type SetTableItemsAction = Action<
  'SetTableItemsAction',
  {
    items: RA<SpLocaleItem>;
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
  | ChangeTableAction
  | SetTableItemsAction
  | ChangeItemAction;

export const reducer = generateReducer<States, Actions>({
  ChooseLanguageAction: ({ action: { language } }) => ({
    type: 'MainState',
    language,
  }),
  ChangeLanguageAction: () => ({
    type: 'DialogState',
  }),
  ChangeTableAction: ({ action: { tableId }, state }) => ({
    ...mainState(state),
    tableId,
    items: undefined,
    item: undefined,
  }),
  SetTableItemsAction: ({ action: { items }, state }) => ({
    ...mainState(state),
    items,
    item: items[0]?.id,
  }),
  ChangeItemAction: ({ action: { itemId }, state }) => ({
    ...mainState(state),
    itemId,
  }),
});
