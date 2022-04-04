import React from 'react';

import { ajax, ping } from '../ajax';
import { serializeResource } from '../datamodelutils';
import { fetchPickLists } from '../picklists';
import { schema } from '../schema';
import { fetchStrings, prepareNewString } from '../schemaconfighelper';
import { reducer } from '../schemaconfigreducer';
import type { IR, RA } from '../types';
import { crash } from './errorboundary';
import { useId } from './hooks';
import { stateReducer } from './schemaconfigstate';
import type {
  CommonTableFields,
  SpLocaleContainer,
  WithFetchedStrings,
  WithFieldInfo,
} from './toolbar/schemaconfig';

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

export type SpLocaleItemString = CommonTableFields &
  SpLocaleItemStringBase & {
    readonly id: number;
  };

export type NewSpLocaleItemString = SpLocaleItemStringBase & {
  readonly id?: number;
  readonly parent?: string;
};

export type UiFormatter = {
  readonly name: string;
  readonly isSystem: boolean;
  readonly value: string;
};

export type DataObjectFormatter = {
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
  readonly webLinks: RA<Readonly<[string, string]>>;
  readonly uiFormatters: RA<UiFormatter>;
  readonly dataObjFormatters: IR<DataObjectFormatter>;
  readonly dataObjAggregators: IR<DataObjectFormatter>;
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
  const stateLanguage = 'language' in state ? state.language : undefined;
  const stateTable = 'table' in state ? state.table : undefined;
  React.useEffect(() => {
    if (
      state.type !== 'FetchingTableItemsState' ||
      typeof stateLanguage === 'undefined' ||
      typeof stateTable === 'undefined' ||
      typeof tableId === 'undefined'
    )
      return undefined;

    const [language, country = null] = stateLanguage.split('_');

    const fields = Object.fromEntries(
      Object.values(schema.models)
        .find(({ name }) => name.toLowerCase() === stateTable.name)
        ?.fields.map((field) => [
          field.name,
          {
            length: field.length,
            isReadOnly: field.overrides.isReadOnly,
            relatedModelName:
              'relatedModel' in field ? field.relatedModel.name : undefined,
            isRequired: field.overrides.isRequired,
            isRelationship: field.isRelationship,
            type: field.type,
            canChangeIsRequired:
              !field.overrides.isRequired && !field.isRelationship,
          },
        ]) ?? []
    );

    if (Object.keys(fields).length === 0)
      throw new Error('Unable to find table fields');

    void Promise.all([
      fetchPickLists().then((pickLists) =>
        Object.fromEntries(
          Object.values(pickLists)
            .map(serializeResource)
            .map(({ id, name, isSystem }) => [
              id,
              {
                name,
                isSystem,
              },
            ])
        )
      ),
      // Fetch table items and their strings
      ajax<{ readonly objects: RA<SpLocaleItem> }>(
        `/api/specify/splocalecontaineritem/?limit=0&container_id=${tableId}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Accept: 'application/json' } }
      )
        .then(({ data: { objects } }) =>
          destructorCalled ? [] : fetchStrings(objects, language, country)
        )
        .then<RA<SpLocaleItem & WithFetchedStrings & WithFieldInfo>>((items) =>
          items.map((item) => ({
            ...item,
            dataModel: fields[item.name] ?? {
              length: undefined,
              isReadOnly: false,
              relatedModelName: undefined,
              isRequired: false,
              isRelationship: false,
              type: '',
              canChangeIsRequired: false,
            },
          }))
        ),
      // Fetch table strings
      fetchStrings([stateTable], language, country),
    ]).then(([pickLists, items, [table]]) => {
      if (destructorCalled) return undefined;
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
      return undefined;
    });

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [state.type, stateLanguage, stateTable, tableId]);

  // Set unload protect after changes were made
  const changesMade =
    state.type === 'MainState'
      ? state.tableWasModified || state.modifiedItems.length > 0
      : false;
  React.useEffect(() => {
    if (changesMade) setUnloadProtect();
    return removeUnloadProtect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changesMade]);

  // Save Changes
  React.useEffect(() => {
    if (state.type !== 'SavingState') return;
    removeUnloadProtect();

    const saveString = async (
      resource: NewSpLocaleItemString | SpLocaleItemString
    ): Promise<unknown> =>
      'resource_uri' in resource && resource.id >= 0
        ? saveResource(resource as CommonTableFields)
        : ping('/api/specify/splocaleitemstr/', {
            method: 'POST',
            body: prepareNewString(resource as NewSpLocaleItemString),
          });

    const saveResource = async (
      resource: CommonTableFields
    ): Promise<unknown> =>
      ping(resource.resource_uri, {
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
      .catch(crash);
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
