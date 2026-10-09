import React from 'react';
import { resourceToStringIdentifier } from './state';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { DeleteBlockerResource } from './store';
import { RA } from '../../utils/types';
import { useDeleteBlockerStore } from './Context';

export function useDeleteBlockersForResource(
  resource: SpecifyResource<AnySchema>
): RA<DeleteBlockerResource> | undefined {
  const store = useDeleteBlockerStore();
  const blockerKey = resourceToStringIdentifier(resource);

  React.useEffect(() => {
    void store.seedBlockers(resource);
  }, [store, blockerKey]);

  const nodeVersion = React.useSyncExternalStore(
    store.subscribe,
    () => store.getNode(blockerKey)?.version ?? 0
  );

  const records = React.useMemo(
    () => store.getBlockerGraph(resource),
    [store, nodeVersion, blockerKey]
  );

  return records;
}
