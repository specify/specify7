import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { replaceItem } from '../../../utils/utils';
import type { SerializedModel } from '../helperTypes';
import { getResourceApiUrl } from '../resource';
import { schema } from '../schema';
import type { Determination } from '../types';

requireContext();

test('resource is created for correct model', () =>
  expect(new schema.models.CollectionObject.Resource().specifyModel).toBe(
    schema.models.CollectionObject
  ));

const collectionObjectId = 100;
const collectionObjectUrl = getResourceApiUrl(
  'CollectionObject',
  collectionObjectId
);
const accessionId = 11;
const accessionUrl = getResourceApiUrl('Accession', accessionId);
const collectingEventUrl = getResourceApiUrl('CollectingEvent', 8868);
const determinationUrl = getResourceApiUrl('Determination', 123);

const determinationsResponse: RA<Partial<SerializedModel<Determination>>> = [
  {
    resource_uri: determinationUrl,
    id: 123,
    number1: null,
  },
];

const collectionObjectResponse = {
  id: 100,
  resource_uri: collectionObjectUrl,
  accession: accessionUrl,
  catalognumber: '000029432',
  collectingevent: collectingEventUrl,
  collection: getResourceApiUrl('Collection', 4),
  determinations: determinationsResponse,
};

overrideAjax(collectionObjectUrl, collectionObjectResponse);

const accessionNumber = '2011-IC-116';
const accessionResponse = {
  resource_uri: accessionUrl,
  id: 11,
  accessionnumber: accessionNumber,
  accessionagents: [],
};
overrideAjax(accessionUrl, accessionResponse);

const collectingEventResponse = {
  resource_uri: collectingEventUrl,
  id: 8868,
};
overrideAjax(collectingEventUrl, collectingEventResponse);

test('fetch', async () => {
  const resource = new schema.models.CollectionObject.Resource({
    id: collectionObjectId,
  });
  expect(resource.populated).toBe(false);
  await resource.fetch();
  expect(resource.populated).toBe(true);
  expect(resource.needsSaved).toBe(false);
  expect(resource.get('resource_uri')).toBe(collectionObjectUrl);
  expect(resource.get('accession')).toBe(accessionUrl);
});

describe('rgetPromise', () => {
  test('many-to-one', async () => {
    const resource = new schema.models.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const accession = await resource.rgetPromise('accession');
    expect(accession?.toJSON()).toEqual(accessionResponse);
  });

  test('transient field', async () => {
    const resource = new schema.models.CollectionObject.Resource({
      id: collectionObjectId,
    });
    await expect(
      resource.rgetPromise('accession.accessionNumber' as 'accession')
    ).resolves.toBe(accessionNumber);
  });

  const localityId = 104;
  const localityUrl = getResourceApiUrl('Locality', localityId);
  const localityDetailsResponse = {
    resource_uri: getResourceApiUrl('LocalityDetail', 100),
    id: 100,
  };
  overrideAjax(localityUrl, {
    resource_uri: localityUrl,
    id: localityId,
    localitydetails: [localityDetailsResponse],
  });

  test('dependent zero-to-one', async () => {
    const resource = new schema.models.Locality.Resource({ id: localityId });
    const localityDetails = await resource.rgetPromise('localityDetails');
    expect(localityDetails?.toJSON()).toEqual({
      ...localityDetailsResponse,
      locality: localityUrl,
    });
  });
});

const addressOfRecordId = 42;
const addressOfRecordUrl = getResourceApiUrl(
  'AddressOfRecord',
  addressOfRecordId
);

overrideAjax(addressOfRecordUrl, {
  resource_uri: addressOfRecordUrl,
  id: 42,
});

const secondAccessionUrl = getResourceApiUrl('Accession', 12);
const accessionsResponse = [
  {
    resource_uri: accessionUrl,
    id: 11,
    accessionnumber: accessionNumber,
  },
  {
    resource_uri: secondAccessionUrl,
    id: 12,
  },
];

overrideAjax(
  '/api/specify/accession/?domainfilter=false&addressofrecord=42&offset=0',
  {
    meta: { total_count: 2 },
    objects: accessionsResponse,
  }
);

describe('rgetCollection', () => {
  test('independent one-to-many', async () => {
    const resource = new schema.models.AddressOfRecord.Resource({
      id: addressOfRecordId,
    });
    const accessions = await resource.rgetCollection('accessions');
    expect(accessions.model.specifyModel).toBe(schema.models.Accession);
    expect(accessions.models).toHaveLength(2);
    expect(accessions.models[1].populated).toBe(true);
    expect(accessions.toJSON()).toEqual(accessionsResponse);
  });

  test('dependent one-to-many', async () => {
    const resource = new schema.models.Accession.Resource({ id: accessionId });
    const agents = await resource.rgetCollection('accessionAgents');
    expect(agents.models).toHaveLength(0);
  });

  test('repeated calls for independent return different object', async () => {
    const resource = new schema.models.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const firstCollectingEvent = await resource.rgetPromise('collectingEvent');
    const secondCollectingEvent = await resource.rgetPromise('collectingEvent');
    expect(firstCollectingEvent?.toJSON()).toEqual(collectingEventResponse);
    expect(firstCollectingEvent).not.toBe(secondCollectingEvent);
  });

  test('repeated calls for dependent return same object', async () => {
    const resource = new schema.models.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const firstDeterminations = await resource.rgetCollection('determinations');
    const secondDeterminations = await resource.rgetCollection(
      'determinations'
    );
    expect(firstDeterminations.toJSON()).toEqual(determinationsResponse);
    expect(secondDeterminations.toJSON()).toEqual(determinationsResponse);
    expect(firstDeterminations).toBe(secondDeterminations);
  });

  // TEST: add dependent and independent tests for all relationship types (and zero-to-one)
});

describe('needsSaved', () => {
  test('changing field makes needsSaved true', () => {
    const resource = new schema.models.CollectionObject.Resource({
      id: collectionObjectId,
    });
    expect(resource.needsSaved).toBe(false);
    resource.set('text1', 'a');
    expect(resource.needsSaved).toBe(true);
  });

  test('changing dependent relationship makes needsSaved true', () => {
    const resource = new schema.models.CollectionObject.Resource({
      id: collectionObjectId,
    });
    expect(resource.needsSaved).toBe(false);
    resource.set('determinations', []);
    expect(resource.needsSaved).toBe(true);
  });
});

const newCatalogNumber = 'abc';
overrideAjax(
  collectionObjectUrl,
  {
    ...collectionObjectResponse,
    catalognumber: newCatalogNumber,
    determinations: replaceItem(determinationsResponse, 0, {
      ...determinationsResponse[0],
      number1: 2,
    }),
  },
  {
    method: 'PUT',
    body: JSON.stringify({
      ...collectionObjectResponse,
      determinations: replaceItem(determinationsResponse, 0, {
        ...determinationsResponse[0],
        number1: 1,
      }),
    }),
  }
);

test('save', async () => {
  const resource = new schema.models.CollectionObject.Resource({
    id: collectionObjectId,
  });
  await resource.fetch();

  expect(resource.needsSaved).toBe(false);
  const determination =
    resource.getDependentResource('determinations')!.models[0];
  determination.set('number1', 1);
  // "needsSaved" propagates up
  expect(determination.needsSaved).toBe(true);
  expect(resource.needsSaved).toBe(true);

  await resource.save();

  expect(resource.needsSaved).toBe(false);
  // BUG: this should be false
  expect(determination.needsSaved).toBe(true);

  // Local values are overriden with what back-end sent
  expect(resource.get('catalogNumber')).toBe(newCatalogNumber);
  // BUG: on save, old determination is thrown out and a new one is created. Fix it
  const newDetermination =
    resource.getDependentResource('determinations')!.models[0];
  expect(newDetermination.get('number1')).toBe(2);
});

/*
 * TEST: test the handler for when .save() fails
 * TEST: changing collection resource or adding/removing to collection triggers change in parent resource
 */

describe('placeInSameHierarchy', () => {
  overrideAjax('/api/specify/collection/4/', {
    id: 4,
    discipline: getResourceApiUrl('Discipline', 3),
    resource_uri: getResourceApiUrl('Collection', 4),
  });

  overrideAjax('/api/specify/collectionobject/5/', {
    id: 5,
    collection: getResourceApiUrl('Collection', 4),
    resource_uri: getResourceApiUrl('CollectionObject', 5),
  });

  test('simple case', async () => {
    const collectionObject = new schema.models.CollectionObject.Resource({
      id: 5,
    });
    const locality = new schema.models.Locality.Resource();
    const hierarchyResource = await locality.placeInSameHierarchy(
      collectionObject
    );
    expect(hierarchyResource?.url()).toBe(getResourceApiUrl('Discipline', 3));
    expect(locality.get('discipline')).toBe(getResourceApiUrl('Discipline', 3));
  });

  test('undefined if Collection Object has no collection', async () => {
    const collectionObject = new schema.models.CollectionObject.Resource(
      {
        id: 6,
        resource_uri: getResourceApiUrl('CollectionObject', 6),
      },
      { noBusinessRules: true }
    );
    const locality = new schema.models.Locality.Resource();
    locality.set('discipline', null as never);
    await expect(
      locality.placeInSameHierarchy(collectionObject)
    ).resolves.toBeUndefined();
    expect(locality.get('discipline')).toBeNull();
  });

  test('invalid hierarchy', async () => {
    const collectionObject = new schema.models.CollectionObject.Resource({
      id: 100,
    });
    const author = new schema.models.Author.Resource();
    await expect(
      author.placeInSameHierarchy(collectionObject)
    ).resolves.toBeUndefined();
  });

  test('object with no hierarchy', async () => {
    const recordset = new schema.models.RecordSet.Resource({ id: 1 });
    const collectionObject = new schema.models.CollectionObject.Resource();
    await expect(
      collectionObject.placeInSameHierarchy(recordset)
    ).resolves.toBeUndefined();
  });

  test('hierarchy in wrong direction', async () => {
    const locality = new schema.models.Locality.Resource({ id: 100 });
    const collectionObject = new schema.models.CollectionObject.Resource();
    await expect(
      collectionObject.placeInSameHierarchy(locality)
    ).resolves.toBeUndefined();
  });
});
