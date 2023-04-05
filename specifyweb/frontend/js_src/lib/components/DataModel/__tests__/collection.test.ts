import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../addMissingFields';
import { fetchCollection, fetchRelated } from '../collection';
import { getResourceApiUrl } from '../resource';

requireContext();

describe('fetchCollection', () => {
  const baseCoRecord = {
    resource_uri: getResourceApiUrl('CollectionObject', 1),
  };
  overrideAjax('/api/specify/collectionobject/?limit=1', {
    meta: {
      total_count: 2,
    },
    objects: [baseCoRecord],
  });

  test('Simple collection objects query', async () =>
    expect(fetchCollection('CollectionObject', { limit: 1 })).resolves.toEqual({
      records: [addMissingFields('CollectionObject', baseCoRecord)],
      totalCount: 2,
    }));

  const baseLocalityRecord = {
    resource_uri: getResourceApiUrl('Locality', 1),
  };
  overrideAjax(
    '/api/specify/locality/?limit=1&localityname=Test&orderby=-latlongaccuracy&yesno1=True&domainfilter=false',
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
    '/api/specify/locality/?limit=1&localityname__istarswith=Test&id__in=1%2C2',
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
        { limit: 1 },
        {
          localityName__iStarsWith: 'Test',
          id__in: '1,2',
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
