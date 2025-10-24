import React from 'react';

import type { CollectionFetchFilters } from '../components/DataModel/collection';
import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import type { Relationship } from '../components/DataModel/specifyField';
import type { Collection } from '../components/DataModel/specifyTable';
import type { SubViewSortField } from '../components/FormParse/cells';
import type { GetOrSet } from '../utils/types';
import { overwriteReadOnly } from '../utils/types';
import { sortFunction } from '../utils/utils';
import { useAsyncState } from './useAsyncState';

type UseCollectionProps<SCHEMA extends AnySchema> = {
  readonly parentResource: SpecifyResource<SCHEMA>;
  readonly relationship: Relationship;
  readonly sortBy?: SubViewSortField;
  readonly filters?: CollectionFetchFilters<SCHEMA>;
};

export function useCollection<SCHEMA extends AnySchema>({
  parentResource,
  relationship,
  sortBy,
}: Omit<UseCollectionProps<SCHEMA>, 'filters'>): readonly [
  ...GetOrSet<Collection<SCHEMA> | false | undefined>,
  (
    filters?: CollectionFetchFilters<SCHEMA>
  ) => Promise<Collection<SCHEMA> | undefined>,
] {
  const [collection, setCollection] = useAsyncState<
    Collection<SCHEMA> | false | undefined
  >(
    React.useCallback(
      async () =>
        relationship.type.includes('-to-many')
          ? fetchToManyCollection({
              parentResource,
              relationship,
              sortBy,
            })
          : fetchToOneCollection({
              parentResource,
              relationship,
            }),
      [relationship, parentResource, sortBy]
    ),
    false
  );

  const versionRef = React.useRef<number>(0);

  const handleFetch = React.useCallback(
    async (
      filters?: CollectionFetchFilters<SCHEMA>
    ): Promise<Collection<SCHEMA> | undefined> => {
      if (typeof collection !== 'object') return undefined;

      versionRef.current += 1;
      const localVersionRef = versionRef.current;

      const fetchCollection = relationship.type.includes('-to-many')
        ? fetchToManyCollection({
            parentResource,
            relationship,
            sortBy,
            filters,
          })
        : fetchToOneCollection({ parentResource, relationship, filters });

      return fetchCollection.then((collection) => {
        if (
          typeof collection === 'object' &&
          versionRef.current === localVersionRef
        ) {
          setCollection(collection);
        }
        return collection === false ? undefined : collection;
      });
    },
    [collection, parentResource, relationship, setCollection, sortBy]
  );
  return [collection, setCollection, handleFetch];
}

const fetchToManyCollection = async <SCHEMA extends AnySchema>({
  parentResource,
  relationship,
  sortBy,
  filters,
}: UseCollectionProps<SCHEMA>): Promise<Collection<SCHEMA> | undefined> =>
  parentResource
    .rgetCollection(relationship.name, filters)
    .then((collection) => {
      // TEST: check if this can ever happen
      if (collection === null || collection === undefined)
        return new relationship.relatedTable.DependentCollection({
          related: parentResource,
          field: relationship.getReverse(),
        }) as Collection<AnySchema>;
      if (sortBy === undefined) return collection;

      // BUG: this does not look into related tables
      const field = sortBy.fieldNames[0];

      // Overwriting the models on the collection
      overwriteReadOnly(
        collection,
        'models',
        Array.from(collection.models).sort(
          sortFunction(
            (resource) => resource.get(field),
            sortBy.direction === 'desc'
          )
        )
      );
      return collection;
    });

async function fetchToOneCollection<SCHEMA extends AnySchema>({
  parentResource,
  relationship,
  filters,
}: UseCollectionProps<SCHEMA>): Promise<
  Collection<SCHEMA> | false | undefined
> {
  /**
   * If relationship is -to-one, create a collection for the related
   * resource. This allows to reuse most of the code from -to-many
   * relationships in components like Subview and RecordSelectorFromCollection
   */
  /**
   * REFACTOR: Allow passing filters to rgetPromise
   * or at least handle refetching of independent when rgetPromise is called
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
  return typeof filters === 'object'
    ? collection.fetch(filters as CollectionFetchFilters<AnySchema>)
    : collection;
}
