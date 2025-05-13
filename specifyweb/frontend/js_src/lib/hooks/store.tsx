/** Still work in progress */
// REFACTOR: remove these comments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react';

import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { strictGetTable } from '../components/DataModel/tables';
import type { Tables } from '../components/DataModel/types';
import { crash } from '../components/Errors/Crash';
import { f } from '../utils/functools';
import type { GetOrSet } from '../utils/types';
import { isFunction } from '../utils/types';
import { useAsyncState } from './useAsyncState';

/*
 * FEATURE: add agent and accessible collections to store
 * FEATURE: don't reRun format() unless changed
 * FEATURE: evaluate relevancy of resource collection
 * FEATURE: cache formatted resources
 * REFACTOR: integrate with useCollection when rewriting the ORM
 */
/*
 * REFACTOR: experiment with an object singleton:
 * There is only ever one instance of a record with the same table name
 * and id. Any changes in one place propagate to all the other places where
 * that record is used. Record is only fetched once and updates are kept track
 * of. When requesting object fetch, return the previous fetched version, while
 * fetching the new one.
 * FEATURE: when creating an object singleton, support not just existing resources
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
  >,
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
  ID extends keyof Buckets[BUCKET_NAME],
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
        const resource = new (strictGetTable(tableName).Resource)({ id });
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
