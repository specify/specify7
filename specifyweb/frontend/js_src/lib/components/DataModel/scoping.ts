import type { RA } from '../../utils/types';
import { takeBetween } from '../../utils/utils';
import { getCollectionPref } from '../InitialContext/remotePrefs';
import { getTablePermissions } from '../Permissions';
import { hasTablePermission } from '../Permissions/helpers';
import { fetchCollection } from './collection';
import { djangoLookupSeparator, toTable } from './helpers';
import type { AnySchema } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { getResourceApiUrl, idFromUrl } from './resource';
import { schema } from './schema';
import { serializeResource } from './serializers';
import type { Relationship } from './specifyField';
import type { SpecifyTable } from './specifyTable';
import { strictGetTable, tables } from './tables';
import type { CollectionObject, Tables } from './types';

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

  const scoping = getScopingResource(resource.specifyTable);
  if (scoping === undefined) return;
  if (!Boolean(resource.get(scoping.relationship.name)))
    resource.set(scoping.relationship.name, scoping.resourceUrl as never);

  if (!hasTablePermission(scoping.relationship.relatedTable.name, 'read'))
    return;

  const collectionObject = toTable(resource, 'CollectionObject');
  if (collectionObject === undefined) return;

  if (
    getCollectionPref('CO_CREATE_COA', schema.domainLevelIds.collection) &&
    hasTablePermission('CollectionObjectAttribute', 'create')
  ) {
    const attribute = new tables.CollectionObjectAttribute.Resource();
    attribute.placeInSameHierarchy(collectionObject);
    collectionObject.set('collectionObjectAttribute', attribute);
  }

  if (
    getCollectionPref('CO_CREATE_PREP', schema.domainLevelIds.collection) &&
    hasTablePermission('Preparation', 'create') &&
    resource.createdBy !== 'clone'
  ) {
    const preps = collectionObject.getDependentResource('preparations') ?? [];
    if (preps.length === 0)
      collectionObject.set('preparations', [
        serializeResource(new tables.Preparation.Resource()),
      ]);
  }

  if (
    getCollectionPref('CO_CREATE_DET', schema.domainLevelIds.collection) &&
    hasTablePermission('Determination', 'create') &&
    resource.createdBy !== 'clone'
  ) {
    const determinations =
      collectionObject.getDependentResource('determinations') ?? [];
    if (determinations.length === 0)
      collectionObject.set('determinations', [
        serializeResource(new tables.Determination.Resource()),
      ]);
  }
}

export function getDomainResource<
  LEVEL extends keyof typeof schema.domainLevelIds,
>(level: LEVEL): SpecifyResource<Tables[Capitalize<LEVEL>]> | undefined {
  const id = schema.domainLevelIds?.[level];
  if (id === undefined) {
    if ((level as 'collectionObject') === 'collectionObject') return undefined;
    console.error(
      `Trying to access domain resource ${level} before domain is loaded`
    );
    return undefined;
  }
  const table = strictGetTable(level);
  return new table.Resource({ id });
}

export function getScopingResource(
  table: SpecifyTable
):
  | { readonly relationship: Relationship; readonly resourceUrl: string }
  | undefined {
  const domainField = table.getScopingRelationship();
  if (domainField === undefined) return;

  const domainFieldName =
    domainField.name as keyof typeof schema.domainLevelIds;

  const parentResource = getDomainResource(domainFieldName);

  return typeof parentResource === 'object'
    ? {
        relationship: domainField,
        resourceUrl: getResourceApiUrl(
          domainField.relatedTable.name,
          schema.domainLevelIds[domainFieldName]
        ),
      }
    : undefined;
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
 * If resource has a scoping relationship, find all collections that resource
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
    .join(djangoLookupSeparator);
  return fieldsBetween.length === 0
    ? undefined
    : fetchCollection(
        'Collection',
        { limit: 0, domainFilter: false },
        {
          [fieldsBetween]: domainResource.id.toString(),
        }
      ).then(({ records }) => records.map(({ id }) => id));
}
