import React from 'react';

import type { CollectionObject } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import { Link } from './basic';
import { fetchOtherCollectionData } from './collectionrelonetomanyplugin';
import { useAsyncState } from './hooks';

export function CollectionOneToOnePlugin({
  resource,
  relationship,
}: {
  readonly resource: SpecifyResource<CollectionObject>;
  readonly relationship: string;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(
      async () => fetchOtherCollectionData(resource, relationship),
      [resource, relationship]
    ),
    true
  );
  return typeof data === 'object' && data.collectionObjects.length > 0 ? (
    <Link.Default href={data.collectionObjects[0].resource.viewUrl()}>
      {data.collectionObjects[0].formatted}
    </Link.Default>
  ) : null;
}
