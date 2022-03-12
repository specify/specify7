import { fetchCollection } from './collection';
import type {
  Collection,
  CollectionObject,
  Determination,
  Preparation,
} from './datamodel';
import type { AnySchema, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import { remotePrefs } from './remoteprefs';
import { fetchResource } from './resource';
import { schema } from './schema';
import { globalEvents } from './specifyapi';
import { isResourceOfType } from './specifymodel';
import { getDomainResource } from './treedefinitions';
import type { RA } from './types';
import { defined } from './types';

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
    resource.set(domainField.name, parentResource.url());

  // Need to make sure parentResource isn't null to fix issue introduced by 8abf5d5
  if (!isResourceOfType(resource, 'CollectionObject')) return;

  const colId = parentResource.get('id');
  if (remotePrefs[`CO_CREATE_COA_${colId}`] === 'true') {
    const attributeModel = defined(
      resource.specifyModel.getRelationship('collectionObjectAttribute')
    ).relatedModel;
    const attribute = new attributeModel.Resource();
    attribute.placeInSameHierarchy(resource);
    resource.set('collectionObjectAttribute', attribute);
  }

  if (remotePrefs[`CO_CREATE_PREP_${colId}`] === 'true') {
    const prepModel = defined(
      resource.specifyModel.getRelationship('preparations')
    ).relatedModel;
    const preparation =
      new prepModel.Resource() as SpecifyResource<Preparation>;
    resource
      .rgetCollection('preparations')
      .then((preparations) => preparations.add(preparation));
  }
  if (remotePrefs[`CO_CREATE_DET_${colId}`] === 'true') {
    const determinationModel = defined(
      resource.specifyModel.getRelationship('determinations')
    ).relatedModel;
    const determination =
      new determinationModel.Resource() as SpecifyResource<Determination>;
    resource
      .rgetCollection('determinations')
      .then((determinations) => determinations.add(determination));
  }
});

const takeBetween = <T>(array: RA<T>, first: T, last: T): RA<T> =>
  array.slice(array.indexOf(first) + 1, array.indexOf(last) + 1);

const collectionsInDomain = async (
  domainResource: SpecifyResource<AnySchema>
): Promise<RA<SerializedResource<Collection>>> => {
  if (isResourceOfType(domainResource, 'CollectionObject'))
    return domainResource
      .rgetPromise('collection', true)
      .then((collection) => [serializeResource(collection)]);
  else if (isResourceOfType(domainResource, 'Collection'))
    return domainResource
      .fetchPromise()
      .then(() => [serializeResource(domainResource)]);
  else
    return fetchCollection(
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
};

export async function collectionsForResource(
  resource: SpecifyResource<AnySchema>
): Promise<RA<SerializedResource<Collection>>> {
  const collectionMemberId = resource.get('collectionMemberId') as
    | number
    | null;
  if (typeof collectionMemberId === 'number')
    return fetchResource('Collection', collectionMemberId).then((resource) => [
      defined(resource),
    ]);
  const domainField = resource.specifyModel.getScopingRelationship();
  return typeof domainField === 'object'
    ? (resource as SpecifyResource<CollectionObject>)
        .rgetPromise(domainField.name as 'collection')
        .then(collectionsInDomain)
    : Promise.resolve([]);
}
