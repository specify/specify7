import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { fetchUserPermissions } from './index';

/**
 * Allows embedding resources from a different collection with corresponding
 * permissions.
 *
 * @remarks
 * Wrap components in this to ensure that permissions for an appropriate
 * collection are fetched before components are rendered.
 *
 * This does not automatically provide correct collection ID to hasPermission
 * and other permission function calls.
 */
export function SetPermissionContext({
  collectionId,
  children,
  fallback,
}: {
  readonly collectionId: number;
  readonly children: React.ReactNode | (() => React.ReactNode);
  readonly fallback?: JSX.Element;
}): JSX.Element {
  const [fetchedCollection] = useAsyncState(
    React.useCallback(
      async () => fetchUserPermissions(collectionId),
      [collectionId]
    ),
    true
  );
  return (
    <PermissionContext.Provider value={collectionId}>
      {fetchedCollection === collectionId
        ? typeof children === 'function'
          ? children()
          : children
        : fallback}
    </PermissionContext.Provider>
  );
}

const PermissionContext = React.createContext<number | undefined>(undefined);
PermissionContext.displayName = 'PermissionContext';
