import React from 'react';
import type { NavigateFunction } from 'react-router/lib/hooks';
import { useLocation, useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { toRelativeUrl } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';

export const switchCollection = (
  navigate: NavigateFunction,
  collectionId: number,
  nextUrl?: string
): void =>
  navigate(`/specify/command/switch-collection/${collectionId}/`, {
    state: {
      nextUrl:
        nextUrl ?? toRelativeUrl(globalThis.location.href) ?? '/specify/',
    },
  });

export function SwitchCollectionCommand(): null {
  const { collectionId } = useParams();
  const location = useLocation();
  const nextUrl =
    (location.state as { readonly nextUrl: string | undefined } | undefined)
      ?.nextUrl ?? '/specify/';

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
