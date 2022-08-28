import React from 'react';
import type { NavigateFunction } from 'react-router/lib/hooks';
import { useLocation, useParams } from 'react-router-dom';

import { ping } from '../../utils/ajax/ping';
import { toRelativeUrl } from '../../utils/ajax/helpers';
import {useAsyncState} from '../../hooks/useAsyncState';

export const switchCollection = (
  navigate: NavigateFunction,
  collectionId: number,
  nextUrl?: string
): void =>
  navigate(`/specify/command/switch-collection/${collectionId}/`, {
    state: {
      nextUrl,
    },
  });

export function SwitchCollectionCommand(): null {
  const { collectionId } = useParams();
  const location = useLocation();
  const nextUrl =
    (location.state as { readonly nextUrl: string | undefined } | undefined)
      ?.nextUrl ?? toRelativeUrl(globalThis.location.href);

  useAsyncState(
    React.useCallback(
      async () =>
        ping('/context/collection/', {
          method: 'POST',
          body: collectionId!.toString(),
        }).then(() =>
          typeof nextUrl === 'string'
            ? globalThis.location.assign(nextUrl)
            : globalThis.location.reload()
        ),
      [collectionId, nextUrl]
    ),
    true
  );

  return null;
}
