import React from 'react';
import { AnySchema } from '../components/DataModel/helperTypes';
import { SpecifyResource } from '../components/DataModel/legacyTypes';
import { parentTableRelationship } from '../components/Forms/parentTables';
import { useAsyncState } from './useAsyncState';
import { Relationship } from '../components/DataModel/specifyField';
import { fetchCollection } from '../components/DataModel/collection';
import { backendFilter } from '../components/DataModel/helpers';

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
  readonly onCheckChildExists?: () => Promise<boolean>;
} {
  const parentRelationship = React.useMemo(
    () =>
      resource === undefined
        ? undefined
        : parentTableRelationship()[resource.specifyTable.name],
    [resource?.specifyTable.name]
  );
  const [parentResource] = useAsyncState<false | SpecifyResource<AnySchema>>(
    React.useCallback(
      () =>
        parentRelationship === undefined || resource === undefined
          ? false
          : resource.rgetPromise(parentRelationship.name),
      [resource, parentRelationship]
    ),
    false
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
