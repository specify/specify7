import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { RA, WritableArray } from '../../../utils/types';
import { removeKey, replaceItem } from '../../../utils/utils';
import { formatUrl } from '../../Router/queryString';
import { addMissingFields } from '../addMissingFields';
import { DependentCollection } from '../collectionApi';
import type { SerializedRecord, SerializedResource } from '../helperTypes';
import { getResourceApiUrl } from '../resource';
import { deserializeResource, serializeResource } from '../serializers';
import type { Collection } from '../specifyTable';
import { tables } from '../tables';
import type { CollectionObjectAttribute, Determination } from '../types';

requireContext();

test('resource is created for correct table', () =>
  expect(new tables.CollectionObject.Resource().specifyTable).toBe(
    tables.CollectionObject
  ));

const collectionObjectId = 100;
const collectionObjectUrl = getResourceApiUrl(
  'CollectionObject',
  collectionObjectId
);
const accessionId = 11;
const accessionUrl = getResourceApiUrl('Accession', accessionId);
const collectingEventId = 8868;
const collectingEventUrl = getResourceApiUrl(
  'CollectingEvent',
  collectingEventId
);
const determinationUrl = getResourceApiUrl('Determination', 123);

const determinationsResponse: RA<Partial<SerializedRecord<Determination>>> = [
  {
    resource_uri: determinationUrl,
    id: 123,
    number1: null,
  },
];

const collectionObjectResponse = {
  id: collectionObjectId,
  collectionobjecttype: getResourceApiUrl('CollectionObjectType', 1),
  resource_uri: collectionObjectUrl,
  accession: accessionUrl,
  catalognumber: '000029432',
  collectingevent: collectingEventUrl,
  collection: getResourceApiUrl('Collection', 4),
  determinations: determinationsResponse,
};

overrideAjax(collectionObjectUrl, collectionObjectResponse);
overrideAjax(
  '/api/specify/collectionobject/?domainfilter=false&catalognumber=000029432&collection=4&offset=0',
  {
    objects: [collectionObjectResponse],
    meta: {
      limit: 20,
      offset: 0,
      total_count: 1,
    },
  }
);

const accessionNumber = '2011-IC-116';
const accessionResponse = {
  resource_uri: accessionUrl,
  id: 11,
  accessionnumber: accessionNumber,
  accessionagents: [],
};
overrideAjax(accessionUrl, accessionResponse);

const collectingEventText = 'testCollectingEvent';

const collectingEventResponse = {
  resource_uri: collectingEventUrl,
  text1: collectingEventText,
  id: collectingEventId,
};
overrideAjax(collectingEventUrl, collectingEventResponse);

test('fetch', async () => {
  const resource = new tables.CollectionObject.Resource({
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
    const resource = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const accession = await resource.rgetPromise('accession');
    expect(accession?.toJSON()).toEqual(accessionResponse);
  });

  test('transient field', async () => {
    const resource = new tables.CollectionObject.Resource({
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
    const resource = new tables.Locality.Resource({ id: localityId });
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
    const resource = new tables.AddressOfRecord.Resource({
      id: addressOfRecordId,
    });
    const accessions = await resource.rgetCollection('accessions');
    expect(accessions.table.specifyTable).toBe(tables.Accession);
    expect(accessions.models).toHaveLength(2);
    expect(accessions.models[1].populated).toBe(true);
    expect(accessions.toJSON()).toEqual(accessionsResponse);
  });

  test('dependent one-to-many', async () => {
    const resource = new tables.Accession.Resource({ id: accessionId });
    const agents = await resource.rgetCollection('accessionAgents');
    expect(agents.models).toHaveLength(0);
  });

  test('repeated calls for independent merge different objects', async () => {
    const resource = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const testCEText = 'someOtherText';

    const firstCollectingEvent = await resource.rgetPromise('collectingEvent');
    firstCollectingEvent?.set('text1', testCEText);
    const secondCollectingEvent = await resource.rgetPromise('collectingEvent');
    expect(testCEText).not.toBe(collectingEventText);
    expect(secondCollectingEvent?.get('text1')).toBe(testCEText);
    expect(
      removeKey(firstCollectingEvent?.toJSON() ?? {}, 'text1')
    ).toStrictEqual(removeKey(secondCollectingEvent?.toJSON() ?? {}, 'text1'));
  });

  test('call for independent refetches related', async () => {
    const resource = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const newCollectingEvent = new tables.CollectingEvent.Resource({
      id: collectingEventId,
      text1: 'someOtherText',
    });
    resource.set('collectingEvent', newCollectingEvent);
    const firstCollectingEvent = await resource.rgetPromise('collectingEvent');
    expect(firstCollectingEvent?.get('text1')).toEqual(collectingEventText);
  });

  test('repeated calls for dependent return same object', async () => {
    const resource = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const firstDeterminations = await resource.rgetCollection('determinations');
    const secondDeterminations =
      await resource.rgetCollection('determinations');
    expect(firstDeterminations.toJSON()).toEqual(determinationsResponse);
    expect(secondDeterminations.toJSON()).toEqual(determinationsResponse);
    expect(firstDeterminations).toBe(secondDeterminations);
  });

  // TEST: add dependent and independent tests for all relationship types (and zero-to-one)
});

describe('eventHandlerForToMany', () => {
  test('saverequired', () => {
    const resource = new tables.CollectionObject.Resource(
      addMissingFields('CollectionObject', {
        preparations: [
          {
            id: 1,
            _tableName: 'Preparation',
          },
        ],
      })
    );
    const testFunction = jest.fn();
    resource.on('saverequired', testFunction);
    expect(testFunction).toHaveBeenCalledTimes(0);
    expect(resource.needsSaved).toBe(false);
    resource
      .getDependentResource('preparations')
      ?.models[0].set('text1', 'helloWorld');

    expect(resource.needsSaved).toBe(true);
    expect(testFunction).toHaveBeenCalledTimes(1);
  });
  test('changing collection propagates to related', () => {
    const resource = new tables.CollectionObject.Resource(
      addMissingFields('CollectionObject', {
        preparations: [
          {
            id: 1,
            _tableName: 'Preparation',
          },
        ],
      })
    );
    const onResourceChange = jest.fn();
    const onPrepChange = jest.fn();
    const onPrepAdd = jest.fn();
    const onPrepRemoval = jest.fn();
    resource.on('change', onResourceChange);
    resource.on('change:preparations', onPrepChange);
    resource.on('add:preparations', onPrepAdd);
    resource.on('remove:preparations', onPrepRemoval);

    resource
      .getDependentResource('preparations')
      ?.models[0].set('text1', 'helloWorld', { silent: false });
    expect(onResourceChange).toHaveBeenCalledWith(
      resource,
      resource.getDependentResource('preparations')
    );
    expect(onPrepChange).toHaveBeenCalledWith(
      resource.getDependentResource('preparations')?.models[0],
      { silent: false }
    );
    const newPrep = new tables.Preparation.Resource({
      barCode: 'test',
    });
    resource.getDependentResource('preparations')?.add(newPrep);
    expect(onPrepAdd).toHaveBeenCalledWith(
      newPrep,
      resource.getDependentResource('preparations'),
      {}
    );
    resource.getDependentResource('preparations')?.remove(newPrep);
    expect(onPrepRemoval).toHaveBeenCalledWith(
      newPrep,
      resource.getDependentResource('preparations'),
      { index: 1 }
    );

    expect(onResourceChange).toHaveBeenCalledTimes(3);

    resource.set('determinations', [
      addMissingFields('Determination', {
        taxon: getResourceApiUrl('Taxon', 1),
      }),
    ]);
    expect(onResourceChange).toHaveBeenCalledTimes(4);
    expect(onPrepChange).toHaveBeenCalledTimes(1);
    expect(onPrepAdd).toHaveBeenCalledTimes(1);
    expect(onPrepRemoval).toHaveBeenCalledTimes(1);
  });
});

describe('needsSaved', () => {
  test('changing field makes needsSaved true', () => {
    const resource = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });

    expect(resource.needsSaved).toBe(false);
    resource.set('text1', 'a');
    expect(resource.needsSaved).toBe(true);
  });

  test('changing dependent relationship makes needsSaved true', () => {
    const resource = new tables.CollectionObject.Resource({
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

overrideAjax(
  '/api/specify/collectionobject/?domainfilter=false&catalognumber=abc&collection=4&offset=0',
  {
    objects: [collectionObjectResponse],
    meta: {
      limit: 20,
      offset: 0,
      total_count: 1,
    },
  }
);

test('save', async () => {
  const resource = new tables.CollectionObject.Resource({
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

describe('set', () => {
  test('field value', () => {
    const resource = new tables.CollectionObject.Resource();
    const testIntegerValue = 10;
    expect(resource.get('integer1')).toBeUndefined();
    resource.set('integer1', testIntegerValue);
    expect(resource.get('integer1')).toBe(testIntegerValue);
    resource.set('integer1', undefined as never);
    expect(resource.get('integer1')).toBe(testIntegerValue);
    resource.set('integer1', null);
    expect(resource.get('integer1')).toBeNull();
  });
  test('array dependent to-many', () => {
    const resource = new tables.CollectionObject.Resource();
    const determinations = [
      new tables.Determination.Resource({ isCurrent: true }),
      new tables.Determination.Resource(),
    ];
    resource.set('determinations', determinations);
    const determinationCollection =
      resource.getDependentResource('determinations');
    expect(resource.get('determinations')).toBeUndefined();
    expect(determinationCollection).toBeInstanceOf(DependentCollection);
    expect(determinationCollection?.length).toBe(2);
    expect(determinationCollection?.related).toBe(resource);
    expect(resource.dependentResources.determinations).toBe(
      determinationCollection
    );
  });
  test('collection dependent to-many', () => {
    const resource = new tables.CollectionObject.Resource();
    const determinations = [
      new tables.Determination.Resource({ isCurrent: true }),
      new tables.Determination.Resource(),
    ];
    const initialDeterminationCollection =
      new tables.Determination.DependentCollection(
        {
          related: resource,
          field: tables.Determination.strictGetRelationship('collectionObject'),
        },
        determinations
      ) as Collection<Determination>;
    resource.set('determinations', initialDeterminationCollection);
    const determinationCollection =
      resource.getDependentResource('determinations');
    expect(resource.get('determinations')).toBeUndefined();
    expect(determinationCollection?.length).toBe(2);
    expect(determinationCollection?.related).toBe(resource);
    expect(resource.dependentResources.determinations).toBe(
      determinationCollection
    );
    expect(initialDeterminationCollection).not.toBe(determinationCollection);
  });
  test('url dependent to-many', () => {
    const expectedWarnings = [
      'expected inline data for dependent field',
      'Setting uri on to-many relationship',
    ];
    const warnings: WritableArray<unknown> = [];
    const consoleWarn = jest.fn((...args) => warnings.push(args[0]));
    jest.spyOn(console, 'warn').mockImplementation(consoleWarn);

    const resource = new tables.CollectionObject.Resource({
      id: 1,
      determinations: [
        {
          _tablename: 'Determination',
          iscurrent: true,
        },
        { _tablename: 'Determination' },
      ],
    });
    const determinationCollection =
      resource.getDependentResource('determinations');
    expect(determinationCollection).toHaveLength(2);
    resource.set(
      'determinations',
      formatUrl(getResourceApiUrl('Determination', undefined), {
        collectionobject: resource.id,
      }) as never
    );
    expect(warnings).toStrictEqual(expectedWarnings);
    expect(resource.get('determinations')).toBe(
      formatUrl(getResourceApiUrl('Determination', undefined), {
        collectionobject: resource.id,
      })
    );
    expect(resource.getDependentResource('determinations')).toBe(
      determinationCollection
    );
    expect(resource.dependentResources.determinations).toBe(
      determinationCollection
    );
  });
  test('undefined dependent to-many', () => {
    const expectedWarnings = [
      'Expected array of resources or collection when setting one-to-many',
    ];
    const warnings: WritableArray<unknown> = [];
    const consoleWarn = jest.fn((...args) => warnings.push(args[0]));
    jest.spyOn(console, 'warn').mockImplementation(consoleWarn);
    const resource = new tables.CollectionObject.Resource({
      id: 1,
      determinations: [
        {
          _tablename: 'Determination',
          iscurrent: true,
        },
        { _tablename: 'Determination' },
      ],
    });
    const determinationCollection =
      resource.getDependentResource('determinations');
    resource.set('determinations', undefined as never);
    expect(warnings).toStrictEqual(expectedWarnings);
    expect(resource.get('determinations')).toBeUndefined();
    expect(resource.getDependentResource('determinations')).toBe(
      determinationCollection
    );
    expect(resource.dependentResources.determinations).toBe(
      determinationCollection
    );
  });
  test('null dependent to-many', () => {
    const expectedWarnings = [
      'Expected array of resources or collection when setting one-to-many',
    ];
    const warnings: WritableArray<unknown> = [];
    const consoleWarn = jest.fn((...args) => warnings.push(args[0]));
    jest.spyOn(console, 'warn').mockImplementation(consoleWarn);
    const resource = new tables.CollectionObject.Resource({
      id: 1,
      determinations: [
        {
          _tablename: 'Determination',
          iscurrent: true,
        },
        { _tablename: 'Determination' },
      ],
    });
    const determinationCollection =
      resource.getDependentResource('determinations');
    resource.set('determinations', null as never);
    expect(warnings).toStrictEqual(expectedWarnings);
    expect(resource.get('determinations')).toBeUndefined();
    expect(resource.getDependentResource('determinations')).toBe(
      determinationCollection
    );
    expect(resource.dependentResources.determinations).toBe(
      determinationCollection
    );
  });
  test('specifyResource dependent to-one', () => {
    const resource = new tables.CollectionObject.Resource();
    const collectionObjectAttributeId = 1;
    const collectionObjectAttribute =
      new tables.CollectionObjectAttribute.Resource({
        id: collectionObjectAttributeId,
        text1: 'test',
        integer1: 10,
      });
    resource.set('collectionObjectAttribute', collectionObjectAttribute);
    expect(resource.dependentResources.collectionobjectattribute).toBe(
      collectionObjectAttribute
    );
    expect(resource.getDependentResource('collectionObjectAttribute')).toBe(
      collectionObjectAttribute
    );
    expect(resource.get('collectionObjectAttribute')).toBe(
      getResourceApiUrl(
        'CollectionObjectAttribute',
        collectionObjectAttributeId
      )
    );
  });
  test('seralizedResource dependent to-one', () => {
    const resource = new tables.CollectionObject.Resource({
      id: 1,
    });
    const collectionObjectAttributeId = 1;
    const seralizedCOAttribute: Partial<
      SerializedResource<CollectionObjectAttribute>
    > = {
      _tableName: 'CollectionObjectAttribute',
      id: collectionObjectAttributeId,
      text1: 'test',
      integer1: 10,
    };
    resource.set(
      'collectionObjectAttribute',
      seralizedCOAttribute as SerializedResource<CollectionObjectAttribute>
    );
    const collectionObjectAttribute = resource.getDependentResource(
      'collectionObjectAttribute'
    );
    expect(resource.dependentResources.collectionobjectattribute).toBe(
      collectionObjectAttribute
    );
    expect(serializeResource(collectionObjectAttribute!)).toStrictEqual(
      serializeResource(deserializeResource(seralizedCOAttribute))
    );
    expect(resource.get('collectionObjectAttribute')).toBe(
      getResourceApiUrl(
        'CollectionObjectAttribute',
        collectionObjectAttributeId
      )
    );
  });
  test('uri dependent to-one', () => {
    const expectedWarnings = ['expected inline data for dependent field'];
    const warnings: WritableArray<unknown> = [];
    const consoleWarn = jest.fn((...args) => warnings.push(args[0]));
    jest.spyOn(console, 'warn').mockImplementation(consoleWarn);
    const resource = new tables.CollectionObject.Resource();
    const collectionObjectAttributeId = 1;
    resource.set(
      'collectionObjectAttribute',
      getResourceApiUrl(
        'CollectionObjectAttribute',
        collectionObjectAttributeId
      ) as never
    );
    expect(warnings).toStrictEqual(expectedWarnings);
    expect(resource.get('collectionObjectAttribute')).toBe(
      getResourceApiUrl(
        'CollectionObjectAttribute',
        collectionObjectAttributeId
      )
    );
    expect(
      resource.dependentResources.collectionobjectattribute
    ).toBeUndefined();
  });
  test('uri unsets dependent to-one references', () => {
    const expectedWarnings = [
      'expected inline data for dependent field',
      'unexpected condition',
    ];
    const warnings: WritableArray<unknown> = [];
    const consoleWarn = jest.fn((...args) => warnings.push(args[0]));
    jest.spyOn(console, 'warn').mockImplementation(consoleWarn);

    const collectionObjectAttributeId = 1;
    const seralizedCOAttribute = {
      id: collectionObjectAttributeId,
      text1: 'test',
    };
    const resource = new tables.CollectionObject.Resource({
      id: 1,
      collectionObjectAttribute: seralizedCOAttribute as never,
    });
    const coAttribute = resource.getDependentResource(
      'collectionObjectAttribute'
    );
    expect(coAttribute).toBeDefined();
    expect(resource.dependentResources.collectionobjectattribute).toBe(
      coAttribute
    );
    expect(resource.get('collectionObjectAttribute')).toBe(
      getResourceApiUrl(
        'CollectionObjectAttribute',
        collectionObjectAttributeId
      )
    );
    resource.set(
      'collectionObjectAttribute',
      getResourceApiUrl(
        'CollectionObjectAttribute',
        collectionObjectAttributeId + 1
      ) as never
    );
    expect(warnings).toStrictEqual(expectedWarnings);
    expect(resource.get('collectionObjectAttribute')).toBe(
      getResourceApiUrl(
        'CollectionObjectAttribute',
        collectionObjectAttributeId + 1
      )
    );
    expect(
      resource.getDependentResource('collectionObjectAttribute')
    ).toBeUndefined();
    expect(
      resource.dependentResources.collectionobjectattribute
    ).toBeUndefined();
  });
  test('null dependent to-one', () => {
    const collectionObjectAttributeId = 1;
    const seralizedCOAttribute = {
      id: collectionObjectAttributeId,
      text1: 'test',
    };
    const resource = new tables.CollectionObject.Resource({
      id: 1,
      collectionObjectAttribute: seralizedCOAttribute as never,
    });
    resource.set('collectionObjectAttribute', null);
    expect(resource.get('collectionObjectAttribute')).toBeNull();
    expect(
      resource.getDependentResource('collectionObjectAttribute')
    ).toBeNull();
    expect(resource.dependentResources.collectionobjectattribute).toBeNull();
  });
  test('url with independendent to-one', () => {
    const baseId = 1;
    const resource = new tables.CollectionObject.Resource({ id: baseId });
    const accession = new tables.Accession.Resource({ id: baseId });
    resource.set('accession', accession);
    expect(resource.get('accession')).toBe(
      getResourceApiUrl('Accession', baseId)
    );
    expect(resource.independentResources.accession).toBe(accession);
    resource.set('accession', getResourceApiUrl('Accession', baseId));
    expect(resource.get('accession')).toBe(
      getResourceApiUrl('Accession', baseId)
    );
    expect(resource.independentResources.accession).toBe(accession);
    resource.set('accession', getResourceApiUrl('Accession', baseId + 1));
    expect(resource.get('accession')).toBe(
      getResourceApiUrl('Accession', baseId + 1)
    );
    expect(resource.independentResources.accession).toBe(undefined);
  });
  test('null independent to-one', () => {
    const baseId = 1;
    const resource = new tables.CollectionObject.Resource({ id: baseId });
    const accession = new tables.Accession.Resource({ id: baseId });
    resource.set('accession', accession);
    expect(resource.get('accession')).toBe(
      getResourceApiUrl('Accession', baseId)
    );
    expect(resource.independentResources.accession).toBeDefined();
    resource.set('accession', null);
    expect(resource.get('accession')).toBeNull();
    expect(resource.independentResources.accession).toBeNull();
  });
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
    const collectionObject = new tables.CollectionObject.Resource({
      id: 5,
    });
    const locality = new tables.Locality.Resource();
    const hierarchyResource =
      await locality.placeInSameHierarchy(collectionObject);
    expect(hierarchyResource?.url()).toBe(getResourceApiUrl('Discipline', 3));
    expect(locality.get('discipline')).toBe(getResourceApiUrl('Discipline', 3));
  });

  test('undefined if Collection Object has no collection', async () => {
    const collectionObject = new tables.CollectionObject.Resource(
      {
        id: 6,
        resource_uri: getResourceApiUrl('CollectionObject', 6),
      },
      { noBusinessRules: true }
    );
    const locality = new tables.Locality.Resource();
    locality.set('discipline', null as never);
    await expect(
      locality.placeInSameHierarchy(collectionObject)
    ).resolves.toBeUndefined();
    expect(locality.get('discipline')).toBeNull();
  });

  test('invalid hierarchy', async () => {
    const collectionObject = new tables.CollectionObject.Resource({
      id: collectionObjectId,
    });
    const author = new tables.Author.Resource();
    await expect(
      author.placeInSameHierarchy(collectionObject)
    ).resolves.toBeUndefined();
  });

  test('object with no hierarchy', async () => {
    const recordset = new tables.RecordSet.Resource({ id: 1 });
    const collectionObject = new tables.CollectionObject.Resource();
    await expect(
      collectionObject.placeInSameHierarchy(recordset)
    ).resolves.toBeUndefined();
  });

  test('hierarchy in wrong direction', async () => {
    const locality = new tables.Locality.Resource({ id: 100 });
    const collectionObject = new tables.CollectionObject.Resource();
    await expect(
      collectionObject.placeInSameHierarchy(locality)
    ).resolves.toBeUndefined();
  });
});
