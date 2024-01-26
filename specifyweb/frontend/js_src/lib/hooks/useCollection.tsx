import React from 'react';

import type { SerializedCollection } from '../components/DataModel/collection';
import type { AnySchema } from '../components/DataModel/helperTypes';
import { f } from '../utils/functools';
import type { GetOrSet } from '../utils/types';
import { defined } from '../utils/types';
import { useAsyncState } from './useAsyncState';

/**
 * A hook for fetching a collection of resources in a paginated way
 */
export function useCollection<SCHEMA extends AnySchema>(
  fetch: (offset: number) => Promise<SerializedCollection<SCHEMA>>
): readonly [
  SerializedCollection<SCHEMA> | undefined,
  GetOrSet<SerializedCollection<SCHEMA> | undefined>[1],
  () => Promise<void>
] {
  const fetchRef = React.useRef<
    Promise<SerializedCollection<SCHEMA> | undefined> | undefined
  >(undefined);

  const callback = React.useCallback(async () => {
    if (typeof fetchRef.current === 'object')
      return fetchRef.current.then(f.undefined);
    if (
      collectionRef.current !== undefined &&
      collectionRef.current?.records.length ===
        collectionRef.current?.totalCount
    )
      return undefined;
    fetchRef.current = fetch(collectionRef.current?.records.length ?? 0).then(
      (data) => {
        fetchRef.current = undefined;
        return data;
      }
    );
    return fetchRef.current;
  }, [fetch]);

  const currentCallback = React.useRef(f.void);

  const [collection, setCollection] = useAsyncState(
    React.useCallback(async () => {
      currentCallback.current = callback;
      fetchRef.current = undefined;
      collectionRef.current = undefined;
      return callback();
    }, [callback]),
    false
  );
  const collectionRef = React.useRef<
    SerializedCollection<SCHEMA> | undefined
  >();
  collectionRef.current = collection;

  const fetchMore = React.useCallback(
    async () =>
      /*
       * Ignore calls to fetchMore before collection is fetched for the first
       * time
       */
      currentCallback.current === callback
        ? typeof fetchRef.current === 'object'
          ? callback().then(f.undefined)
          : callback().then((result) =>
              result !== undefined &&
              result.records.length > 0 &&
              // If the fetch function changed while fetching, discard the results
              currentCallback.current === callback
                ? setCollection((collection) => ({
                    records: [
                      ...defined(
                        collection,
                        'Try to fetch more before collection is fetch.'
                      ).records,
                      ...result.records,
                    ],
                    totalCount: defined(collection).totalCount,
                  }))
                : undefined
            )
        : undefined,
    [callback, collection]
  );

  return [collection, setCollection, fetchMore] as const;
}
