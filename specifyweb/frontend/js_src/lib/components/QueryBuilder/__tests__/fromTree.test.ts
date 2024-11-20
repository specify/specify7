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
  TectonicUnit: 'Substructure',
};
const fullNames = {
  Taxon: 'Carpiodes velifer',
  Geography: 'Los Angeles County',
  Storage: 'Cabinet 1',
  GeologicTimePeriod: 'Paleocene',
  LithoStrat: 'Cretaceous',
  TectonicUnit: 'Plate',
};

allTrees.map((table, rankId) => {
  const nodeId = rankId * 4;
  const rankUrl = getResourceApiUrl(`${table}TreeDefItem`, rankId);
  overrideAjax(getResourceApiUrl(table, nodeId), () =>
    addMissingFields(table, {
      id: nodeId,
      definitionItem: rankUrl,
      fullName: fullNames[table],
      resource_uri: getResourceApiUrl(table, nodeId),
    })
  );
  overrideAjax(rankUrl, () =>
    addMissingFields(`${table}TreeDefItem`, {
      id: rankId,
      name: rankNames[table],
      resource_uri: rankUrl,
    })
  );
});

test('queryFromTree', async () =>
  expect(
    Promise.all(
      allTrees.map(async (tree, index) => queryFromTree(tree, index * 4))
    )
  ).resolves.toMatchSnapshot());
