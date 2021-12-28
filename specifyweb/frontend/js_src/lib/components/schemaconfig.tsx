import React from 'react';
import ajax from '../ajax';

import schema from '../schema';
import { fetchStrings, prepareNewString } from '../schemaconfighelper';
import { reducer } from '../schemaconfigreducer';
import type { IR, RA } from '../types';
import { useId } from './common';
import { stateReducer } from './schemaconfigstate';
import type {
  CommonTableFields,
  SpLocaleContainer,
  WithFetchedStrings,
  WithFieldInfo,
} from './schemaconfigwrapper';
import { handlePromiseReject } from './wbplanview';

export type SpLocaleItem = CommonTableFields & {
  readonly id: number;
  readonly format: null;
  readonly ishidden: boolean;
  readonly isrequired: boolean;
  /*
   * Readonly issystem: boolean;
   * readonly isuiformatter: boolean;
   */
  readonly name: string;
  readonly picklistname: string | null;
  readonly type: null;
  readonly weblinkname: string | null;
  /*
   * Readonly container: string;
   * readonly spexportschemaitems: string;
   */
  readonly descs: string;
  readonly names: string;
};

type SpLocaleItemStringBase = {
  readonly country: string | null;
  readonly language: string;
  readonly text: string;
  readonly containerdesc?: string;
  readonly contaninername?: string;
  readonly itemdesc?: string;
  readonly itemname?: string;
  // Readonly variant: null;
};

export type SpLocaleItemStr = CommonTableFields &
  SpLocaleItemStringBase & {
    readonly id: number;
  };

export type NewSpLocaleItemStr = SpLocaleItemStringBase & {
  readonly id?: number;
  readonly parent?: string;
};

export type UiFormatter = {
  readonly name: string;
  readonly isSystem: boolean;
  readonly isDefault: boolean;
  readonly value: string;
};

export type DataObjFormatter = {
  readonly title: string;
  readonly className: string;
};

export type ItemType = 'none' | 'formatted' | 'webLink' | 'pickList';

export function SchemaConfig({
  languages,
  tables,
  defaultLanguage,
  defaultTable,
  webLinks,
  uiFormatters,
  dataObjFormatters,
  dataObjAggregators,
  onClose: handleClose,
  onSave: handleSave,
  removeUnloadProtect,
  setUnloadProtect,
}: {
  readonly languages: IR<string>;
  readonly tables: IR<SpLocaleContainer>;
  readonly defaultLanguage: string | undefined;
  readonly defaultTable: SpLocaleContainer | undefined;
  readonly webLinks: RA<string>;
  readonly uiFormatters: RA<UiFormatter>;
  readonly dataObjFormatters: IR<DataObjFormatter>;
  readonly dataObjAggregators: IR<DataObjFormatter>;
  readonly onClose: () => void;
  readonly onSave: (language: string) => void;
  readonly removeUnloadProtect: () => void;
  readonly setUnloadProtect: () => void;
}): JSX.Element {
  const [state, dispatch] = React.useReducer(
    reducer,
    typeof defaultTable === 'undefined' ||
      typeof defaultLanguage === 'undefined'
      ? typeof defaultLanguage === 'undefined'
        ? {
            type: 'ChooseLanguageState',
          }
        : {
            type: 'ChooseTableState',
            language: defaultLanguage,
          }
      : {
          type: 'FetchingTableItemsState',
          language: defaultLanguage,
          table: defaultTable,
        }
  );

  const id = useId('schema-config');

  // Fetch table items after table is selected
  const tableId = 'table' in state ? state.table.id : undefined;
  React.useEffect(() => {
    if (
      state.type !== 'FetchingTableItemsState' ||
      typeof tableId === 'undefined'
    )
      return undefined;

    const [language, country = null] = state.language.split('_');

    const fields = Object.fromEntries(
      Object.values(schema.models)
        .find(({ name }) => name.toLowerCase() === state.table.name)
        ?.fields.map((field) => [
          field.name,
          {
            length: field.length,
            readOnly: field.readOnly,
            relatedModelName:
              'relatedModelName' in field ? field.relatedModelName : undefined,
            isRequired: field.isRequired,
            isRelationship: field.isRelationship,
            type: field.type,
            canChangeIsRequired: !field.isRequired && !field.isRelationship,
          },
        ]) ?? []
    );

    if (Object.keys(fields).length === 0)
      throw new Error('Unable to find table fields');

    Promise.all([
      // Fetch all picklists
      ajax<{
        readonly objects: RA<{
          readonly id: string;
          readonly name: string;
          readonly issystem: boolean;
        }>;
      }>(`/api/specify/picklist/?domainfilter=true&limit=0`).then(
        ({ data: { objects } }) =>
          Object.fromEntries(
            objects.map(({ id, name, issystem }) => [
              id,
              {
                name,
                isSystem: issystem,
              },
            ])
          )
      ),
      // Fetch table items and their strings
      fetch(
        `/api/specify/splocalecontaineritem/?limit=0&container_id=${tableId}`
      )
        .then<{ readonly objects: RA<SpLocaleItem> }>(async (response) =>
          response.json()
        )
        .then(({ objects }) =>
          destructorCalled ? [] : fetchStrings(objects, language, country)
        )
        .then<RA<SpLocaleItem & WithFetchedStrings & WithFieldInfo>>((items) =>
          items.map((item) => ({
            ...item,
            dataModel: fields[item.name] ?? {
              length: undefined,
              readOnly: false,
              relatedModelName: undefined,
              isRequired: false,
              isRelationship: false,
              type: '',
              canChangeIsRequired: false,
            },
          }))
        ),
      // Fetch table strings
      fetchStrings([state.table], language, country),
    ])
      .then(([pickLists, items, [table]]) => {
        if (destructorCalled) return;
        dispatch({
          type: 'FetchedTableDataAction',
          table: {
            ...table,
            dataModel: {
              pickLists,
            },
          },
          items: Object.fromEntries(items.map((item) => [item.id, item])),
        });
      })
      .catch(handlePromiseReject);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [state.type, tableId]);

  // Set unload protect after changes were made
  const changesMade =
    state.type === 'MainState'
      ? state.tableWasModified || state.modifiedItems.length > 0
      : false;
  React.useEffect(() => {
    if (changesMade) setUnloadProtect();
    return removeUnloadProtect;
  }, [changesMade]);

  // Save Changes
  React.useEffect(() => {
    if (state.type !== 'SavingState') return;
    removeUnloadProtect();

    const saveString = async (
      resource: NewSpLocaleItemStr | SpLocaleItemStr
    ): Promise<unknown> =>
      'resource_uri' in resource && resource.id >= 0
        ? saveResource(resource as CommonTableFields)
        : ajax('/api/specify/splocaleitemstr/', {
            method: 'POST',
            body: prepareNewString(resource as NewSpLocaleItemStr),
          });

    const saveResource = async (
      resource: CommonTableFields
    ): Promise<unknown> =>
      ajax(resource.resource_uri, {
        method: 'PUT',
        body: resource,
      });

    const { strings, ...table } = state.table;
    const requests = [
      ...(state.tableWasModified
        ? [
            saveResource(table),
            saveString(strings.name),
            saveString(strings.desc),
          ]
        : []),
      ...state.modifiedItems
        .map((id) => state.items[id])
        .flatMap(({ strings, dataModel: _, ...item }) => [
          saveResource(item),
          saveString(strings.name),
          saveString(strings.desc),
        ]),
    ];

    Promise.all(requests)
      .then(() => handleSave(state.language))
      .catch(handlePromiseReject);
  }, [state.type]);

  return stateReducer(<i />, {
    ...state,
    parameters: {
      languages,
      tables,
      dispatch,
      id,
      handleClose,
      webLinks,
      uiFormatters,
      dataObjFormatters,
      dataObjAggregators,
    },
  });
}
