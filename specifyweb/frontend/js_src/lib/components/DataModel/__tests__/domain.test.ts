import { requireContext } from '../../../tests/helpers';
import {
  fetchCollectionsForResource,
  getCollectionForResource,
} from '../domain';
import { getResourceApiUrl } from '../resource';
import { schema } from '../schema';
import { overrideAjax } from '../../../tests/ajax';
import { formatUrl } from '../../Router/queryString';

requireContext();

describe('getCollectionForResource', () => {
  test('Collection Object', () => {
    const collectionObject = new schema.models.CollectionObject.Resource({
      collectionMemberId: 2,
    });
    expect(getCollectionForResource(collectionObject)).toBe(2);
  });
  test('blank Collection Object', () => {
    const collectionObject = new schema.models.CollectionObject.Resource();
    /*
     * Prevent Collection object from being associated with current collection
     * automatically
     */
    collectionObject.set('collection', null);
    expect(getCollectionForResource(collectionObject)).toBeUndefined();
  });
  test('Locality from current discipline', () => {
    const locality = new schema.models.Locality.Resource({
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
    const locality = new schema.models.Locality.Resource({
      discipline: getResourceApiUrl(
        'Discipline',
        schema.domainLevelIds.discipline + 1
      ),
    });
    expect(getCollectionForResource(locality)).toBeUndefined();
  });
  test('PickListItem', () => {
    const pickListItem = new schema.models.PickListItem.Resource();
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
      discipline__division: divisionId.toString(),
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
    const exchangeIn = new schema.models.ExchangeIn.Resource({
      division: getResourceApiUrl('Division', divisionId),
    });
    await expect(fetchCollectionsForResource(exchangeIn)).resolves.toEqual([
      1, 2,
    ]);
  });
});
