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
import type { Tables } from '../types';

requireContext();

overrideAjax(
  `/api/specify/picklist/?domainfilter=false&name=${monthsPickListName}&collection=4&offset=0`,
  {
    meta: { total_count: 0 },
    objects: [],
  }
);

overrideAjax(
  '/api/specify/component/?catalognumber=%23%23%23%23%23%23%23%23%23&domainfilter=true',
  {
    objects: [],
    meta: {
      limit: 20,
      offset: 0,
      total_count: 0,
    },
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

  test('Cloning a loan does not carry over loan preparations', async () => {
    const loan = new tables.Loan.Resource(
      addMissingFields('Loan', {
        loanPreparations: [
          {
            _tableName: 'LoanPreparation',
          },
        ],
      })
    );

    await expect(
      loan
        .rgetCollection('loanPreparations')
        .then((collection) => collection.models.length)
    ).resolves.toBe(1);

    jest.spyOn(console, 'warn').mockImplementation();
    const cloned = await loan.clone(true);

    await expect(
      cloned
        .rgetCollection('loanPreparations')
        .then((collection) => collection.models.length)
    ).resolves.toBe(0);
  });

  test('Cloning a CollectionObject copies fields and omits unique fields', async () => {
    const original = new tables.CollectionObject.Resource(
      addMissingFields('CollectionObject', {
        resource_uri: getResourceApiUrl('CollectionObject', 1),
        id: 1,
        collection: getResourceApiUrl(
          'Collection',
          schema.domainLevelIds.collection
        ),
        collectionObjectType: getResourceApiUrl('CollectionObjectType', 2),
        catalogNumber: 'num-original',
        text1: 'copied field',
      })
    );

    const cloned = await original.clone(true);

    expect(cloned.id).toBeUndefined();
    expect(cloned.get('collection')).toBe(original.get('collection'));
    expect(cloned.get('collectionObjectType')).toBe(
      original.get('collectionObjectType')
    );
    expect(cloned.get('text1')).toBe('copied field');
    expect(cloned.get('catalogNumber')).toBeUndefined();

    expect(original.id).toBe(1);
    expect(original.get('catalogNumber')).toBe('num-original');
    expect(original.get('text1')).toBe('copied field');
  });

  test.each([
    'Attachment',
    'TaxonTreeDefItem',
    'GeologicTimePeriodTreeDefItem',
    'LithoStratTreeDefItem',
    'TectonicUnitTreeDefItem',
    'Agent',
    'CollectingEvent',
    'Geography',
    'Locality',
    'Accession',
    'Loan',
    'Gift',
    'Borrow',
    'Disposal',
    'Deaccession',
  ])(
    'Cloning %s copies fields and preserves the original',
    async (tableName) => {
      const typedTableName = tableName as keyof Tables;
      const table = tables[typedTableName];
      const record = {
        resource_uri: getResourceApiUrl(typedTableName, 1),
        id: 1,
        remarks: 'Test remarks',
      };
      const original = new table.Resource(
        addMissingFields(typedTableName, record)
      );

      const cloned = await original.clone(true);

      expect(cloned.id).toBeUndefined();
      expect(cloned.get('remarks')).toBe('Test remarks');
      expect(original.id).toBe(1);
      expect(original.get('remarks')).toBe('Test remarks');
    }
  );

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
