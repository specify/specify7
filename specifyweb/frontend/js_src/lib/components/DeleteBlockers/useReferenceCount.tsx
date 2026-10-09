import React from 'react';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Relationship } from '../DataModel/specifyField';
import { useDeleteBlockerStore } from './Context';

export function useReferenceCount(
  resource: SpecifyResource<AnySchema>,
  relationship: Relationship
): number | undefined {
  const store = useDeleteBlockerStore();

  const referenceCount = React.useSyncExternalStore(store.subscribe, () =>
    store.getReferenceCount(resource, relationship)
  );

  return referenceCount;
}
