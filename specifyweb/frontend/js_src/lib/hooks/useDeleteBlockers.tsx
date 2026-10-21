import React from 'react';

import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import type { DeleteBlocker } from '../components/Forms/DeleteBlocked';
import { fetchDeleteBlockers } from '../components/Forms/DeleteButton';
import type { GetOrSet } from '../utils/types';
import type { RA } from '../utils/types';
import type { SET } from '../utils/utils';
import { useAsyncState } from './useAsyncState';
import { useLiveState } from './useLiveState';

/**
 * REFACTOR (Performance): Store DeleteBlockers in a WeakMap with Resources as
 * keys.
 *
 * See components/DataModel/saveBlockers.tsx for inspiration
 */

/**
 * False if the blockers have not been fetched, undefined if the blockers are
 * being fetched
 */
export type MaybeBlocker = RA<DeleteBlocker> | false | undefined;

/**
 * Fetch the delete blockers for a given resource.
 * If initialDeferred is true, the delete blockers will not be fetched until
 * the fetchBlockers function is called. Fetching blockers which are already
 * fetched will have no effect unless the forceFetch option is passed to
 * fetchBlockers, i.e., `fetchBlockers(true)` is called.
 *
 *
 * Example:
 * ```js
 * const {blockers, setBlockers, fetchBlockers} = useDeleteBlockers(resource);
 * // blockers will be undefined if being fetched, and false if fetching was
 * // deferred.
 *
 * blockers === false ?
 *     // blockers were deferred
 *     // ... prefetch logic
 *     fetchBlockers();
 * : blockers === undefined ?
 *     // loading... logic
 * : blockers.map... // we have the delete blocker array
 * ```
 *
 * When the resource is saved, the delete blockers will automatically be
 * refetched
 */
export function useDeleteBlockers(
  resource: SpecifyResource<AnySchema>,
  initialDeferred: boolean = false
): {
  readonly blockers: MaybeBlocker;
  readonly setBlockers: GetOrSet<MaybeBlocker>[typeof SET];
  readonly fetchBlockers: (forceRefetch?: boolean) => void;
} {
  const [deferred, setDeferred] = useLiveState<boolean>(
    React.useCallback(() => initialDeferred, [initialDeferred, resource])
  );
  const fetchingBlockers = React.useRef(!deferred);

  const rawFetchBlockers = React.useCallback(async () => {
    fetchingBlockers.current = true;
    return fetchDeleteBlockers(resource).then((blockers) => {
      fetchingBlockers.current = false;
      return blockers;
    });
  }, [resource]);

  const [blockers, setBlockers] = useAsyncState(
    React.useCallback(
      async () => (deferred ? false : rawFetchBlockers()),
      [rawFetchBlockers, deferred]
    ),
    false
  );

  const fetchBlockers = React.useCallback(
    (forceRefetch: boolean = false): void => {
      if (fetchingBlockers.current) {
        return undefined;
      }
      if (deferred) {
        setBlockers(undefined);
        setDeferred(false);
      } else if (forceRefetch) {
        setBlockers(undefined);
        rawFetchBlockers().then(setBlockers);
      }
    },
    [blockers, deferred, setBlockers, setDeferred]
  );

  React.useEffect(
    () =>
      deferred && blockers === false
        ? undefined
        : resourceOn(resource, 'saved', () => fetchBlockers(true), false),
    [resource, blockers, deferred, fetchBlockers]
  );

  return {
    blockers,
    setBlockers,
    fetchBlockers,
  };
}
