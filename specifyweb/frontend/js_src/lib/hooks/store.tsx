/** Still work in progress */
// REFACTOR: remove these comments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react';

import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { strictGetModel } from '../components/DataModel/schema';
import type { Tables } from '../components/DataModel/types';
import { crash } from '../components/Errors/Crash';
import { f } from '../utils/functools';
import type { GetOrSet } from '../utils/types';
import { isFunction } from '../utils/types';
import { useAsyncState } from './useAsyncState';

/*
 * FEATURE: when creating an object singleton, support not just existing resources
 * FEATURE: add agent and accessible collections to store
 * FEATURE: don't reRun format() unless changed
 * FEATURE: evaluate relevancy of resource collection
 * REFACTOR: integrate with useCollection when rewriting the ORM
 */

type Buckets = {
  readonly [TABLE_NAME in keyof Tables as `/api/specify/${TABLE_NAME}/`]?: Record<
    number,
    SpecifyResource<Tables[TABLE_NAME]>
  >;
};

type Store<
  BUCKETS extends Record<
    number | string,
    Record<number | string, boolean | number | object | string>
  >
> = {
  readonly [BUCKET_NAME in keyof BUCKETS]: {
    readonly listeners: readonly (() => void)[];
    readonly values: {
      readonly [KEY in keyof BUCKETS[BUCKET_NAME]]?: Promise<
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
): GetOrSet<Buckets[BUCKET_NAME][ID] | undefined> {
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
): GetOrSet<Buckets[`/api/specify/${TABLE_NAME}/`][number] | undefined> {
  return useStore(
    React.useCallback(
      async (id: number) => {
        const resource = new (strictGetModel(tableName).Resource)({ id });
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
