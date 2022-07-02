/** Still work in progress */
// REFACTOR: remove these comments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react';

import type { Tables } from '../datamodel';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { getModel } from '../schema';
import { isFunction } from '../types';
import { crash } from './errorboundary';
import { useAsyncState } from './hooks';

type Buckets = {
  [TABLE_NAME in keyof Tables as `/api/specify/${TABLE_NAME}/`]?: Record<
    number,
    SpecifyResource<Tables[TABLE_NAME]>
  >;
};

type Store<
  BUCKETS extends Record<
    string | number,
    Record<string | number, object | boolean | string | number>
  >
> = {
  [BUCKET_NAME in keyof BUCKETS]: {
    listeners: (() => void)[];
    readonly values: {
      [KEY in keyof BUCKETS[BUCKET_NAME]]?: Promise<
        BUCKETS[BUCKET_NAME][KEY] | undefined
      >;
    };
  };
};

const store: Store<Buckets> = {};

/**
 * A wrapper for useAsyncState that remembers the results of previous
 * async calls with the same ID, keeps track of subsequent state updates
 * and deletions.
 */
export function useStore<
  BUCKET_NAME extends keyof Buckets,
  ID extends keyof Buckets[BUCKET_NAME]
>(
  callback: (id: ID) => Promise<Buckets[BUCKET_NAME][ID]>,
  deleteCallback: (
    id: ID,
    value: Buckets[BUCKET_NAME][ID] | undefined
  ) => Promise<undefined>,
  bucketName: BUCKET_NAME,
  id: ID,
  // Show the loading screen while the promise is being resolved
  loadingScreen: boolean
): [
  state: Buckets[BUCKET_NAME][ID] | undefined,
  setState: React.Dispatch<
    React.SetStateAction<Buckets[BUCKET_NAME][ID] | undefined>
  >
] {
  const [state, setState] = useAsyncState<Buckets[BUCKET_NAME][ID]>(
    React.useCallback(() => {
      if (store[bucketName] === undefined)
        store[bucketName] = {
          listeners: [],
          values: {},
        };
      if (store[bucketName].values[id] === undefined)
        store[bucketName].values[id] = callback(id);
      return store[bucketName].values[id];
    }, [callback, bucketName, id]),
    loadingScreen
  );
  const updateState: React.Dispatch<
    React.SetStateAction<Buckets[BUCKET_NAME][ID] | undefined>
  > = React.useCallback(
    (newState) => {
      setState((oldState) => {
        const resolvedState = (
          isFunction(newState) ? newState(oldState) : newState
        ) as Buckets[BUCKET_NAME][ID] | undefined;
        if (typeof oldState === 'object' && resolvedState === undefined)
          deleteCallback(id, store[bucketName][id]).catch(crash);
        store[bucketName][id] = Promise.resolve(resolvedState);
        store[bucketName].listeners.forEach(f.call);
        return resolvedState;
      });
    },
    [setState, deleteCallback, bucketName, id]
  );
  React.useEffect(() => {
    if (store[bucketName] === undefined)
      store[bucketName] = {
        listeners: [],
        values: {},
      };
    const listener = (): void => updateState(store[bucketName][id]);
    store[bucketName].listeners.push(listener);
    return (): void => {
      store[bucketName].listeners = store[bucketName].listeners.filter(
        (item) => item !== listener
      );
    };
  }, [updateState, bucketName, id]);

  return [state, updateState];
}

/** A wrapper for useRecord for easier usage with table records */
export function useRecord<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number,
  loadingScreen: boolean
): [
  state: Buckets[`/api/specify/${TABLE_NAME}/`][number] | undefined,
  setState: React.Dispatch<
    React.SetStateAction<
      Buckets[`/api/specify/${TABLE_NAME}/`][number] | undefined
    >
  >
] {
  return useStore(
    React.useCallback(
      (id: number) => {
        const resource = new defined(getModel(tableName)).Resource({ id });
        return resource.fetch();
      },
      [tableName]
    ),
    React.useCallback(
      (_id, resourcePromise) =>
        resourcePromise?.then((resource) => resource?.delete()),
      [tableName]
    ),
    `/api/specify/${tableName}/` as const,
    id,
    loadingScreen
  );
}
