import React from 'react';

import type { CollectionFetchFilters } from '../components/DataModel/collection';
import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import type { Relationship } from '../components/DataModel/specifyField';
import type { Collection } from '../components/DataModel/specifyTable';
import { raise } from '../components/Errors/Crash';
import { relationshipIsToMany } from '../components/WbPlanView/mappingHelpers';
import type { GetOrSet } from '../utils/types';
import { overwriteReadOnly } from '../utils/types';
import type { sortFunction } from '../utils/utils';
import { useAsyncState } from './useAsyncState';

type UseCollectionProps<SCHEMA extends AnySchema> = {
  readonly parentResource: SpecifyResource<SCHEMA>;
  readonly relationship: Relationship;
  readonly collectionSortFunction?: ReturnType<
    typeof sortFunction<
      SpecifyResource<SCHEMA>,
      ReturnType<SpecifyResource<SCHEMA>['get']>
    >
  >;
};

export function useCollection<SCHEMA extends AnySchema>({
  parentResource,
  relationship,
  collectionSortFunction,
}: UseCollectionProps<SCHEMA>): readonly [
  ...GetOrSet<Collection<SCHEMA> | false | undefined>,
  (filters?: CollectionFetchFilters<SCHEMA>) => void
] {
  const [collection, setCollection] = useAsyncState<
    Collection<SCHEMA> | false | undefined
  >(
    React.useCallback(
      async () =>
        relationshipIsToMany(relationship) &&
        relationship.type !== 'zero-to-one'
          ? fetchToManyCollection({
              parentResource,
              relationship,
              collectionSortFunction,
            })
          : fetchToOneCollection({
              parentResource,
              relationship,
              collectionSortFunction,
            }),
      [collectionSortFunction, parentResource, relationship]
    ),
    false
  );

  const versionRef = React.useRef<number>(0);

  const handleFetch = React.useCallback(
    (filters?: CollectionFetchFilters<SCHEMA>): void => {
      if (typeof collection !== 'object') return undefined;

      versionRef.current += 1;
      const localVersionRef = versionRef.current;

      collection
        .fetch(filters as CollectionFetchFilters<AnySchema>)
        .then((collection) => {
          if (collection === undefined) return undefined;
          /*
           * If the collection is already being fetched, don't update it
           * to prevent a race condition.
           * REFACTOR: simplify this
           */
          return versionRef.current === localVersionRef
            ? void setCollection(collection)
            : undefined;
        })
        .catch(raise);
    },
    [collection, setCollection]
  );
  return [collection, setCollection, handleFetch];
}

const fetchToManyCollection = async <SCHEMA extends AnySchema>({
  parentResource,
  relationship,
  collectionSortFunction,
}: UseCollectionProps<SCHEMA>): Promise<Collection<SCHEMA> | undefined> =>
  parentResource.rgetCollection(relationship.name).then((collection) => {
    // TEST: check if this can ever happen
    if (collection === null || collection === undefined)
      return new relationship.relatedTable.DependentCollection({
        related: parentResource,
        field: relationship.getReverse(),
      }) as Collection<AnySchema>;
    if (collectionSortFunction === undefined) return collection;

    // Overwriting the models on the collection
    overwriteReadOnly(
      collection,
      'models',
      Array.from(collection.models).sort(collectionSortFunction)
    );
    return collection;
  });

async function fetchToOneCollection<SCHEMA extends AnySchema>({
  parentResource,
  relationship,
  collectionSortFunction,
}: UseCollectionProps<SCHEMA>): Promise<
  Collection<SCHEMA> | false | undefined
> {
  /**
   * If relationship is -to-one, create a collection for the related
   * resource. This allows to reuse most of the code from the -to-many
   * relationships. RecordSelector handles collections with -to-one
   * related field by removing the "+" button after first record is added
   * and not rendering record count or record slider.
   */
  const resource = await parentResource.rgetPromise(relationship.name);
  const reverse = relationship.getReverse();
  if (reverse === undefined) return false;
  const collection = (
    relationship.isDependent()
      ? new relationship.relatedTable.DependentCollection({
          related: parentResource,
          field: reverse,
        })
      : new relationship.relatedTable.IndependentCollection({
          related: parentResource,
          field: reverse,
        })
  ) as Collection<AnySchema>;
  if (relationship.isDependent() && parentResource.isNew())
    // Prevent fetching related for newly created parent
    overwriteReadOnly(collection, '_totalCount', 0);

  if (typeof resource === 'object' && resource !== null)
    collection.add(resource);
  overwriteReadOnly(
    collection,
    'related',
    collection.related ?? parentResource
  );
  overwriteReadOnly(
    collection,
    'field',
    collection.field ?? relationship.getReverse()
  );
  if (collectionSortFunction !== undefined)
    overwriteReadOnly(
      collection,
      'models',
      Array.from(collection.models).sort(collectionSortFunction)
    );
  return collection;
}
