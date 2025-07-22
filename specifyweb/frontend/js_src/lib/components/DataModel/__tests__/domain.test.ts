import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { monthsPickListName } from '../../PickLists/definitions';
import { formatUrl } from '../../Router/queryString';
import { addMissingFields } from '../addMissingFields';
import { formatRelationshipPath } from '../helpers';
import { getResourceApiUrl } from '../resource';
import { schema } from '../schema';
import {
  fetchCollectionsForResource,
  getCollectionForResource,
} from '../scoping';
import { tables } from '../tables';

requireContext();

overrideAjax(
  `/api/specify/picklist/?domainfilter=false&name=${monthsPickListName}&collection=4&offset=0`,
  {
    meta: { total_count: 0 },
    objects: [],
  }
);

describe('getCollectionForResource', () => {
  test('Collection Object', () => {
    const collectionObject = new tables.CollectionObject.Resource({
      collectionMemberId: 2,
    });
    expect(getCollectionForResource(collectionObject)).toBe(2);
  });
  test('blank Collection Object', () => {
    const collectionObject = new tables.CollectionObject.Resource();
    /*
     * Prevent Collection object from being associated with current collection
     * automatically
     */
    collectionObject.set('collection', null as never);
    expect(getCollectionForResource(collectionObject)).toBeUndefined();
  });
  test('Locality from current discipline', () => {
    const locality = new tables.Locality.Resource({
      discipline: getResourceApiUrl(
        'Discipline',
        schema.domainLevelIds.discipline
      ),
    });
    expect(getCollectionForResource(locality)).toBe(
      schema.domainLevelIds.collection
    );
  });
  test('Locality from another discipline', () => {
    const locality = new tables.Locality.Resource({
      discipline: getResourceApiUrl(
        'Discipline',
        schema.domainLevelIds.discipline + 1
      ),
    });
    expect(getCollectionForResource(locality)).toBeUndefined();
  });
  test('PickListItem', () => {
    const pickListItem = new tables.PickListItem.Resource();
    expect(getCollectionForResource(pickListItem)).toBeUndefined();
  });
});

describe('fetchCollectionsForResource', () => {
  const divisionId = 99;
  overrideAjax(`/api/specify/division/${divisionId}/`, {
    resource_uri: getResourceApiUrl('Division', divisionId),
    id: divisionId,
  });
  overrideAjax(
    formatUrl('/api/specify/collection/', {
      limit: '0',
      [formatRelationshipPath('discipline', 'division')]: divisionId.toString(),
    }),
    {
      meta: {
        total_count: 2,
      },
      objects: [
        {
          resource_uri: getResourceApiUrl('Collection', 1),
          id: 1,
        },
        {
          resource_uri: getResourceApiUrl('Collection', 2),
          id: 2,
        },
      ],
    }
  );
  test('ExchangeIn', async () => {
    expect(schema.domainLevelIds.division).not.toBe(divisionId);
    const exchangeIn = new tables.ExchangeIn.Resource({
      division: getResourceApiUrl('Division', divisionId),
    });
    await expect(fetchCollectionsForResource(exchangeIn)).resolves.toEqual([
      1, 2,
    ]);
  });
});

describe('Resource initialization preferences', () => {
  beforeAll(async () => {
    const remotePrefs = await import('../../InitialContext/remotePrefs');
    jest.spyOn(remotePrefs, 'getCollectionPref').mockImplementation(() => true);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  test('CO_CREATE_COA', () => {
    const collectionObject = new tables.CollectionObject.Resource();
    expect(collectionObject.get('collectionObjectAttribute')).toBe(
      '/api/specify/collectionobjectattribute/'
    );
  });

  test('CO_CREATE_PREP', async () => {
    const collectionObject = new tables.CollectionObject.Resource();
    await expect(
      collectionObject
        .rgetCollection('preparations')
        .then((collection) => collection.models.length)
    ).resolves.toBe(1);
  });

  test('CO_CREATE_DET', async () => {
    const collectionObject = new tables.CollectionObject.Resource();
    const determinations =
      collectionObject.getDependentResource('determinations');
    expect(determinations).toHaveLength(1);
    expect(determinations?.models.at(0)?.get('isCurrent')).toBe(true);
  });

  test('Cloning resource does not create duplicates', async () => {
    // See Issue #3278

    const collectionObject = new tables.CollectionObject.Resource(
      addMissingFields('CollectionObject', {
        preparations: [
          {
            _tableName: 'Preparation',
            collectionMemberId: schema.domainLevelIds.collection,
          },
        ],
      })
    );

    /**
     * When cloning the resource, an empty CollectionObjectAttribute is created as well, causing the 'expected inline data for dependent field' warning from /DataModel/resourceApi.js
     */
    jest.spyOn(console, 'warn').mockImplementation();
    const cloned = await collectionObject.clone(true);

    await expect(
      cloned
        .rgetCollection('preparations')
        .then((collection) => collection.models.length)
    ).resolves.toBe(1);
  });
});
