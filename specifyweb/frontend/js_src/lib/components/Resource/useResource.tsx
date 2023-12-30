import React from 'react';

import type { GetOrSet } from '../../utils/types';
import type { Tables } from '../DataModel/types';
import type { SavedResource } from './resourceApi';
import { resolveResource, resourceEvents } from './resourceApi';

// A hook that resolves ref and reactively updates on object changes
export const useResource = <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number
): GetOrSet<SavedResource<TABLE_NAME>> => {
  const [resource, setResource] = React.useState(
    resolveResource(tableName, id)
  );

  const resourceRef = React.useRef(resource);
  resourceRef.current = resource;

  React.useEffect(
    () =>
      resourceEvents.on(
        'changed',
        (change) => {
          if (change.tableName !== tableName || change.id !== id) return;
          const resolved = resolveResource(tableName, id);
          if (resolved !== resourceRef.current) setResource(resolved);
        },
        true
      ),
    [tableName, id]
  );

  return [
    resource,
    React.useCallback((newResource) => {
      const resolved =
        typeof newResource === 'function'
          ? newResource(resourceRef.current)
          : newResource;
      if (resolved !== resourceRef.current) setResource(resolved);
    }, []),
  ];
};
