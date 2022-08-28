import React from 'react';

import type { CollectionObject } from '../DataModel/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { Link } from '../Atoms/Link';
import { fetchOtherCollectionData } from './CollectionRelOneToMany';
import {useAsyncState} from '../../hooks/useAsyncState';

export function CollectionOneToOnePlugin({
  resource,
  relationship,
}: {
  readonly resource: SpecifyResource<CollectionObject>;
  readonly relationship: string;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        fetchOtherCollectionData(resource, relationship).catch((error) => {
          console.error(error);
          return undefined;
        }),
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
