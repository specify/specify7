import React from 'react';
import type { SafeNavigateFunction } from 'react-router';
import { useParams } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { toLocalUrl } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { formatUrl } from '../Router/queryString';

export const switchCollection = (
  navigate: SafeNavigateFunction,
  collectionId: number,
  nextUrl?: string
): void =>
  navigate(
    formatUrl(`/specify/command/switch-collection/${collectionId}/`, {
      nextUrl: nextUrl ?? toLocalUrl(globalThis.location.href),
    })
  );

export function SwitchCollectionCommand(): null {
  const { collectionId } = useParams();
  const [nextUrl = '/specify/'] = useSearchParameter('nextUrl');

  useAsyncState(
    React.useCallback(
      async () =>
        ping('/context/collection/', {
          method: 'POST',
          body: collectionId!.toString(),
        }).then(() => globalThis.location.replace(nextUrl)),
      [collectionId, nextUrl]
    ),
    true
  );

  return null;
}
