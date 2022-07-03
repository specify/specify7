import { fetchCollection } from './collection';
import { fail } from './components/errorboundary';
import type { CollectionObject } from './datamodel';
import type { AnySchema } from './datamodelutils';
import { f } from './functools';
import { capitalize } from './helpers';
import type { SpecifyResource } from './legacytypes';
import { hasTablePermission } from './permissions';
import { getCollectionPref } from './remoteprefs';
import { getResourceApiUrl, idFromUrl } from './resource';
import { schema } from './schema';
import { globalEvents } from './specifyapi';
import { toTable } from './specifymodel';
import { getDomainResource } from './treedefinitions';
import type { RA } from './types';

/**
 * Some tasks to do after a new resoure is created
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

const takeBetween = <T>(array: RA<T>, first: T, last: T): RA<T> =>
  array.slice(array.indexOf(first) + 1, array.indexOf(last) + 1);

/**
 * @returns a list of collections the resource belongs too.
 * @returns undefined if resource is not scoped to a collection
 * @remarks
 * This function tries to resolve collection ID for resource even the best it
 * can even if user does not have read access to the Collection table.
 */
export const getCollectionForResource = (
  resource: SpecifyResource<AnySchema>
): number | undefined =>
  (resource.get('collectionMemberId') as number | null) ??
  f.maybe(resource.specifyModel.getScopingRelationship(), (domainField) =>
    f.var(idFromUrl(resource.get(domainField.name) ?? ''), (domainResourceId) =>
      schema.domainLevelIds[domainField.name as 'collection'] ===
      domainResourceId
        ? schema.domainLevelIds.collection
        : undefined
    )
  );
export const fetchCollectionsForResource = async (
  resource: SpecifyResource<AnySchema>
): Promise<RA<number> | undefined> =>
  f.maybe(resource.specifyModel.getScopingRelationship(), async (domainField) =>
    (resource as SpecifyResource<CollectionObject>)
      ?.rgetPromise(domainField.name as 'collection')
      .then(async (resource) =>
        fetchCollection(
          'Collection',
          { limit: 0 },
          {
            [takeBetween(
              schema.orgHierarchy,
              'Collection',
              resource.specifyModel.name
            )
              .map((level) => level.toLowerCase())
              .join('__')]: resource.id.toString(),
          }
        ).then(({ records }) => records.map(({ id }) => id))
      )
  ) ?? Promise.resolve(undefined);
