import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import commonText from '../localization/common';
import formsText from '../localization/forms';
import { sortObjectsByKey } from '../schemaconfighelper';
import type { Actions } from '../schemaconfigreducer';
import { TableIcon } from './common';
import { LoadingScreen, ModalDialog } from './modaldialog';
import type { SpLocaleItem } from './schemaconfig';
import type { SpLocaleContainer } from './schemaconfigwrapper';
import type { IR, RA } from './wbplanview';

type ChooseLanguageState = State<'ChooseLanguageState'>;

type ChooseTableState = State<
  'ChooseTableState',
  {
    language: string;
  }
>;

type FetchingTableFieldState = State<
  'FetchingTableItemsState',
  {
    language: string;
    table: SpLocaleContainer;
  }
>;

type MainState = State<
  'MainState',
  {
    language: string;
    table: SpLocaleContainer;
    items: IR<SpLocaleItem>;
    itemId: number;
    tableWasModified: boolean;
    modifiedItems: RA<number>;
  }
>;

export type States =
  | ChooseLanguageState
  | ChooseTableState
  | FetchingTableFieldState
  | MainState;

type StateWithParameters = States & {
  readonly parameters: {
    readonly languages: RA<string>;
    readonly tables: IR<SpLocaleContainer>;
    readonly dispatch: (action: Actions) => void;
    readonly id: (suffix: string) => string;
    readonly handleClose: () => void;
  };
};

export const stateReducer = generateReducer<JSX.Element, StateWithParameters>({
  ChooseLanguageState({
    action: {
      parameters: { languages, dispatch, handleClose },
    },
  }) {
    return (
      <ModalDialog
        properties={{
          title: commonText('schemaConfig'),
          close: handleClose,
        }}
      >
        {commonText('language')}
        <ul style={{ padding: 0 }}>
          {languages.map((language) => (
            <li key={language}>
              <button
                type="button"
                className="fake-link"
                onClick={(): void =>
                  dispatch({
                    type: 'ChooseLanguageAction',
                    language,
                  })
                }
              >
                {language}
              </button>
            </li>
          ))}
        </ul>
      </ModalDialog>
    );
  },
  ChooseTableState({
    action: {
      parameters: { dispatch, tables, handleClose },
    },
  }) {
    const sortedTables = sortObjectsByKey(Object.values(tables), 'name');
    return (
      <ModalDialog
        properties={{
          title: formsText('tables'),
          close: handleClose,
          buttons: [
            {
              text: commonText('back'),
              click: (): void =>
                dispatch({
                  type: 'ChangeLanguageAction',
                }),
            },
          ],
        }}
      >
        <ul style={{ padding: 0, maxHeight: '40vh' }}>
          {sortedTables.map((table) => (
            <li key={table.id}>
              <button
                onClick={(): void =>
                  dispatch({
                    type: 'ChooseTableAction',
                    table,
                  })
                }
                type="button"
                className="fake-link"
              >
                <TableIcon tableName={table.name} tableLabel={false} />
                {table.name}
              </button>
            </li>
          ))}
        </ul>
      </ModalDialog>
    );
  },
  FetchingTableItemsState() {
    return <LoadingScreen />;
  },
  MainState({
    action: {
      language,
      table,
      items,
      itemId,
      parameters: { id, dispatch, handleClose },
    },
  }) {
    const sortedItems = sortObjectsByKey(Object.values(items), 'name');
    return (
      <>
        <header>
          <h2>
            {commonText('schemaConfig')}: {language}
          </h2>
          <span className="spacer" />
          <menu>
            <li>
              <button
                type="button"
                className="magic-button"
                onClick={(): void =>
                  dispatch({
                    type: 'ChooseLanguageAction',
                    language,
                  })
                }
              >
                {commonText('changeBaseTable')}
              </button>
            </li>
            <li>
              <button type="button" className="magic-button">
                {commonText('save')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="magic-button"
                onClick={handleClose}
              >
                {commonText('cancel')}
              </button>
            </li>
          </menu>
        </header>
        <div className="schema-config-content">
          <section>
            <h3>{table.name}</h3>
          </section>
          <section>
            <h3 id={id('fields-label')}>{commonText('fields')}</h3>
            <select
              size={2}
              aria-labelledby={id('fields-label')}
              onChange={({ target }): void =>
                dispatch({
                  type: 'ChangeItemAction',
                  itemId: Number.parseInt(target.value),
                })
              }
            >
              {typeof items === 'undefined' ? (
                <option disabled>{commonText('loading')}</option>
              ) : (
                sortedItems.map(({ name, id }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </section>
          <section>
            <h3>{items[itemId].name}</h3>
          </section>
        </div>
      </>
    );
  },
});
