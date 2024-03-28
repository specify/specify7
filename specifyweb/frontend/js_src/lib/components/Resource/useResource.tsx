import React from 'react';

import type { GetOrSet } from '../../utils/types';
import type { Tables } from '../DataModel/types';
import type { SavedResource, SavedResourceRef } from './resourceApi';
import { resolveResource, resourceEvents } from './resourceApi';

// A hook that resolves ref and reactively updates on object changes
export const useResource = <TABLE_NAME extends keyof Tables>(
  ref: SavedResourceRef<TABLE_NAME>
): GetOrSet<SavedResource<TABLE_NAME>> => {
  const [resource, setResource] = React.useState(resolveResource(ref));

  const resourceRef = React.useRef(resource);
  resourceRef.current = resource;

  React.useEffect(
    () =>
      resourceEvents.on(
        'changed',
        (changed) =>
          changed.table === ref.table &&
          changed.id !== ref.id &&
          changed !== resourceRef.current
            ? // FIXME: can this type assertion be avoided?
              setResource(changed as SavedResource<TABLE_NAME>)
            : undefined,
        true
      ),
    [ref.table, ref.id]
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
