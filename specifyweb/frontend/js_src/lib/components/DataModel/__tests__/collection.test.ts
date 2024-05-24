import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { addMissingFields } from '../addMissingFields';
import { exportsForTests, fetchCollection, fetchRelated } from '../collection';
import { backendFilter } from '../helpers';
import { getResourceApiUrl } from '../resource';

requireContext();

const { mapQueryParameter, buildUrl } = exportsForTests;

describe('fetchCollection', () => {
  const baseCoRecord = {
    resource_uri: getResourceApiUrl('CollectionObject', 1),
  };
  overrideAjax('/api/specify/collectionobject/?limit=1&domainfilter=true', {
    meta: {
      total_count: 2,
    },
    objects: [baseCoRecord],
  });

  test('Simple collection objects query', async () =>
    expect(
      fetchCollection('CollectionObject', { limit: 1, domainFilter: true })
    ).resolves.toEqual({
      records: [addMissingFields('CollectionObject', baseCoRecord)],
      totalCount: 2,
    }));

  const baseInstitutionRecord = {
    resource_uri: getResourceApiUrl('Institution', 1),
  };
  overrideAjax('/api/specify/institution/?limit=1', {
    meta: {
      total_count: 2,
    },
    objects: [baseInstitutionRecord],
  });

  test("If query can't be scoped, it won't be", async () =>
    expect(
      /*
       * Deposit "domainFilter: true", false will be sent to back-end because
       * this table can't be scoped
       */
      fetchCollection('Institution', { limit: 1, domainFilter: true })
    ).resolves.toEqual({
      records: [addMissingFields('Institution', baseInstitutionRecord)],
      totalCount: 2,
    }));

  const baseLocalityRecord = {
    resource_uri: getResourceApiUrl('Locality', 1),
  };
  overrideAjax(
    '/api/specify/locality/?limit=1&localityname=Test&orderby=-latlongaccuracy&yesno1=True',
    {
      meta: {
        total_count: 2,
      },
      objects: [baseLocalityRecord],
    }
  );

  test('Locality query with simple filters and sort', async () =>
    expect(
      fetchCollection('Locality', {
        limit: 1,
        localityName: 'Test',
        orderBy: '-latLongAccuracy',
        yesNo1: true,
        domainFilter: false,
      })
    ).resolves.toEqual({
      records: [addMissingFields('Locality', baseLocalityRecord)],
      totalCount: 2,
    }));

  overrideAjax(
    '/api/specify/locality/?limit=1&localityname__istartswith=Test&id__in=1%2C2',
    {
      meta: {
        total_count: 2,
      },
      objects: [baseLocalityRecord],
    }
  );

  test('Locality query with complex filters', async () =>
    expect(
      fetchCollection(
        'Locality',
        { limit: 1, domainFilter: false },
        {
          ...backendFilter('localityName').caseInsensitiveStartsWith('Test'),
          ...backendFilter('id').isIn([1, 2]),
        }
      )
    ).resolves.toEqual({
      records: [addMissingFields('Locality', baseLocalityRecord)],
      totalCount: 2,
    }));
});

describe('fetchRelated', () => {
  const baseCitationRecord = {
    resource_uri: getResourceApiUrl('AccessionCitation', 1),
  };
  overrideAjax('/api/specify/accessioncitation/?limit=1&accession=1', {
    meta: {
      total_count: 2,
    },
    objects: [baseCitationRecord],
  });
  test('Accession -> accessionCitations', async () =>
    expect(
      fetchRelated(
        addMissingFields('Accession', {
          resource_uri: getResourceApiUrl('Accession', 1),
        }),
        'accessionCitations',
        1
      )
    ).resolves.toEqual({
      records: [addMissingFields('AccessionCitation', baseCitationRecord)],
      totalCount: 2,
    }));
});

theories(mapQueryParameter, [
  [['orderBy', 'A', 'CollectionObject'], 'a'],
  [['domainFilter', true, 'CollectionObject'], 'true'],
  [['domainFilter', false, 'CollectionObject'], undefined],
  // Not scoped
  [['domainFilter', true, 'AddressOfRecord'], undefined],
  [['domainFilter', false, 'AddressOfRecord'], undefined],
  // Attachment is an exception
  [['domainFilter', true, 'Attachment'], 'true'],
  [['domainFilter', false, 'Attachment'], undefined],
  [['distinct', true, 'CollectionObject'], 'true'],
  [['distinct', false, 'CollectionObject'], undefined],
  [['test', true, 'CollectionObject'], 'True'],
  [['test', false, 'CollectionObject'], 'False'],
  [['test', 2, 'CollectionObject'], '2'],
  [['test', 'a', 'CollectionObject'], 'a'],
]);

theories(buildUrl, [
  [
    [
      `/api/specify_rows/Agent/`,
      'Agent',
      {
        domainFilter: true,
        limit: 1,
        offset: 4,
        orderBy: '-id',
        firstName: 'Test',
      },
      {
        createdByAgent__lastName: 'Test',
      },
    ],
    '/api/specify_rows/Agent/?domainfilter=true&limit=1&offset=4&orderby=-id&firstname=Test&createdbyagent__lastname=Test',
  ],
]);
