import React from 'react';

import { ping } from '../ajax';
import { fetchCollection } from '../collection';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
  SpLocaleItemStr as SpLocaleItemString_,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { group } from '../helpers';
import { commonText } from '../localization/common';
import { fetchPickLists } from '../picklists';
import { formatUrl } from '../querystring';
import { createResource, saveResource } from '../resource';
import { schema } from '../schema';
import { findString } from '../schemaconfighelper';
import { reducer } from '../schemaconfigreducer';
import type { IR, PartialBy, RA } from '../types';
import { defined } from '../types';
import { LoadingContext } from './contexts';
import { useId } from './hooks';
import { useUnloadProtect } from './navigation';
import { stateReducer } from './schemaconfigstate';
import type { WithFieldInfo } from './toolbar/schemaconfig';

export type SpLocaleItemString = SerializedResource<SpLocaleItemString_>;
export type NewSpLocaleItemString = PartialBy<SpLocaleItemString, 'id'>;

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
  onSave: handleSaved,
}: {
  readonly languages: IR<string>;
  readonly tables: IR<SerializedResource<SpLocaleContainer>>;
  readonly defaultLanguage: string | undefined;
  readonly defaultTable: SerializedResource<SpLocaleContainer> | undefined;
  readonly webLinks: RA<Readonly<[string, string]>>;
  readonly uiFormatters: RA<UiFormatter>;
  readonly dataObjFormatters: IR<DataObjectFormatter>;
  readonly dataObjAggregators: IR<DataObjectFormatter>;
  readonly onClose: () => void;
  readonly onSave: (language: string) => void;
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

    void f
      .all({
        pickLists: fetchPickLists().then((pickLists) =>
          Object.fromEntries(
            Object.values(pickLists)
              .map(serializeResource)
              .map(({ id, name, isSystem }) => [
                id,
                {
                  name,
                  isSystem,
                },
                // Filter out front-end only pick lists
              ])
              .filter(([id]) => typeof id === 'number')
          )
        ),
        // Fetch table items and their strings
        items: f
          .all({
            items: fetchCollection('SpLocaleContainerItem', {
              limit: 0,
              container: tableId,
            }).then<
              RA<SerializedResource<SpLocaleContainerItem> & WithFieldInfo>
            >(({ records }) =>
              records.map((item) => ({
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
            names: fetchCollection(
              'SpLocaleItemStr',
              {
                limit: 0,
              },
              {
                itemName__container: tableId,
              }
            ).then(({ records }) =>
              Object.fromEntries(
                group(records.map((name) => [name.itemName, name]))
              )
            ),
            descriptions: fetchCollection(
              'SpLocaleItemStr',
              {
                limit: 0,
              },
              {
                itemDesc__container: tableId,
              }
            ).then(({ records }) =>
              Object.fromEntries(
                group(
                  records.map((description) => [
                    description.itemDesc,
                    description,
                  ])
                )
              )
            ),
          })
          .then(({ items, names, descriptions }) =>
            Object.fromEntries(
              items.map((item) => [
                item.id,
                {
                  ...item,
                  strings: {
                    name: findString(
                      names[item.resource_uri],
                      language,
                      country,
                      'itemName',
                      item.resource_uri
                    ),
                    desc: findString(
                      descriptions[item.resource_uri],
                      language,
                      country,
                      'itemDesc',
                      item.resource_uri
                    ),
                  },
                },
              ])
            )
          ),
        containerName: fetchCollection('SpLocaleItemStr', {
          limit: 0,
          containerName: tableId,
        }).then(({ records }) =>
          findString(
            records,
            language,
            country,
            'containerName',
            stateTable.resource_uri
          )
        ),
        containerDescription: fetchCollection('SpLocaleItemStr', {
          limit: 0,
          containerDesc: tableId,
        }).then(({ records }) =>
          findString(
            records,
            language,
            country,
            'containerDesc',
            stateTable.resource_uri
          )
        ),
      })
      .then(({ pickLists, items, containerName, containerDescription }) => {
        if (destructorCalled) return undefined;
        dispatch({
          type: 'FetchedTableDataAction',
          table: {
            ...stateTable,
            strings: {
              name: containerName,
              desc: containerDescription,
            },
            dataModel: {
              pickLists,
            },
          },
          items,
        });
        return undefined;
      });

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [state.type, stateLanguage, stateTable, tableId]);

  const unsetUnloadProtect = useUnloadProtect(
    state.type === 'MainState'
      ? state.tableWasModified || state.modifiedItems.length > 0
      : false,
    commonText('unsavedSchemaUnloadProtect')
  );

  // Save Changes
  const loading = React.useContext(LoadingContext);

  function handleSave(): void {
    if (state.type !== 'MainState') return;
    unsetUnloadProtect();

    const saveString = async (
      resource: NewSpLocaleItemString | SpLocaleItemString
    ): Promise<unknown> =>
      'resource_uri' in resource &&
      typeof resource.id === 'number' &&
      resource.id >= 0
        ? saveResource('SpLocaleItemStr', resource.id, resource)
        : createResource('SpLocaleItemStr', resource);

    const { strings, ...table } = state.table;
    const requests = [
      ...(state.tableWasModified
        ? [
            saveResource('SpLocaleContainer', table.id, table),
            saveString(strings.name),
            saveString(strings.desc),
          ]
        : []),
      ...state.modifiedItems
        .map((id) => state.items[id])
        .flatMap(({ strings, dataModel: _, ...item }) => [
          saveResource('SpLocaleContainerItem', item.id, item),
          saveString(strings.name),
          saveString(strings.desc),
        ]),
    ];

    loading(
      Promise.all(requests)
        .then(async () =>
          ping(
            formatUrl('/context/schema_localization.json', {
              lang: defined(stateLanguage),
            }),
            {
              method: 'HEAD',
              cache: 'no-cache',
            }
          )
        )
        .then(() => handleSaved(state.language))
    );
  }

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
      handleSave,
    },
  });
}
