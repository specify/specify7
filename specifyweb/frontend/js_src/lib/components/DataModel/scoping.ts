import type { RA } from '../../utils/types';
import { capitalize, takeBetween } from '../../utils/utils';
import { raise } from '../Errors/Crash';
import { getCollectionPref } from '../InitialContext/remotePrefs';
import { getDomainResource } from '../InitialContext/treeRanks';
import { getTablePermissions } from '../Permissions';
import { hasTablePermission } from '../Permissions/helpers';
import { fetchCollection } from './collection';
import { toTable } from './helpers';
import type { AnySchema } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { getResourceApiUrl, idFromUrl } from './resource';
import { schema } from './schema';
import { tables } from './tables';
import type { CollectionObject } from './types';

/**
 * Some tasks to do after a new resource is created
 */
export function initializeResource(resource: SpecifyResource<AnySchema>): void {
  // Resources created before initial context is loaded are not scoped
  if (
    Object.keys(getTablePermissions()).length === 0 ||
    schema.domainLevelIds === undefined
  )
    return;

  const domainField = resource.specifyTable.getScopingRelationship();
  if (domainField === undefined) return;

  const domainFieldName =
    domainField.name as keyof typeof schema.domainLevelIds;

  const parentResource = getDomainResource(domainFieldName);

  if (
    typeof parentResource === 'object' &&
    !Boolean(resource.get(domainField.name))
  )
    resource.set(
      domainField.name,
      getResourceApiUrl(
        capitalize(domainFieldName),
        schema.domainLevelIds[domainFieldName]
      ) as never
    );

  // Need to make sure parentResource isn't null to fix issue introduced by 8abf5d5
  if (parentResource === undefined) return;
  if (!hasTablePermission(capitalize(domainFieldName), 'read')) return;

  const collectionObject = toTable(resource, 'CollectionObject');
  if (collectionObject === undefined) return;

  const colId = parentResource.get('id');
  if (
    getCollectionPref('CO_CREATE_COA', colId) &&
    hasTablePermission('CollectionObjectAttribute', 'create')
  ) {
    const attribute = new tables.CollectionObjectAttribute.Resource();
    attribute.placeInSameHierarchy(collectionObject);
    collectionObject.set('collectionObjectAttribute', attribute);
  }

  if (
    getCollectionPref('CO_CREATE_PREP', colId) &&
    hasTablePermission('Preparation', 'create')
  )
    collectionObject
      .rgetCollection('preparations')
      .then((preparations) =>
        preparations.add(new tables.Preparation.Resource())
      )
      .catch(raise);

  if (
    getCollectionPref('CO_CREATE_DET', colId) &&
    hasTablePermission('Determination', 'create')
  )
    collectionObject
      .rgetCollection('determinations')
      .then((determinations) =>
        determinations.add(new tables.Determination.Resource())
      )
      .catch(raise);
}

/**
 * @returns a list of collections the resource belongs too.
 * @returns undefined if resource is not scoped to a collection
 * @remarks
 * This function tries to resolve collection ID for resource even the best it
 * can even if user does not have read access to the Collection table.
 */
export function getCollectionForResource(
  resource: SpecifyResource<AnySchema>
): number | undefined {
  const collectionUrl = resource.get('collectionMemberId') as number | null;
  if (typeof collectionUrl === 'number') return collectionUrl;

  const domainField = resource.specifyTable.getScopingRelationship();
  if (domainField === undefined) return undefined;

  const domainResourceId = idFromUrl(resource.get(domainField.name) ?? '');
  return schema.domainLevelIds[domainField.name as 'collection'] ===
    domainResourceId
    ? schema.domainLevelIds.collection
    : undefined;
}

/**
 * If resource has a getScopingRelationship, find all collections that resource
 * belongs too
 */
export async function fetchCollectionsForResource(
  resource: SpecifyResource<AnySchema>
): Promise<RA<number> | undefined> {
  const domainField = resource.specifyTable.getScopingRelationship();
  if (domainField === undefined) return undefined;
  const domainResource = await (
    resource as SpecifyResource<CollectionObject>
  )?.rgetPromise(domainField.name as 'collection');
  if (domainResource === undefined || domainResource === null) return undefined;
  if (domainResource.specifyTable.name === 'Collection')
    return [domainResource.id];
  const fieldsBetween = takeBetween(
    schema.orgHierarchy,
    'Collection',
    domainResource.specifyTable.name
  )
    .map((level) => level.toLowerCase())
    .join('__');
  return fieldsBetween.length === 0
    ? undefined
    : fetchCollection(
        'Collection',
        { limit: 0 },
        {
          [fieldsBetween]: domainResource.id.toString(),
        }
      ).then(({ records }) => records.map(({ id }) => id));
}
