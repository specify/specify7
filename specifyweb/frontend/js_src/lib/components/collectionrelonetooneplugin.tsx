import React from 'react';

import type { CollectionObject } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import { Link } from './basic';
import { fetchOtherCollectionData } from './collectionrelonetomanyplugin';
import { useAsyncState } from './hooks';

export function CollectionOneToOnePlugin({
  resource,
  relationship,
  formatting,
}: {
  readonly resource: SpecifyResource<CollectionObject>;
  readonly relationship: string;
  readonly formatting: string | undefined;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        fetchOtherCollectionData(resource, relationship, formatting).catch(
          (error) => {
            console.error(error);
            return undefined;
          }
        ),
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
