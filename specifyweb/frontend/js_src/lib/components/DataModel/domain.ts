import { globalEvents } from '../../utils/ajax/specifyApi';
import type { RA } from '../../utils/types';
import { capitalize, takeBetween } from '../../utils/utils';
import { fail } from '../Errors/Crash';
import { getCollectionPref } from '../InitialContext/remotePrefs';
import { getDomainResource } from '../InitialContext/treeRanks';
import { hasTablePermission } from '../Permissions/helpers';
import { fetchCollection } from './collection';
import { toTable } from './helpers';
import type { AnySchema } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { getResourceApiUrl, idFromUrl } from './resource';
import { schema } from './schema';
import type { CollectionObject } from './types';

/**
 * Some tasks to do after a new resource is created
 */
globalEvents.on('newResource', (resource) => {
  const domainField = resource.specifyModel.getScopingRelationship();
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
  if (!hasTablePermission(capitalize(domainFieldName), 'read')) return;
  if (parentResource === undefined) return;

  const collectionObject = toTable(resource, 'CollectionObject');
  if (collectionObject === undefined) return;

  const colId = parentResource.get('id');
  if (
    getCollectionPref('CO_CREATE_COA', colId) &&
    hasTablePermission('CollectionObjectAttribute', 'create')
  ) {
    const attribute = new schema.models.CollectionObjectAttribute.Resource();
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
        preparations.add(new schema.models.Preparation.Resource())
      )
      .catch(fail);

  if (
    getCollectionPref('CO_CREATE_DET', colId) &&
    hasTablePermission('Determination', 'create')
  )
    collectionObject
      .rgetCollection('determinations')
      .then((determinations) =>
        determinations.add(new schema.models.Determination.Resource())
      )
      .catch(fail);
});

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

  const domainField = resource.specifyModel.getScopingRelationship();
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
  const domainField = resource.specifyModel.getScopingRelationship();
  if (domainField === undefined) return undefined;
  const domainResource = await (
    resource as SpecifyResource<CollectionObject>
  )?.rgetPromise(domainField.name as 'collection');
  if (domainResource === undefined || domainResource === null) return undefined;
  if (domainResource.specifyModel.name === 'Collection')
    return [domainResource.id];
  const fieldsBetween = takeBetween(
    schema.orgHierarchy,
    'Collection',
    domainResource.specifyModel.name
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
