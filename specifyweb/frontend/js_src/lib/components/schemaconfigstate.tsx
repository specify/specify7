import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import commonText from '../localization/common';
import formsText from '../localization/forms';
import {
  filterFormatters,
  getItemType,
  isFormatterAvailable,
  javaTypeToHuman,
  sortObjectsByKey,
} from '../schemaconfighelper';
import type { Actions } from '../schemaconfigreducer';
import type { IR, RA } from '../types';
import {
  Button,
  Checkbox,
  className,
  ContainerFull,
  Label,
  LabelForCheckbox,
  Link,
  Radio,
} from './basic';
import { TableIcon } from './common';
import { Dialog, LoadingScreen } from './modaldialog';
import type {
  DataObjectFormatter,
  ItemType,
  SpLocaleItem,
  UiFormatter,
} from './schemaconfig';
import { AddLanguage, PickList } from './schemaconfigcomponents';
import type {
  SpLocaleContainer,
  WithFetchedStrings,
  WithFieldInfo,
  WithTableInfo,
} from './toolbar/schemaconfig';

type ChooseLanguageState = State<'ChooseLanguageState'>;

type AddLanguageState = State<'AddLanguageState'>;

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
  | AddLanguageState
  | ChooseTableState
  | FetchingTableFieldState
  | MainState
  | SavingState;

type StateWithParameters = States & {
  readonly parameters: {
    readonly languages: IR<string>;
    readonly tables: IR<SpLocaleContainer>;
    readonly dispatch: (action: Actions) => void;
    readonly id: (suffix: string) => string;
    readonly handleClose: () => void;
    readonly webLinks: RA<string>;
    readonly uiFormatters: RA<UiFormatter>;
    readonly dataObjFormatters: IR<DataObjectFormatter>;
    readonly dataObjAggregators: IR<DataObjectFormatter>;
  };
};

export const stateReducer = generateReducer<JSX.Element, StateWithParameters>({
  ChooseLanguageState({
    action: {
      parameters: { languages, dispatch, handleClose },
    },
  }) {
    return (
      <Dialog
        header={commonText('schemaConfig')}
        onClose={handleClose}
        buttons={[
          'close',
          <Button.Blue
            key="button"
            onClick={(): void =>
              dispatch({
                type: 'AddLanguageAction',
              })
            }
          >
            {commonText('addLanguage')}
          </Button.Blue>,
        ]}
      >
        {commonText('language')}
        <ul>
          {Object.entries(languages).map(([code, label]) => (
            <li key={code}>
              <Button.LikeLink
                role="link"
                className="font-bold"
                onClick={(): void =>
                  dispatch({
                    type: 'ChooseLanguageAction',
                    language: code,
                  })
                }
              >
                {label}
              </Button.LikeLink>
            </li>
          ))}
        </ul>
      </Dialog>
    );
  },
  AddLanguageState({
    action: {
      parameters: { handleClose, dispatch },
    },
  }) {
    return (
      <AddLanguage
        handleClose={handleClose}
        handleGoBack={(): void =>
          dispatch({
            type: 'ChangeLanguageAction',
          })
        }
        handleAddLanguage={(language): void =>
          dispatch({
            type: 'ChooseLanguageAction',
            language,
          })
        }
      />
    );
  },
  ChooseTableState({
    action: {
      language,
      parameters: { dispatch, tables, handleClose },
    },
  }) {
    const sortedTables = sortObjectsByKey(Object.values(tables), 'name');
    return (
      <Dialog
        header={formsText('tables')}
        onClose={handleClose}
        buttons={
          <Button.Transparent
            onClick={(): void =>
              dispatch({
                type: 'ChangeLanguageAction',
              })
            }
          >
            {commonText('back')}
          </Button.Transparent>
        }
      >
        <ul className="max-h-80">
          {sortedTables.map((table) => (
            <li key={table.id}>
              <Link.Default
                href={`/task/schema-config/?language=${language}&table=${table.name}`}
                className="intercept-navigation"
              >
                <TableIcon tableName={table.name} tableLabel={false} />
                {table.name}
              </Link.Default>
            </li>
          ))}
        </ul>
      </Dialog>
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
      parameters: {
        id,
        languages,
        dispatch,
        handleClose,
        webLinks,
        uiFormatters,
        dataObjFormatters,
        dataObjAggregators,
      },
    },
  }) {
    const sortedItems = sortObjectsByKey(Object.values(items), 'name');
    const fields = sortedItems.filter((item) => !item.dataModel.isRelationship);
    const relationships = sortedItems.filter(
      (item) => item.dataModel.isRelationship
    );
    const systemPickLists = Object.values(table.dataModel.pickLists)
      .filter(({ isSystem }) => isSystem)
      .map(({ name }) => name)
      .sort();
    const userPickLists = Object.values(table.dataModel.pickLists)
      .filter(({ isSystem }) => !isSystem)
      .map(({ name }) => name)
      .sort();
    const currentPickListId = Object.entries(table.dataModel.pickLists).find(
      ([_id, { name }]) => name === items[itemId].picklistname
    )?.[0];
    return (
      <ContainerFull>
        <header className="gap-x-2 flex">
          <h2 className="font-semibold text-black">
            {commonText('schemaConfig')} (
            {languages[language]?.replaceAll(/[()]/g, '') ?? language})
          </h2>
          <span className="flex-1 -ml-2" />
          <menu className="contents">
            <li>
              <Button.Simple
                /* eslint-disable-next-line sonarjs/no-identical-functions */
                onClick={(): void =>
                  dispatch({
                    type: 'ChooseLanguageAction',
                    language,
                  })
                }
              >
                {commonText('changeBaseTable')}
              </Button.Simple>
            </li>
            <li>
              <Button.Simple onClick={handleClose}>
                {commonText('cancel')}
              </Button.Simple>
            </li>
            <li>
              <Button.Simple
                disabled={!tableWasModified && modifiedItems.length === 0}
                onClick={(): void => dispatch({ type: 'SaveAction' })}
              >
                {commonText('save')}
              </Button.Simple>
            </li>
          </menu>
        </header>
        <div className="sm:flex-row sm:h-full flex flex-col gap-4">
          <section className="sm:overflow-y-auto gap-y-4 flex flex-col flex-1">
            <h3>
              {commonText('tableInline')} {table.name}
            </h3>
            <Label>
              {commonText('caption')}
              <input
                type="text"
                value={table.strings.name.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'name',
                    value: target.value,
                  })
                }
              />
            </Label>
            <Label>
              {commonText('description')}
              <textarea
                className="resize-y h-[15vh]"
                value={table.strings.desc.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'desc',
                    value: target.value,
                  })
                }
              />
            </Label>
            <Label>
              {commonText('tableFormat')}
              <PickList
                value={table.format}
                groups={{ '': filterFormatters(dataObjFormatters, table.name) }}
                onChange={(value): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'format',
                    value,
                  })
                }
              />
            </Label>
            <Label>
              {commonText('tableAggregation')}
              <PickList
                value={table.aggregator}
                groups={{
                  '': filterFormatters(dataObjAggregators, table.name),
                }}
                onChange={(value): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'aggregator',
                    value,
                  })
                }
              />
            </Label>
            <LabelForCheckbox>
              <Checkbox
                checked={table.ishidden}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'ishidden',
                    value: target.checked,
                  })
                }
              />
              {commonText('hideTable')}
            </LabelForCheckbox>
          </section>
          <section className="sm:overflow-y-auto gap-y-4 flex flex-col flex-1">
            <h3 id={id('fields-label')}>{commonText('fields')}</h3>
            <select
              className="min-h-[30vh] h-full sm:min-h-0 overflow-y-auto"
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
          <section className="sm:overflow-y-auto gap-y-4 flex flex-col flex-1">
            <h3>
              {commonText('field')}: {items[itemId].name}
            </h3>
            <Label>
              {commonText('caption')}
              <input
                type="text"
                value={items[itemId].strings.name.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'name',
                    value: target.value,
                  })
                }
              />
            </Label>
            <Label>
              {commonText('description')}
              <textarea
                className="resize-y h-[15vh]"
                value={items[itemId].strings.desc.text}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'desc',
                    value: target.value,
                  })
                }
              />
            </Label>
            <Label>
              {commonText('length')}
              <input
                type="number"
                value={items[itemId].dataModel.length ?? ''}
                readOnly={true}
                className="no-arrows"
              />
            </Label>
            <Label>
              {commonText('type')}
              <input
                type="text"
                readOnly={true}
                value={javaTypeToHuman(
                  items[itemId].dataModel.type,
                  items[itemId].dataModel.relatedModelName
                )}
              />
            </Label>
            <LabelForCheckbox>
              <Checkbox
                checked={items[itemId].ishidden}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'ishidden',
                    value: target.checked,
                  })
                }
              />
              {commonText('hideField')}
            </LabelForCheckbox>
            <LabelForCheckbox>
              <Checkbox
                checked={items[itemId].dataModel.readOnly ?? false}
                disabled={true}
              />
              {commonText('readOnly')}
            </LabelForCheckbox>
            <LabelForCheckbox>
              <Checkbox
                checked={
                  items[itemId].dataModel.canChangeIsRequired
                    ? items[itemId].dataModel.isRequired
                    : items[itemId].isrequired ?? false
                }
                disabled={!items[itemId].dataModel.canChangeIsRequired}
                onChange={({ target }): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'isrequired',
                    value: target.checked,
                  })
                }
              />
              {commonText('required')}
            </LabelForCheckbox>
            <fieldset>
              <legend>{commonText('fieldFormat')}</legend>
              {Object.entries<{
                label: string;
                value: string | null;
                values: IR<RA<string>> | undefined;
                extraComponents?: JSX.Element;
              }>({
                none: {
                  label: commonText('none'),
                  value: null,
                  values: undefined,
                },
                formatted: {
                  label: commonText('formatted'),
                  value: items[itemId].format,
                  values: {
                    '': uiFormatters
                      .map(({ name, isSystem, isDefault, value }) =>
                        [
                          name,
                          ...[
                            value,
                            isSystem ? commonText('system') : '',
                            isDefault ? commonText('default') : '',
                          ]
                            .filter(Boolean)
                            .map((value) => `(${value})`),
                        ].join(' ')
                      )
                      .sort(),
                  },
                },
                webLink: {
                  label: commonText('webLink'),
                  value: items[itemId].weblinkname,
                  values: { '': webLinks },
                },
                pickList: {
                  label: commonText('pickList'),
                  value: items[itemId].picklistname,
                  values: {
                    [commonText('userDefined')]: userPickLists,
                    [commonText('system')]: systemPickLists,
                  },
                  extraComponents: (
                    <>
                      {typeof currentPickListId !== 'undefined' && (
                        <Link.Default
                          className="intercept-navigation"
                          href={`/specify/view/picklist/${currentPickListId}/`}
                        >
                          <span className="ui-icon ui-icon-pencil">
                            {commonText('edit')}
                          </span>
                        </Link.Default>
                      )}
                      <Link.Default
                        className="intercept-navigation"
                        href="/specify/view/picklist/new/"
                      >
                        <span className="ui-icon ui-icon-plus">
                          {commonText('add')}
                        </span>
                      </Link.Default>
                    </>
                  ),
                },
              }).map(([key, { label, value, values, extraComponents }]) => (
                <div className={className.labelForCheckbox} key={key}>
                  <LabelForCheckbox>
                    <Radio
                      name={id('format')}
                      value="none"
                      checked={key === getItemType(items[itemId])}
                      disabled={
                        !isFormatterAvailable(items[itemId], key as ItemType)
                      }
                      onChange={(): void =>
                        dispatch({
                          type: 'ChangeFieldFormatAction',
                          format: key as ItemType,
                          value: values
                            ? Object.values(values)[0][0]! ?? null
                            : null,
                        })
                      }
                    />
                    {label}
                  </LabelForCheckbox>
                  {values && (
                    <PickList
                      className="flex-1 w-0"
                      label={label}
                      value={value}
                      groups={values}
                      disabled={
                        !isFormatterAvailable(items[itemId], key as ItemType)
                      }
                      onChange={(value): void =>
                        dispatch({
                          type: 'ChangeFieldFormatAction',
                          format: key as ItemType,
                          value,
                        })
                      }
                    />
                  )}
                  {extraComponents}
                </div>
              ))}
            </fieldset>
          </section>
        </div>
      </ContainerFull>
    );
  },
  SavingState() {
    return <LoadingScreen />;
  },
});
