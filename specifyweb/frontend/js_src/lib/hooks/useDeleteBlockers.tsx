import React from 'react';
import { AnySchema } from '../components/DataModel/helperTypes';
import { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import { fetchDeleteBlockers } from '../components/Forms/DeleteButton';
import { GetOrSet } from '../utils/types';
import { SET } from '../utils/utils';
import { useAsyncState } from './useAsyncState';
import { useLiveState } from './useLiveState';

import { DeleteBlocker } from '../components/Forms/DeleteBlocked';
import { RA } from '../utils/types';

/**
 * REFACTOR (Performance): Store DeleteBlockers in a WeakMap with Resources as
 * keys
 */

/**
 * false if the blockers have not been fetched, undefined if the blockers are
 * being fetched
 */
export type MaybeBlocker = RA<DeleteBlocker> | undefined | false;

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
