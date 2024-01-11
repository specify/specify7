import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import type { SerializedResource } from '../../DataModel/helperTypes';
import { tables } from '../../DataModel/tables';
import type { Taxon } from '../../DataModel/types';
import { exportsForTests } from '../TreeLevelPickList';

const { fetchPossibleRanks, fetchLowestChildRank } = exportsForTests;

requireContext();

const animaliaResponse: Partial<SerializedResource<Taxon>> = {
  _tableName: 'Taxon',
  id: 2,
  fullName: 'Animalia',
  parent: '/api/specify/taxon/1/',
  definition: '/api/specify/taxontreedef/1/',
  definitionItem: '/api/specify/taxontreedefitem/21/',
  rankId: 10,
};

const chordataResponse = {
  _tableName: 'Taxon',
  id: 3,
  fullname: 'Chordata',
  name: 'Chordata',
  rankid: 30,
  definition: '/api/specify/taxontreedef/1/',
  definitionitem: '/api/specify/taxontreedefitem/10/',
  parent: '/api/specify/taxon/2/',
};

const melasResponse = {
  _tableName: 'Taxon',
  id: 4,
  fullname: 'Ameiurus',
  name: 'Ameiurus',
  rankid: 180,
  definition: '/api/specify/taxontreedef/1/',
  definitionitem: '/api/specify/taxontreedefitem/9/',
  parent: '/api/specify/taxon/3/',
};

overrideAjax('/api/specify/taxon/2/', animaliaResponse);
overrideAjax('/api/specify/taxon/3/', chordataResponse);

test('fetchLowestChildRank', async () => {
  const animalia = new tables.Taxon.Resource({ id: 2 });
  await animalia.fetch();

  expect(fetchLowestChildRank(animalia)).resolves.toBe(30);
});

describe('fetchPossibleRanks', () => {
  overrideAjax('/api/specify/taxon/?limit=1&parent=2&orderby=rankid', {
    objects: [chordataResponse],
    meta: {
      limit: 1,
      offset: 0,
      total_count: 2,
    },
  });
  test('fetchPossibleRanks', async () => {
    const animalia = new tables.Taxon.Resource({ id: 2 });
    await animalia.fetch();

    const lowestChildRank = await fetchLowestChildRank(animalia);

    expect(
      fetchPossibleRanks(lowestChildRank, animalia.id, 'Taxon')
    ).resolves.toEqual([
      {
        title: 'Kingdom',
        value: '/api/specify/taxontreedefitem/21/',
      },
    ]);
  });

  overrideAjax('/api/specify/taxon/?limit=1&parent=3&orderby=rankid', {
    objects: [melasResponse],
    meta: {
      limit: 1,
      offset: 0,
      total_count: 2,
    },
  });
  test('only next enforced is fetched', async () => {
    const chordata = new tables.Taxon.Resource({ id: 3 });
    await chordata.fetch();

    const lowestChildRank = await fetchLowestChildRank(chordata);

    expect(
      fetchPossibleRanks(lowestChildRank, chordata.id, 'Taxon')
    ).resolves.toEqual([
      {
        title: 'Kingdom',
        value: '/api/specify/taxontreedefitem/21/',
      },
      {
        title: 'Phylum',
        value: '/api/specify/taxontreedefitem/10/',
      },
      {
        title: 'Class',
        value: '/api/specify/taxontreedefitem/12/',
      },
    ]);
  });
});
