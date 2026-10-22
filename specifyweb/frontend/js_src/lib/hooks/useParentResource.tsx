import React from 'react';
import { AnySchema } from '../components/DataModel/helperTypes';
import { SpecifyResource } from '../components/DataModel/legacyTypes';
import { parentTableRelationship } from '../components/Forms/parentTables';
import { useAsyncState } from './useAsyncState';
import { Relationship } from '../components/DataModel/specifyField';
import { fetchCollection } from '../components/DataModel/collection';
import { backendFilter } from '../components/DataModel/helpers';
import { resourceEvents } from '../components/DataModel/resource';

/**
 * React hook to get basic parent information about a particular resource.
 * Returns the relationship on the provided resource which "points" the parent,
 * and returns the parent resoure as: false if no parent relationship is found,
 * undefined if the parent resource is being fetching, and the resource
 * otherwise
 */
export function useParentResource(
  resource: SpecifyResource<AnySchema> | undefined
): {
  readonly parentRelationship: undefined | Relationship;
  readonly parentResource: false | undefined | SpecifyResource<AnySchema>;
  readonly onCheckChildExists: () => Promise<boolean>;
} {
  const directParentRelationship = React.useMemo(
    () =>
      resource === undefined
        ? undefined
        : parentTableRelationship()[resource.specifyTable.name],
    [resource?.specifyTable.name]
  );

  const parentRelationship = React.useMemo(() => {
    if (directParentRelationship !== undefined) return directParentRelationship;
    const dependentRelationships = resource?.specifyTable.relationships.filter(
      (relationship) =>
        relationship.isRequired &&
        relationship.otherSideName !== undefined &&
        relationship.relatedTable
          .getRelationship(relationship.otherSideName)
          ?.isDependent()
    );
    // If there's exactly one relationship that's required and the otherside is
    // dependent, we should be able to safely assume that relationship is the
    // parent.
    // If needed, we could broaden the filtering criteria to either required or
    // otherside is dependent, as they should mean the same thing but might
    // have some discrepancies (e.g., #8583)
    // FEAT: Handle returning all dependent relationships
    if (dependentRelationships?.length === 1) {
      return dependentRelationships.at(0);
    }
    return directParentRelationship;
  }, [resource, directParentRelationship]);

  const [parentResource, setParentResource] = useAsyncState<
    false | SpecifyResource<AnySchema>
  >(
    React.useCallback(
      () =>
        parentRelationship === undefined ||
        resource === undefined ||
        // REFACTOR: We can probably use resourceEvents here to check for
        // deletion instead?
        resource.deleted
          ? false
          : resource.fetch({ strict: false }).then(async (newResource) => {
              const returned = await newResource.rgetPromise(
                parentRelationship.name,
                true,
                false
              );
              return returned ?? false;
            }),
      [resource, resource?.deleted, parentRelationship]
    ),
    false
  );

  /**
   * If the parent was deleted, the child should be deleted as well.
   * We don't currently handle this case cleanly elsewhere in the frontend
   * (such as ResourceView), so for now we just mark the record as having no
   * parent if the parent is deleted.
   */
  React.useEffect(
    () =>
      resourceEvents.on('deleted', (deletedResource) => {
        if (typeof parentResource !== 'object') return;
        if (
          deletedResource.specifyTable.name ===
            parentResource.specifyTable.name &&
          deletedResource.id === parentResource.id
        ) {
          setParentResource(false);
        }
      }),
    [parentResource]
  );

  const handleCheckChildExists = React.useCallback(
    async () =>
      resource === undefined
        ? true
        : fetchCollection(resource.specifyTable.name, {
            ...backendFilter('id').equals(resource.id),
            limit: 1,
          }).then(({ totalCount }) => totalCount > 0),

    [resource]
  );

  return {
    parentRelationship,
    parentResource,
    onCheckChildExists: handleCheckChildExists,
  };
}
