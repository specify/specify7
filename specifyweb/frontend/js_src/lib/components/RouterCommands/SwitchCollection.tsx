import React from 'react';
import type { SafeNavigateFunction } from 'react-router';
import { useLocation, useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { toRelativeUrl } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { locationToState } from '../Router/RouterState';

export const switchCollection = (
  navigate: SafeNavigateFunction,
  collectionId: number,
  nextUrl?: string
): void =>
  navigate(`/specify/command/switch-collection/${collectionId}/`, {
    state: {
      type: 'Command',
      nextUrl:
        nextUrl ?? toRelativeUrl(globalThis.location.href) ?? '/specify/',
    },
  });

export function SwitchCollectionCommand(): null {
  const { collectionId } = useParams();
  const location = useLocation();
  const state = locationToState(location, 'Command');
  const nextUrl = state?.nextUrl ?? '/specify/';

  useAsyncState(
    React.useCallback(
      async () =>
        ping('/context/collection/', {
          method: 'POST',
          body: collectionId!.toString(),
        }).then(() => globalThis.location.assign(nextUrl)),
      [collectionId, nextUrl]
    ),
    true
  );

  return null;
}
