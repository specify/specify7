import React from 'react';
import { DeleteBlockerState } from './state';
import { error } from '../Errors/assert';
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

export function useDeleteBlockerStore(): DeleteBlockerStore {
  const store = React.useContext(DeleteBlockerContext);
  if (store === null) {
    error('Attempting to access a delete blocker store that is not created');
  }
  return store;
}
