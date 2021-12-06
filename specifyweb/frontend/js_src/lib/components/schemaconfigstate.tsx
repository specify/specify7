import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { Actions } from '../schemaconfigreducer';
import { ModalDialog } from './modaldialog';
import { SpLocaleItem } from './schemaconfig';
import type { SpLocaleContainer } from './schemaconfigwrapper';
import type { RA } from './wbplanview';
import navigation from '../navigation';

type DialogState = State<'DialogState'>;

type MainState = State<
  'MainState',
  {
    language: string;
    tableId?: number;
    items?: RA<SpLocaleItem>;
    itemId?: number;
  }
>;

export type States = DialogState | MainState;

type StateWithParameters = States & {
  readonly parameters: {
    readonly languages: RA<string>;
    readonly tables: RA<SpLocaleContainer>;
    readonly dispatch: (action: Actions) => void;
    readonly id: (suffix: string) => string;
  };
};

export function mainState(state: States): MainState {
  if (state.type === 'MainState') return state;
  else
    throw new Error(
      'Dispatching this action requires the state ' +
        'to be of type `MainState`'
    );
}

export const stateReducer = generateReducer<JSX.Element, StateWithParameters>({
  DialogState({
    action: {
      parameters: { languages, dispatch },
    },
  }) {
    return (
      <ModalDialog properties={{ title: commonText('schemaConfig') }}>
        <label>
          {commonText('language')}
          <br />
          <select
            style={{ width: '100%' }}
            size={10}
            onChange={({ target }): void =>
              dispatch({
                type: 'ChooseLanguageAction',
                language: target.value,
              })
            }
          >
            {languages.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </label>
      </ModalDialog>
    );
  },
  MainState({
    action: {
      language,
      tableId,
      items,
      parameters: { id, dispatch, tables },
    },
  }) {
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
                    type: 'ChangeLanguageAction',
                  })
                }
              >
                {commonText('changeLanguage')}
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
                onClick={() => navigation.go('/specify/')}
              >
                {commonText('cancel')}
              </button>
            </li>
          </menu>
        </header>
        <section>
          <h3 id={id('tables-label')}>{formsText('tables')}</h3>
          <div>
            <select
              aria-labelledby={id('tables-label')}
              size={2}
              value={tableId}
              onChange={({ target }): void =>
                dispatch({
                  type: 'ChangeTableAction',
                  tableId: Number.parseInt(target.value),
                })
              }
            >
              {tables.map(({ name, id }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <div/>
          </div>
        </section>
        <section>
          <h3 id={id('fields-label')}>{commonText('fields')}</h3>
          <div>
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
                items.map(({ name, id }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))
              )}
            </select>
            <div />
          </div>
        </section>
      </>
    );
  },
});
