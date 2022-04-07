import { fetchCollection } from './collection';
import type { Collection, CollectionObject } from './datamodel';
import type { AnySchema, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import { remotePrefs } from './remoteprefs';
import { fetchResource } from './resource';
import { schema } from './schema';
import { globalEvents } from './specifyapi';
import { toTable } from './specifymodel';
import { getDomainResource } from './treedefinitions';
import type { RA } from './types';
import { defined } from './types';
import { crash } from './components/errorboundary';
import { f } from './functools';
import { hasTablePermission } from './permissions';

globalEvents.on('newresource', (resource: SpecifyResource<AnySchema>) => {
  const domainField = resource.specifyModel.getScopingRelationship();
  const parentResource = domainField
    ? getDomainResource(domainField.name as keyof typeof schema.domainLevelIds)
    : undefined;
  if (typeof parentResource === 'undefined') return;
  if (
    typeof domainField === 'object' &&
    !Boolean(resource.get(domainField.name))
  )
    resource.set(domainField.name, parentResource.url() as never);

  const collectionObject = toTable(resource, 'CollectionObject');
  if (typeof collectionObject === 'undefined') return;

  // Need to make sure parentResource isn't null to fix issue introduced by 8abf5d5
  const colId = parentResource.get('id');
  if (
    remotePrefs[`CO_CREATE_COA_${colId}`] === 'true' &&
    hasTablePermission('CollectionObjectAttribute', 'create')
  ) {
    const attribute = new schema.models.CollectionObjectAttribute.Resource();
    attribute.placeInSameHierarchy(collectionObject);
    collectionObject.set('collectionObjectAttribute', attribute);
  }

  if (
    remotePrefs[`CO_CREATE_PREP_${colId}`] === 'true' &&
    hasTablePermission('Preparation', 'create')
  )
    collectionObject
      .rgetCollection('preparations')
      .then((preparations) =>
        preparations.add(new schema.models.Preparation.Resource())
      )
      .catch(crash);
  if (
    remotePrefs[`CO_CREATE_DET_${colId}`] === 'true' &&
    hasTablePermission('Determination', 'create')
  )
    collectionObject
      .rgetCollection('determinations')
      .then((determinations) =>
        determinations.add(new schema.models.Determination.Resource())
      )
      .catch(crash);
});

const takeBetween = <T>(array: RA<T>, first: T, last: T): RA<T> =>
  array.slice(array.indexOf(first) + 1, array.indexOf(last) + 1);

const collectionsInDomain = async (
  domainResource: SpecifyResource<AnySchema>
): Promise<RA<SerializedResource<Collection>>> =>
  f.maybe(toTable(domainResource, 'CollectionObject'), (collectionObject) =>
    collectionObject
      .rgetPromise('collection', true)
      .then((collection) => [serializeResource(collection)])
  ) ??
  f.maybe(toTable(domainResource, 'Collection'), (collection) =>
    collection.fetch().then((collection) => [serializeResource(collection)])
  ) ??
  fetchCollection(
    'Collection',
    { limit: 0 },
    {
      [takeBetween(
        schema.orgHierarchy,
        'Collection',
        domainResource.specifyModel.name
      )
        .map((level) => level.toLowerCase())
        .join('__')]: domainResource.id.toString(),
    }
  ).then(({ records }) => records);

export const collectionsForResource = async (
  resource: SpecifyResource<AnySchema>
): Promise<RA<SerializedResource<Collection>> | undefined> =>
  f.maybe(
    (resource.get('collectionMemberId') as number | null) ?? undefined,
    async (collectionMemberId) =>
      fetchResource('Collection', collectionMemberId).then((resource) => [
        defined(resource),
      ])
  ) ??
  f.maybe(resource.specifyModel.getScopingRelationship(), (domainField) =>
    (resource as SpecifyResource<CollectionObject>)
      ?.rgetPromise(domainField.name as 'collection')
      .then(collectionsInDomain)
  ) ??
  f.maybe(toTable(resource, 'Collection'), (collection) => [
    serializeResource(collection),
  ]) ??
  Promise.resolve(undefined);
