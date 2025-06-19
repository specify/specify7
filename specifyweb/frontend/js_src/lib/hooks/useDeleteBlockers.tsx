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
 * keys
 */

/**
 * False if the blockers have not been fetched, undefined if the blockers are
 * being fetched
 */
export type MaybeBlocker = RA<DeleteBlocker> | false | undefined;

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
  const [blockers, setBlockers] = useAsyncState(
    React.useCallback(
      async () => (deferred ? false : fetchDeleteBlockers(resource)),
      [resource, deferred]
    ),
    false
  );

  const fetchBlockers = React.useCallback(
    (forceRefetch: boolean = false) => {
      if (deferred && !Array.isArray(blockers)) setDeferred(false);
      else if (forceRefetch) {
        setDeferred(false);
        setBlockers(undefined);
        fetchDeleteBlockers(resource).then(setBlockers);
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
