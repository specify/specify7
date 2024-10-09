import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getResourceApiUrl } from '../../DataModel/resource';
import { allTrees } from '../../InitialContext/treeRanks';
import { queryFromTree } from '../fromTree';

requireContext();

const rankNames = {
  Taxon: 'Species',
  Geography: 'County',
  Storage: 'Cabinet',
  GeologicTimePeriod: 'Epoch',
  LithoStrat: 'Formation',
};
const fullNames = {
  Taxon: 'Carpiodes velifer',
  Geography: 'Los Angeles County',
  Storage: 'Cabinet 1',
  GeologicTimePeriod: 'Paleocene',
  LithoStrat: 'Cretaceous',
};

// TODO: Add static data for Tectonic Unit and replace ALL testingTrees usages with allTrees
export const testingTrees = allTrees.filter((t) => t !== 'TectonicUnit');
testingTrees.map((table, rankId) => {
  const nodeId = rankId * 4;
  const rankUrl = getResourceApiUrl(`${table}TreeDefItem`, rankId);
  overrideAjax(getResourceApiUrl(table, nodeId), () =>
    addMissingFields(table, {
      id: nodeId,
      definitionItem: rankUrl,
      // @ts-expect-error Remove error suppress after adding static data for TectonicUnit
      fullName: fullNames[table],
      resource_uri: getResourceApiUrl(table, nodeId),
    })
  );
  overrideAjax(rankUrl, () =>
    addMissingFields(`${table}TreeDefItem`, {
      id: rankId,
      // @ts-expect-error Remove error suppress after adding static data for TectonicUnit
      name: rankNames[table],
      resource_uri: rankUrl,
    })
  );
});

test('queryFromTree', async () =>
  expect(
    Promise.all(
      // TODO: Add static data for Tectonic Unit and replace testingTrees with allTrees
      testingTrees.map(async (tree, index) => queryFromTree(tree, index * 4))
    )
  ).resolves.toMatchSnapshot());
