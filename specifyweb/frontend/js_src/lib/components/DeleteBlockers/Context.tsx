import React from 'react';
import { DeleteBlockerState, resourceToStringIdentifier } from './state';
import { error } from '../Errors/assert';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { DeleteBlockerResource, DeleteBlockerStore } from './store';
import { RA } from '../../utils/types';
import { Relationship } from '../DataModel/specifyField';
import { DeleteBlockerLRUPage } from './pageCache';

const DeleteBlockerContext = React.createContext<DeleteBlockerStore | null>(
  null
);

export function DeleteBlockerProvider({
  blockerStoreParams,
  children,
}: {
  readonly blockerStoreParams?: ConstructorParameters<
    typeof DeleteBlockerState
  >[0];
  readonly children: JSX.Element;
}) {
  const existingStore = React.useContext(DeleteBlockerContext);
  if (existingStore !== null) {
    return children;
  }
  const deleteBlockerStore = React.useRef<DeleteBlockerStore>(
    new DeleteBlockerStore(blockerStoreParams)
  );

  const store = deleteBlockerStore.current;
  React.useEffect(() => {
    return () => {
      if (store === null) {
        return;
      }
      store.clearState();
    };
  }, [store]);

  return (
    <DeleteBlockerContext.Provider value={store}>
      {children}
    </DeleteBlockerContext.Provider>
  );
}

function useDeleteBlockerStore(): DeleteBlockerStore {
  const store = React.useContext(DeleteBlockerContext);
  if (store === null) {
    error('Attempting to access a delete blocker store that is not created');
  }
  return store;
}

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

export function useDeleteBlockerPages(
  resource: SpecifyResource<AnySchema>,
  relationship: Relationship
) {
  const store = useDeleteBlockerStore();

  const [anchor, setAnchor] = React.useState<number | null>(null);

  React.useEffect(() => {
    store.filterBlockers(resource, relationship, anchor);
  }, [store, resource, relationship]);

  async function handleNextPageFetch(
    previousPage: DeleteBlockerLRUPage,
    direction: 'next' | 'previous' | 'first' | 'last'
  ) {
    const backwards = direction === 'previous' || direction === 'last';
    const anchor =
      direction === 'next'
        ? previousPage.ids.at(-1)
        : direction === 'previous'
          ? previousPage.ids.at(0)
          : null;
    setAnchor(anchor ?? null);
    store.filterBlockers(resource, relationship, anchor, backwards);
  }

  const deleteBlockerPage = React.useSyncExternalStore(store.subscribe, () =>
    store.getCachedPage(resource, relationship, anchor)
  );

  return {
    page: deleteBlockerPage,
    onNextPageFetch: handleNextPageFetch,
  };
}
