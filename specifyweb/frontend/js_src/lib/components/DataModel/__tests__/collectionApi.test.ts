import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { getResourceApiUrl } from '../resource';
import type { Collection } from '../specifyTable';
import { tables } from '../tables';
import type { Accession, Agent } from '../types';

requireContext();

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

describe('LazyCollection', () => {
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
