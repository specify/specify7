import type { Action } from 'typesafe-reducer';
import { ensureState, generateReducer } from 'typesafe-reducer';

import type { SpLocaleItem } from './components/schemaconfig';
import type { States } from './components/schemaconfigstate';
import {
  SpLocaleContainer,
  WithDatamodelFields,
  WithFetchedStrings,
} from './components/schemaconfigwrapper';
import type { IR } from './components/wbplanview';
import { isRelationship, sortObjectsByKey } from './schemaconfighelper';

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

type FetchedTableStringsAction = Action<
  'FetchedTableStringsAction',
  {
    table: SpLocaleContainer & WithFetchedStrings;
    items: IR<SpLocaleItem & WithFetchedStrings & WithDatamodelFields>;
  }
>;

type ChangeItemAction = Action<
  'ChangeItemAction',
  {
    itemId: number;
  }
>;

type ChangeAction = Action<
  'ChangeAction',
  {
    isTable: boolean;
    field: 'name' | 'desc' | 'ishidden' | 'isrequired';
    value: string | boolean;
  }
>;

type SaveAction = Action<'SaveAction'>;

export type Actions =
  | ChooseLanguageAction
  | ChangeLanguageAction
  | ChooseTableAction
  | FetchedTableStringsAction
  | ChangeItemAction
  | ChangeAction
  | SaveAction;

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
  FetchedTableStringsAction: ensureState(
    ['FetchingTableItemsState'],
    ({ action: { items, table }, state }) => ({
      type: 'MainState',
      table: table,
      language: state.language,
      items,
      itemId:
        sortObjectsByKey(Object.values(items), 'name').find(
          (item) => !isRelationship(item)
        )?.id ?? Object.values(items)[0].id,
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
  ChangeAction: ensureState(
    ['MainState'],
    ({ action: { isTable, field, value }, state }) => {
      return {
        ...state,
        tableWasModified: state.tableWasModified || isTable,
        ...(isTable
          ? {
              table: {
                ...state.table,
                ...(field === 'ishidden' || field === 'isrequired'
                  ? {
                      ishidden: value as boolean,
                    }
                  : {
                      strings: {
                        ...state.table.strings,
                        [field]: {
                          ...state.table.strings[field],
                          text: value,
                        },
                      },
                    }),
              },
            }
          : {
              modifiedItems: Array.from(
                new Set([...state.modifiedItems, state.itemId])
              ),
              items: {
                ...state.items,
                [state.itemId]: {
                  ...state.items[state.itemId],
                  ...(field === 'ishidden' || field === 'isrequired'
                    ? {
                        ishidden: value as boolean,
                      }
                    : {
                        strings: {
                          ...state.items[state.itemId].strings,
                          [field]: {
                            ...state.items[state.itemId].strings[field],
                            text: value,
                          },
                        },
                      }),
                },
              },
            }),
      };
    }
  ),
  SaveAction: ensureState(['MainState'], ({ state }) => ({
    ...state,
    type: 'SavingState',
  })),
});
