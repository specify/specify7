import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import commonText from '../localization/common';
import {
  filterFormatters,
  getItemType,
  isFormatterAvailable,
  javaTypeToHuman,
} from '../schemaconfighelper';
import type { Actions } from '../schemaconfigreducer';
import type { IR, RA, RR } from '../types';
import { sortFunction, sortObjectsByKey, split } from '../wbplanviewhelper';
import {
  Button,
  className,
  Container,
  H2,
  H3,
  Input,
  Label,
  Link,
  Select,
  Textarea,
  Ul,
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
    readonly webLinks: RA<Readonly<[string, string]>>;
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
        buttons={
          <>
            <Button.DialogClose>{commonText('close')}</Button.DialogClose>
            <Button.Blue
              onClick={(): void =>
                dispatch({
                  type: 'AddLanguageAction',
                })
              }
            >
              {commonText('addLanguage')}
            </Button.Blue>
          </>
        }
      >
        {commonText('language')}
        <Ul>
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
        </Ul>
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
        onClose={handleClose}
        onGoBack={(): void =>
          dispatch({
            type: 'ChangeLanguageAction',
          })
        }
        onAddLanguage={(language): void =>
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
        header={commonText('tables')}
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
        <Ul className="max-h-80">
          {sortedTables.map((table) => (
            <li key={table.id}>
              <Link.Default
                href={`/task/schema-config/?language=${language}&table=${table.name}`}
              >
                <TableIcon name={table.name} tableLabel={false} />
                {table.name}
              </Link.Default>
            </li>
          ))}
        </Ul>
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
    const [fields, relationships] = split(
      sortedItems,
      (items) => items.dataModel.isRelationship
    );
    const [userPickLists, systemPickLists] = split(
      Object.values(table.dataModel.pickLists),
      ({ isSystem }) => isSystem
    ).map((group) =>
      group
        .map(({ name }) => name)
        .sort()
        .map((name) => [name, name] as const)
    );
    const currentPickListId = Object.entries(table.dataModel.pickLists).find(
      ([_id, { name }]) => name === items[itemId].picklistname
    )?.[0];
    return (
      <Container.Full>
        <header className="gap-x-2 flex">
          <H2>
            {commonText('schemaConfig')} (
            {languages[language]?.replaceAll(/[()]/g, '') ?? language})
          </H2>
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
            <H3>
              {commonText('tableInline')} {table.name}
            </H3>
            <Label.Generic>
              {commonText('caption')}
              <Input.Text
                value={table.strings.name.text}
                onValueChange={(value): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'name',
                    value,
                  })
                }
              />
            </Label.Generic>
            <Label.Generic>
              {commonText('description')}
              <Textarea
                className="resize-y h-[15vh]"
                value={table.strings.desc.text}
                onValueChange={(value): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'desc',
                    value,
                  })
                }
              />
            </Label.Generic>
            <Label.Generic>
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
            </Label.Generic>
            <Label.Generic>
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
            </Label.Generic>
            <Label.ForCheckbox>
              <Input.Checkbox
                checked={table.ishidden}
                onValueChange={(value): void =>
                  dispatch({
                    type: 'TableModifiedAction',
                    field: 'ishidden',
                    value,
                  })
                }
              />
              {commonText('hideTable')}
            </Label.ForCheckbox>
          </section>
          <section className="sm:overflow-y-auto gap-y-4 flex flex-col flex-1">
            <H3 id={id('fields-label')}>{commonText('fields')}</H3>
            <Select
              className="min-h-[30vh] h-full sm:min-h-0 overflow-y-auto"
              size={2}
              aria-labelledby={id('fields-label')}
              onValueChange={(value): void =>
                dispatch({
                  type: 'ChangeItemAction',
                  itemId: Number.parseInt(value),
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
            </Select>
          </section>
          <section className="sm:overflow-y-auto gap-y-4 flex flex-col flex-1">
            <H3>
              {commonText('field')}: {items[itemId].name}
            </H3>
            <Label.Generic>
              {commonText('caption')}
              <Input.Text
                value={items[itemId].strings.name.text}
                onValueChange={(value): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'name',
                    value,
                  })
                }
              />
            </Label.Generic>
            <Label.Generic>
              {commonText('description')}
              <Textarea
                className="resize-y h-[15vh]"
                value={items[itemId].strings.desc.text}
                onValueChange={(value): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'desc',
                    value,
                  })
                }
              />
            </Label.Generic>
            <Label.Generic>
              {commonText('length')}
              <Input.Number
                value={items[itemId].dataModel.length ?? ''}
                readOnly={true}
                className="no-arrows"
              />
            </Label.Generic>
            <Label.Generic>
              {commonText('type')}
              <Input.Text
                readOnly={true}
                value={javaTypeToHuman(
                  items[itemId].dataModel.type,
                  items[itemId].dataModel.relatedModelName
                )}
              />
            </Label.Generic>
            <Label.ForCheckbox>
              <Input.Checkbox
                checked={items[itemId].ishidden}
                onValueChange={(value): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'ishidden',
                    value,
                  })
                }
              />
              {commonText('hideField')}
            </Label.ForCheckbox>
            <Label.ForCheckbox>
              <Input.Checkbox
                checked={items[itemId].dataModel.readOnly ?? false}
                disabled={true}
              />
              {commonText('readOnly')}
            </Label.ForCheckbox>
            <Label.ForCheckbox>
              <Input.Checkbox
                checked={
                  items[itemId].dataModel.canChangeIsRequired
                    ? items[itemId].dataModel.isRequired
                    : items[itemId].isrequired ?? false
                }
                disabled={!items[itemId].dataModel.canChangeIsRequired}
                onValueChange={(value): void =>
                  dispatch({
                    type: 'FieldModifiedAction',
                    field: 'isrequired',
                    value,
                  })
                }
              />
              {commonText('required')}
            </Label.ForCheckbox>
            <fieldset className="flex flex-col gap-1">
              <legend>{commonText('fieldFormat')}</legend>
              {Object.entries<
                RR<
                  ItemType,
                  {
                    label: string;
                    value: string | null;
                    values:
                      | IR<RA<Readonly<[key: string, value: string]>>>
                      | undefined;
                    extraComponents?: JSX.Element;
                  }
                >
              >({
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
                      .map(
                        ({ name, isSystem, value }) =>
                          [
                            name,
                            `${name} ${value}${
                              isSystem ? ` (${commonText('system')})` : ''
                            }`,
                          ] as const
                      )
                      .sort(sortFunction((value) => value[1])),
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
                      {typeof currentPickListId === 'string' && (
                        <Link.Icon
                          icon="pencil"
                          title={commonText('edit')}
                          aria-label={commonText('edit')}
                          href={`/specify/view/picklist/${currentPickListId}/`}
                        />
                      )}
                      <Link.Icon
                        icon="plus"
                        href="/specify/view/picklist/new/"
                        title={commonText('add')}
                        aria-label={commonText('add')}
                      />
                    </>
                  ),
                },
              }).map(([key, { label, value, values, extraComponents }]) => (
                <div className={className.labelForCheckbox} key={key}>
                  <Label.ForCheckbox>
                    <Input.Radio
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
                          value:
                            typeof values === 'object'
                              ? Object.values(values)[0][0][0]! ?? null
                              : null,
                        })
                      }
                    />
                    {label}
                  </Label.ForCheckbox>
                  {values && (
                    <PickList
                      className="flex-1 w-0"
                      label={label}
                      value={value}
                      groups={values}
                      disabled={!isFormatterAvailable(items[itemId], key)}
                      onChange={(value): void =>
                        dispatch({
                          type: 'ChangeFieldFormatAction',
                          format: key,
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
      </Container.Full>
    );
  },
  SavingState() {
    return <LoadingScreen />;
  },
});
