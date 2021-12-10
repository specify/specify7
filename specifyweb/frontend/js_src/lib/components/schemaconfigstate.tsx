import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import commonText from '../localization/common';
import formsText from '../localization/forms';
import {
  getItemType,
  javaTypeToHuman,
  sortObjectsByKey,
} from '../schemaconfighelper';
import type { Actions } from '../schemaconfigreducer';
import { TableIcon } from './common';
import { LoadingScreen, ModalDialog } from './modaldialog';
import type { ItemType, SpLocaleItem } from './schemaconfig';
import { WithTableInfo } from './schemaconfigwrapper';
import type { WithFieldInfo, WithFetchedStrings } from './schemaconfigwrapper';
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
    table: SpLocaleContainer & WithFetchedStrings & WithTableInfo;
    items: IR<SpLocaleItem & WithFetchedStrings & WithFieldInfo>;
    itemId: number;
    tableWasModified: boolean;
    modifiedItems: RA<number>;
  }
>;

type SavingState = State<
  'SavingState',
  {
    language: string;
    table: SpLocaleContainer & WithFetchedStrings & WithTableInfo;
    items: IR<SpLocaleItem & WithFetchedStrings & WithFieldInfo>;
    tableWasModified: boolean;
    modifiedItems: RA<number>;
  }
>;

export type States =
  | ChooseLanguageState
  | ChooseTableState
  | FetchingTableFieldState
  | MainState
  | SavingState;

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
                className="fake-link language-link"
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
      tableWasModified,
      modifiedItems,
      parameters: { id, dispatch, handleClose },
    },
  }) {
    const sortedItems = sortObjectsByKey(Object.values(items), 'name');
    const fields = sortedItems.filter((item) => !item.dataModel.isRelationship);
    const relationships = sortedItems.filter((item) => item.dataModel.isRelationship);
    return (
      <>
        <header>
          <h2>
            {commonText('schemaConfig')} ({language})
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
              <button
                type="button"
                className="magic-button"
                disabled={!tableWasModified && modifiedItems.length === 0}
                onClick={(): void => dispatch({ type: 'SaveAction' })}
              >
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
            <label>
              {commonText('caption')}
              <input
                type="text"
                value={table.strings.name.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'ChangeAction',
                    isTable: true,
                    field: 'name',
                    value: target.value,
                  })
                }
              />
            </label>
            <label>
              {commonText('description')}
              <textarea
                value={table.strings.desc.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'ChangeAction',
                    isTable: true,
                    field: 'desc',
                    value: target.value,
                  })
                }
              />
            </label>
            <label>
              {commonText('tableFormat')}
              <input
                type="text"
                readOnly={true}
                value={table.aggregator ?? ''}
              />
            </label>
            <label>
              {commonText('tableAggregation')}
              <input type="text" readOnly={true} value={table.format ?? ''} />
            </label>
            <label className="horizontal">
              <input
                type="checkbox"
                checked={table.ishidden}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'ChangeAction',
                    isTable: true,
                    field: 'ishidden',
                    value: target.checked,
                  })
                }
              />
              {commonText('hideTable')}
            </label>
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
              <optgroup label={commonText('fields')}>
                {fields.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
              {relationships.length > 0 && (
                <optgroup label={commonText('relationships')}>
                  {relationships.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </section>
          <section>
            <h3>{items[itemId].name}</h3>
            <label>
              {commonText('caption')}
              <input
                type="text"
                value={items[itemId].strings.name.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'ChangeAction',
                    isTable: false,
                    field: 'name',
                    value: target.value,
                  })
                }
              />
            </label>
            <label>
              {commonText('description')}
              <textarea
                value={items[itemId].strings.desc.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'ChangeAction',
                    isTable: false,
                    field: 'desc',
                    value: target.value,
                  })
                }
              />
            </label>
            <label>
              {commonText('length')}
              <input
                type="number"
                value={items[itemId].dataModel.length ?? ''}
                readOnly={true}
              />
            </label>
            <label>
              {commonText('type')}
              <input
                type="text"
                readOnly={true}
                value={javaTypeToHuman(
                  items[itemId].dataModel.type,
                  items[itemId].dataModel.relatedModelName
                )}
              />
            </label>
            <label className="horizontal">
              <input
                type="checkbox"
                checked={items[itemId].ishidden}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'ChangeAction',
                    isTable: false,
                    field: 'ishidden',
                    value: target.checked,
                  })
                }
              />
              {commonText('hideField')}
            </label>
            <label className="horizontal">
              <input
                type="checkbox"
                checked={items[itemId].dataModel.readOnly ?? false}
                disabled={true}
              />
              {commonText('readOnly')}
            </label>
            <label className="horizontal">
              <input
                type="checkbox"
                checked={
                  items[itemId].dataModel.canChangeIsRequired
                    ? items[itemId].dataModel.isRequired
                    : items[itemId].isrequired ?? false
                }
                disabled={!items[itemId].dataModel.canChangeIsRequired}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'ChangeAction',
                    isTable: false,
                    field: 'isrequired',
                    value: target.checked,
                  })
                }
              />
              {commonText('required')}
            </label>
            <fieldset>
              <legend>{commonText('fieldFormat')}</legend>
              {Object.entries({
                none: {
                  label: commonText('none'),
                  value: null,
                  values: undefined,
                  disabled: false,
                },
                formatted: {
                  label: commonText('formatted'),
                  // TODO: finish this
                  value: null,
                  values: [],
                  disabled: items[itemId].dataModel.isRelationship,
                },
                webLink: {
                  label: commonText('webLink'),
                  value: items[itemId].weblinkname,
                  values: [],
                  disabled: items[itemId].dataModel.isRelationship,
                },
                pickList: {
                  label: commonText('pickList'),
                  value: items[itemId].picklistname,
                  values: table.dataModel.pickLists,
                  disabled: false,
                },
              }).map(([key, { label, value, values, disabled }]) => (
                <div className="group" key={key}>
                  <label className="horizontal">
                    <input
                      type="radio"
                      name={id('format')}
                      value="none"
                      checked={key === getItemType(items[itemId])}
                      disabled={disabled}
                      onChange={(): void =>
                        dispatch({
                          type: 'ChangeFieldFormatAction',
                          format: key as ItemType,
                          value: values ? values[0] ?? null : null,
                        })
                      }
                    />
                    {label}
                  </label>
                  {values && (
                    <select
                      aria-label={label}
                      value={value ?? '0'}
                      disabled={disabled}
                      onChange={({ target }): void =>
                        dispatch({
                          type: 'ChangeFieldFormatAction',
                          format: key as ItemType,
                          value: target.value === '0' ? null : target.value,
                        })
                      }
                    >
                      {values.length === 0 ? (
                        <option value="0" disabled>
                          {commonText('noneAvailable')}
                        </option>
                      ) : (
                        <>
                          <option value="0">{commonText('none')}</option>
                          {values.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>
              ))}
            </fieldset>
          </section>
        </div>
      </>
    );
  },
  SavingState() {
    return <LoadingScreen />;
  },
});
