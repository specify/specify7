import React from 'react';

import { fetchCollection } from '../DataModel/collection';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
  Tables,
} from '../DataModel/types';
import { f } from '../../utils/functools';
import { group, replaceItem } from '../../utils/utils';
import { getModel } from '../DataModel/schema';
import { findString } from './helpers';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import type { NewSpLocaleItemString, SpLocaleItemString } from './index';
import type { SchemaData } from './SetupHooks';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useLiveState } from '../../hooks/useLiveState';
import {SerializedResource} from '../DataModel/helperTypes';

export function useContainer(
  tables: SchemaData['tables'],
  tableName: keyof Tables
): readonly [
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
  itemType: 'containerDesc' | 'containerName',
  container: SerializedResource<SpLocaleContainer>,
  language: string,
  country: string | null
): Readonly<
  readonly [
    NewSpLocaleItemString | SpLocaleItemString | undefined,
    (containerName: NewSpLocaleItemString | SpLocaleItemString) => void,
    boolean
  ]
> {
  const initialValue = React.useRef<
    NewSpLocaleItemString | SpLocaleItemString | undefined
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
  readonly [
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
