import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { fetchCollection } from '../../DataModel/collection';
import { getResourceApiUrl } from '../../DataModel/resource';

requireContext();

/**
 * Regression test for issue #6971:
 * The Record Sets button in the Search Dialog previously used a paginated
 * fetch with a default limit of 10, which meant users with more than 10
 * record sets could only see a subset. The fix uses limit=0 (no limit)
 * to fetch all record sets.
 *
 * This test verifies that a limit=0 fetch returns all record sets rather
 * than being capped at 10.
 */
describe('SelectRecordSet record set fetch', () => {
  const recordSetCount = 25;
  const mockRecordSets = Array.from({ length: recordSetCount }, (_, index) => ({
    resource_uri: getResourceApiUrl('RecordSet', index + 1),
    name: `Record Set ${index + 1}`,
    dbTableId: 1,
    type: 0,
  }));

  overrideAjax(
    '/api/specify/recordset/?specifyuser=1&type=0&limit=0&offset=0&dbtableid=1&collectionmemberid=4',
    {
      meta: {
        total_count: recordSetCount,
      },
      objects: mockRecordSets,
    }
  );

  test('fetches all record sets when limit is 0', async () => {
    const result = await fetchCollection('RecordSet', {
      specifyUser: 1,
      type: 0,
      limit: 0,
      domainFilter: true,
      offset: 0,
      dbTableId: 1,
      collectionMemberId: 4,
    });

    expect(result.totalCount).toBe(recordSetCount);
    expect(result.records).toHaveLength(recordSetCount);
    expect(result.records).toEqual(
      mockRecordSets.map((recordSet) =>
        addMissingFields('RecordSet', recordSet)
      )
    );
  });

  test('returns more than the old default limit of 10', async () => {
    const result = await fetchCollection('RecordSet', {
      specifyUser: 1,
      type: 0,
      limit: 0,
      domainFilter: true,
      offset: 0,
      dbTableId: 1,
      collectionMemberId: 4,
    });

    expect(result.records.length).toBeGreaterThan(10);
  });
});
