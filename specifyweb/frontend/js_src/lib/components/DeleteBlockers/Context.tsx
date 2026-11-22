import React from 'react';

import { resourceEvents } from '../DataModel/resource';
import { error } from '../Errors/assert';
import type { DeleteBlockerState } from './state';
import { DeleteBlockerStore } from './store';

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
  React.useEffect(
    () => () => {
      if (store === null) {
        return;
      }
      store.clearState();
    },
    [store]
  );

  return (
    <DeleteBlockerContext.Provider value={store}>
      {children}
    </DeleteBlockerContext.Provider>
  );
}

export function useDeleteBlockerStore(): DeleteBlockerStore {
  const store = React.useContext(DeleteBlockerContext);
  if (store === null) {
    error('Attempting to access a delete blocker store that is not created');
  }
  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) =>
        store.removeResource(resource.specifyTable.name, resource.id)
      ),
    [store]
  );
  return store;
}
