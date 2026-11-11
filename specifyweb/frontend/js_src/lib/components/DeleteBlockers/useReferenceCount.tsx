import React from 'react';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Relationship } from '../DataModel/specifyField';
import { useDeleteBlockerStore } from './Context';

export function useDeleteBlockerCount(resource: SpecifyResource<AnySchema>) {
  const store = useDeleteBlockerStore();

  const blockerCount = React.useSyncExternalStore(store.subscribe, () =>
    store.getAllBlockerCounts(resource)
  );
  return blockerCount;
}

export function useRelationshipReferenceCount(
  resource: SpecifyResource<AnySchema>,
  relationship: Relationship
): number | undefined {
  const store = useDeleteBlockerStore();

  const referenceCount = React.useSyncExternalStore(store.subscribe, () =>
    store.getReferenceCountForRelationship(resource, relationship)
  );

  return referenceCount;
}
