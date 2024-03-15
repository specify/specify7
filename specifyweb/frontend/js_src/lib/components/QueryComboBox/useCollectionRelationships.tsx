import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { hasTablePermission } from '../Permissions/helpers';

export type CollectionRelationships = {
  readonly left: RA<{
    readonly id: number;
    readonly collection: number | undefined;
  }>;
  readonly right: RA<{
    readonly id: number;
    readonly collection: number | undefined;
  }>;
};

export function useCollectionRelationships(
  resource: SpecifyResource<AnySchema> | undefined
): CollectionRelationships | false | undefined {
  const [collectionRelationships] = useAsyncState<
    CollectionRelationships | false
  >(
    React.useCallback(async () => {
      if (
        hasTablePermission('CollectionRelType', 'read') ||
        resource?.specifyTable.name !== 'CollectionRelationship'
      )
        return false;
      return f.all({
        left: fetchCollection(
          'CollectionRelType',
          { limit: DEFAULT_FETCH_LIMIT, domainFilter: false },
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            leftsidecollection_id: schema.domainLevelIds.collection,
          }
        ).then(({ records }) =>
          records.map((relationship) => ({
            id: relationship.id,
            collection: idFromUrl(relationship.rightSideCollection ?? ''),
          }))
        ),
        right: fetchCollection(
          'CollectionRelType',
          { limit: DEFAULT_FETCH_LIMIT, domainFilter: false },
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rightsidecollection_id: schema.domainLevelIds.collection,
          }
        ).then(({ records }) =>
          records.map((relationship) => ({
            id: relationship.id,
            collection: idFromUrl(relationship.leftSideCollection ?? ''),
          }))
        ),
      });
    }, [resource]),
    false
  );
  return collectionRelationships;
}
