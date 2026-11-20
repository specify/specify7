import React from 'react';
import { resourceToStringIdentifier } from './state';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { DeleteBlockerResource } from './store';
import { RA } from '../../utils/types';
import { useDeleteBlockerStore } from './Context';
import { useLiveState } from '../../hooks/useLiveState';

export function useDeleteBlockersForResource(
  resource: SpecifyResource<AnySchema>,
  initialDeferred: boolean = false
): {
  readonly blockers: RA<DeleteBlockerResource> | undefined | false;
  readonly onBlockersRequested: () => void;
} {
  const store = useDeleteBlockerStore();
  const blockerKey = resourceToStringIdentifier(resource);

  const [deferred, setDeferred] = useLiveState<boolean>(
    React.useCallback(() => initialDeferred, [initialDeferred, resource])
  );

  const handleBlockersRequested = React.useCallback(() => {
    setDeferred(false);
  }, []);

  React.useEffect(() => {
    if (!deferred) {
      void store.seedBlockers(resource);
    }
  }, [store, blockerKey, deferred]);

  const nodeVersion = React.useSyncExternalStore(
    store.subscribe,
    () => store.getNode(blockerKey)?.version ?? 0
  );

  const records = React.useMemo(
    () => store.getBlockerGraph(resource),
    [store, nodeVersion, blockerKey]
  );

  return {
    blockers: deferred && records === undefined ? false : records,
    onBlockersRequested: handleBlockersRequested,
  };
}

export function useDirectDeleteBlockersForResource(
  resource: SpecifyResource<AnySchema>,
  initialDeferred: boolean = false
): {
  readonly blockers: DeleteBlockerResource | undefined | false;
  readonly onBlockersRequested: () => void;
} {
  const store = useDeleteBlockerStore();
  const blockerKey = resourceToStringIdentifier(resource);

  const [deferred, setDeferred] = useLiveState<boolean>(
    React.useCallback(() => initialDeferred, [initialDeferred, resource])
  );

  const handleBlockersRequested = React.useCallback(() => {
    setDeferred(false);
  }, []);

  React.useEffect(() => {
    if (!deferred) {
      void store.seedBlockers(resource);
    }
  }, [store, blockerKey, deferred]);

  const nodeVersion = React.useSyncExternalStore(
    store.subscribe,
    () => store.getNode(blockerKey)?.version ?? 0
  );

  const records = React.useMemo(
    () => store.getDirectBlockers(resource),
    [store, nodeVersion, blockerKey]
  );

  return {
    blockers: records === undefined && deferred ? false : records,
    onBlockersRequested: handleBlockersRequested,
  };
}
