import React from 'react';

import { fetchCollection } from '../collection';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
  Tables,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { group, replaceItem } from '../helpers';
import { getModel } from '../schema';
import { findString } from '../schemaconfighelper';
import type { RA } from '../types';
import { defined } from '../types';
import { useAsyncState, useLiveState } from './hooks';
import type { NewSpLocaleItemString, SpLocaleItemString } from './schemaconfig';
import type { SchemaData } from './schemaconfigsetuphooks';
import type { WithFetchedStrings } from './toolbar/schemaconfig';

export function useContainer(
  tables: SchemaData['tables'],
  tableName: keyof Tables
): [
  SerializedResource<SpLocaleContainer>,
  (container: SerializedResource<SpLocaleContainer>) => void,
  boolean
] {
  const initialValue = React.useRef<
    SerializedResource<SpLocaleContainer> | undefined
  >(undefined);
  const [state, setState] = useLiveState(
    React.useCallback(() => {
      const container = defined(
        Object.values(tables).find(
          ({ name }) => name.toLowerCase() === tableName.toLowerCase()
        )
      );
      initialValue.current = container;
      return container;
    }, [tables, tableName])
  );
  return [
    state,
    setState,
    JSON.stringify(initialValue.current) !== JSON.stringify(state),
  ];
}

export function useContainerString(
  itemType: 'containerName' | 'containerDesc',
  container: SerializedResource<SpLocaleContainer>,
  language: string,
  country: string | null
): Readonly<
  [
    SpLocaleItemString | NewSpLocaleItemString | undefined,
    (containerName: SpLocaleItemString | NewSpLocaleItemString) => void,
    boolean
  ]
> {
  const initialValue = React.useRef<
    SpLocaleItemString | NewSpLocaleItemString | undefined
  >(undefined);
  const [state, setState] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('SpLocaleItemStr', {
          limit: 0,
          containerName: container.id,
        })
          .then(({ records }) =>
            findString(
              records,
              language,
              country,
              itemType,
              container.resource_uri
            )
          )
          .then((string) => {
            initialValue.current = string;
            return string;
          }),
      [itemType, container.id, container.resource_uri, language, country]
    ),
    false
  );
  return [
    state,
    setState,
    JSON.stringify(initialValue.current) !== JSON.stringify(state),
  ];
}

export function useContainerItems(
  container: SerializedResource<SpLocaleContainer>,
  language: string,
  country: string | null
): Readonly<
  [
    (
      | RA<SerializedResource<SpLocaleContainerItem> & WithFetchedStrings>
      | undefined
    ),
    (
      index: number,
      item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
    ) => void,
    RA<number>
  ]
> {
  const [changed, setChanged] = React.useState<RA<number>>([]);
  const [state, setState] = useAsyncState<
    RA<SerializedResource<SpLocaleContainerItem> & WithFetchedStrings>
  >(
    React.useCallback(
      async () =>
        f
          .all({
            items: fetchCollection('SpLocaleContainerItem', {
              limit: 0,
              container: container.id,
            }),
            names: fetchCollection(
              'SpLocaleItemStr',
              {
                limit: 0,
              },
              {
                itemName__container: container.id,
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
                itemDesc__container: container.id,
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
            items.records
              .filter(
                (item) =>
                  /* Ignore removed fields (i.e, Accession->deaccessions) */
                  getModel(container.name)!.getField(item.name) !== undefined
              )
              .map((item) => ({
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
              }))
          )
          .then((items) => {
            setChanged([]);
            return items;
          }),
      [container.id, container.resource_uri, container.name, language, country]
    ),
    false
  );
  const setItem = React.useCallback(
    (
      index: number,
      item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings
    ) => {
      setChanged([...changed, index]);
      setState(replaceItem(defined(state), index, item));
    },
    [state, setState, changed]
  );
  return [state, setItem, changed];
}
