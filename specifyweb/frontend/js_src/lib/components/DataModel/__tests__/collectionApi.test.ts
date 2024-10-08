import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import type { CollectionFetchFilters } from '../collection';
import { DEFAULT_FETCH_LIMIT } from '../collection';
import type { AnySchema } from '../helperTypes';
import { getResourceApiUrl } from '../resource';
import type { Collection } from '../specifyTable';
import { tables } from '../tables';
import type { Accession, Agent, CollectionObject } from '../types';

requireContext();

describe('LazyCollection', () => {
  const secondAccessionUrl = getResourceApiUrl('Accession', 12);
  const accessionId = 11;
  const accessionUrl = getResourceApiUrl('Accession', accessionId);
  const accessionNumber = '2011-IC-116';
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
    '/api/specify/accession/?domainfilter=false&addressofrecord=4&offset=0',
    {
      meta: { total_count: 2 },
      objects: accessionsResponse,
    }
  );

  overrideAjax(
    '/api/specify/accession/?domainfilter=false&addressofrecord=4&offset=2',
    {
      meta: { total_count: 2 },
      objects: accessionsResponse,
    }
  );

  test('can create a new instance', () => {
    const collection = new tables.Agent.LazyCollection() as Collection<Agent>;
    expect(collection.table.specifyTable).toBe(tables.Agent);
  });

  test('can fetch', async () => {
    const rawCollection = new tables.Accession.LazyCollection({
      filters: { addressOfRecord: 4 },
    });
    expect((rawCollection as Collection<Accession>).isComplete()).toBe(false);

    const collection = await rawCollection.fetch();
    expect(collection._totalCount).toBe(2);
    expect(collection.isComplete()).toBe(true);
    expect(collection.toJSON()).toEqual(accessionsResponse);

    // Can fetch again
    overwriteReadOnly(collection, '_totalCount', 3);
    expect(collection.isComplete()).toBe(false);
    await rawCollection.fetch();

    /*
     * Can handle case when record was deleted on the server in between fetches,
     * thus total count goes down
     */
    expect(collection._totalCount).toBe(2);
    expect(collection.isComplete()).toBe(true);
    expect(collection.toJSON()).toEqual(accessionsResponse);
  });
});

describe('Independent Collection', () => {
  const collectionObjectsResponse = Array.from({ length: 41 }, (_, index) => ({
    id: index + 1,
    resource_uri: getResourceApiUrl('CollectionObject', index + 1),
  }));

  overrideAjax(
    '/api/specify/collectionobject/?domainfilter=false&accession=1&offset=0',
    {
      objects: collectionObjectsResponse.slice(0, DEFAULT_FETCH_LIMIT),
      meta: {
        limit: DEFAULT_FETCH_LIMIT,
        total_count: collectionObjectsResponse.length,
      },
    }
  );

  overrideAjax(
    `/api/specify/collectionobject/?domainfilter=false&accession=1&offset=${DEFAULT_FETCH_LIMIT}`,
    {
      objects: collectionObjectsResponse.slice(
        DEFAULT_FETCH_LIMIT,
        DEFAULT_FETCH_LIMIT * 2
      ),
      meta: {
        limit: DEFAULT_FETCH_LIMIT,
        total_count: collectionObjectsResponse.length,
      },
    }
  );

  overrideAjax(
    `/api/specify/collectionobject/?domainfilter=false&accession=1&offset=${
      DEFAULT_FETCH_LIMIT * 2
    }`,
    {
      objects: collectionObjectsResponse.slice(DEFAULT_FETCH_LIMIT * 2),
      meta: {
        limit: DEFAULT_FETCH_LIMIT,
        total_count: collectionObjectsResponse.length,
      },
    }
  );

  overrideAjax(
    '/api/specify/collectionobject/?domainfilter=false&accession=1&offset=20&limit=0',
    {
      objects: collectionObjectsResponse.slice(DEFAULT_FETCH_LIMIT),
      meta: {
        limit: 0,
        total_count: collectionObjectsResponse.length,
      },
    }
  );

  test('lazily fetched', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch();
    expect(collection._totalCount).toBe(collectionObjectsResponse.length);
    expect(collection).toHaveLength(DEFAULT_FETCH_LIMIT);
    expect(collection.models.map(({ id }) => id)).toStrictEqual(
      collectionObjectsResponse
        .slice(0, DEFAULT_FETCH_LIMIT)
        .map(({ id }) => id)
    );

    await collection.fetch();
    expect(collection).toHaveLength(DEFAULT_FETCH_LIMIT * 2);
    expect(
      collection.models
        .slice(DEFAULT_FETCH_LIMIT, DEFAULT_FETCH_LIMIT * 2)
        .map(({ id }) => id)
    ).toStrictEqual(
      collectionObjectsResponse
        .slice(DEFAULT_FETCH_LIMIT, DEFAULT_FETCH_LIMIT * 2)
        .map(({ id }) => id)
    );

    await collection.fetch();
    const totalCount = collection._totalCount ?? 0;
    expect(collection).toHaveLength(totalCount);
  });

  test('specified offset', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch({
      offset: DEFAULT_FETCH_LIMIT,
    });
    expect(collection).toHaveLength(DEFAULT_FETCH_LIMIT);
    expect(collection.models.map(({ id }) => id)).toStrictEqual(
      collectionObjectsResponse
        .slice(DEFAULT_FETCH_LIMIT, DEFAULT_FETCH_LIMIT * 2)
        .map(({ id }) => id)
    );
  });

  test('reset', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch({
      offset: DEFAULT_FETCH_LIMIT,
      limit: 0,
    });
    expect(collection).toHaveLength(
      collectionObjectsResponse.length - DEFAULT_FETCH_LIMIT
    );
    expect(collection.models.map(({ id }) => id)).toStrictEqual(
      collectionObjectsResponse.slice(DEFAULT_FETCH_LIMIT).map(({ id }) => id)
    );
    await collection.fetch({
      reset: true,
      offset: 0,
    } as CollectionFetchFilters<AnySchema>);
    expect(collection).toHaveLength(DEFAULT_FETCH_LIMIT);
    expect(collection.models.map(({ id }) => id)).toStrictEqual(
      collectionObjectsResponse
        .slice(0, DEFAULT_FETCH_LIMIT)
        .map(({ id }) => id)
    );
  });

  test('removed objects not refetched', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch();
    const collectionObjectsToRemove = collection.models
      .slice(0, 5)
      .map((collectionObject) => ({ ...collectionObject }));
    collectionObjectsToRemove.forEach((collectionObject) =>
      collection.remove(collectionObject)
    );
    await collection.fetch({ offset: 0 });
    expect(collection.models.map(({ id }) => id)).toStrictEqual(
      collectionObjectsResponse
        .slice(5, DEFAULT_FETCH_LIMIT)
        .map(({ id }) => id)
    );
  });

  test('offset adjusted when all models removed', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch();
    const collectionObjectsToRemove = collection.models.map(
      (collectionObject) => ({ ...collectionObject })
    );
    collectionObjectsToRemove.forEach((collectionObject) =>
      collection.remove(collectionObject)
    );
    expect(collection.getFetchOffset()).toBe(DEFAULT_FETCH_LIMIT);
    await collection.fetch();
    expect(collection.models.map(({ id }) => id)).toStrictEqual(
      collectionObjectsResponse
        .slice(DEFAULT_FETCH_LIMIT, DEFAULT_FETCH_LIMIT * 2)
        .map(({ id }) => id)
    );
  });

  test('on resource change event', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch();

    expect(collection._totalCount).toBe(collectionObjectsResponse.length);

    collection.models[0].set('text1', 'someValue');
    expect(
      Object.values(collection.updated ?? {}).map((resource) =>
        typeof resource === 'string' ? resource : resource.toJSON()
      )
    ).toStrictEqual([
      {
        id: 1,
        resource_uri: '/api/specify/collectionobject/1/',
        text1: 'someValue',
      },
    ]);
  });

  overrideAjax('/api/specify/accession/1/', {
    id: 1,
    resource_uri: getResourceApiUrl('Accession', 1),
  });

  overrideAjax('/api/specify/collectionobject/1/', {
    id: 1,
    resource_uri: getResourceApiUrl('CollectionObject', 1),
  });

  test('on change toOne', async () => {
    const collectionObject = new tables.CollectionObject.Resource({ id: 1 });

    const collection = new tables.Accession.IndependentCollection({
      related: collectionObject,
      field: tables.Accession.strictGetRelationship('collectionObjects'),
    }) as Collection<Accession>;

    const rawAccession = new tables.Accession.Resource({ id: 1 });
    const accession = await rawAccession.fetch();

    expect(collectionObject.get('accession')).toBeUndefined();
    collection.add(accession);
    expect(collection.updated?.[accession.cid]).toBe(
      getResourceApiUrl('Accession', 1)
    );
    accession.set('accessionNumber', '2011-IC-116');
    expect(collection.updated?.[accession.cid]).toBe(accession);
    expect(collectionObject.get('accession')).toBe(
      getResourceApiUrl('Accession', 1)
    );
  });

  test('on add event', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch();

    const newCollectionObjects = [
      new tables.CollectionObject.Resource(),
      new tables.CollectionObject.Resource({ id: 100 }),
    ];
    collection.add(newCollectionObjects);
    expect(collection._totalCount).toBe(
      collectionObjectsResponse.length + newCollectionObjects.length
    );
    expect(Object.keys(collection.updated ?? {})).toStrictEqual(
      newCollectionObjects.map(({ cid }) => cid)
    );
    newCollectionObjects.forEach((collectionObject) => {
      const updatedEntry = collection.updated?.[collectionObject.cid];
      expect(updatedEntry).toBe(
        collectionObject.isNew() ? collectionObject : collectionObject.url()
      );
    });
  });
  test('on remove event', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });

    const collection = await rawCollection.fetch();

    const collectionObjectsToRemove = collection.models.slice(0, 3);
    collectionObjectsToRemove.forEach((collectionObject) =>
      collection.remove(collectionObject)
    );
    expect(collection._totalCount).toBe(
      collectionObjectsResponse.length - collectionObjectsToRemove.length
    );
    expect(Array.from(collection.removed ?? [])).toStrictEqual(
      collectionObjectsToRemove.map((resource) => resource.get('resource_uri'))
    );
  });
  test('removed and updated modify eachother', () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const collection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    }) as Collection<CollectionObject>;
    const collectionObject = new tables.CollectionObject.Resource({ id: 1 });
    collection.add(collectionObject);
    expect(collection.updated).toStrictEqual({
      [collectionObject.cid]: collectionObject.url(),
    });
    collection.remove(collectionObject);
    expect(collection.removed).toStrictEqual(new Set([collectionObject.url()]));
    expect(collection.updated).toStrictEqual({});
    collection.add(collectionObject);
    expect(collection.updated).toStrictEqual({
      [collectionObject.cid]: collectionObject.url(),
    });
    expect(collection.removed).toStrictEqual(new Set());
  });

  overrideAjax('/api/specify/collectionobject/200/', {
    id: 200,
    resource_uri: getResourceApiUrl('CollectionObject', 200),
  });

  test('toApiJSON', async () => {
    const accession = new tables.Accession.Resource({
      id: 1,
    });

    const rawCollection = new tables.CollectionObject.IndependentCollection({
      related: accession,
      field: tables.CollectionObject.strictGetRelationship('accession'),
    });
    const collection = await rawCollection.fetch();
    expect(collection.toApiJSON()).toStrictEqual({
      update: [],
      remove: [],
    });
    const collectionObjectsToRemove = collection.models
      .slice(1, 4)
      .map((collectionObject) => collectionObject);

    collectionObjectsToRemove.forEach((collectionObject) => {
      collection.remove(collectionObject);
    });

    const collectionObjectsToAdd = [
      new tables.CollectionObject.Resource({ id: 200 }),
      new tables.CollectionObject.Resource({ text1: 'someValue' }),
    ];
    collection.add(collectionObjectsToAdd);
    collection.models[0].set('catalogNumber', '000000001');

    expect(collection.toApiJSON()).toStrictEqual({
      remove: collectionObjectsToRemove.map((collectionObject) =>
        collectionObject.get('resource_uri')
      ),
      update: [
        '/api/specify/collectionobject/200/',
        collection.models.at(-1),
        collection.models[0],
      ],
    });
  });
});
