import { requireContext } from '../../../tests/helpers';
import { resources } from '../../DataModel/bussinesRuleStore';

requireContext();
test('a', () => {
  const pendingPromises = resources.filter(
    (r) => r.businessRuleManager?.pendingPromises !== undefined
  );
  expect(pendingPromises).toHaveLength(0);
});

/*
 *Const rankNames = {
 *Taxon: 'Species',
 *Geography: 'County',
 *Storage: 'Cabinet',
 *GeologicTimePeriod: 'Epoch',
 *LithoStrat: 'Formation',
 *};
 *const fullNames = {
 *Taxon: 'Carpiodes velifer',
 *Geography: 'Los Angeles County',
 *Storage: 'Cabinet 1',
 *GeologicTimePeriod: 'Paleocene',
 *LithoStrat: 'Cretaceous',
 *};
 *allTrees.map((table, rankId) => {
 *const nodeId = rankId * 4;
 *const rankUrl = getResourceApiUrl(`${table}TreeDefItem`, rankId);
 *overrideAjax(getResourceApiUrl(table, nodeId), () =>
 *  addMissingFields(table, {
 *    id: nodeId,
 *    definitionItem: rankUrl,
 *    fullName: fullNames[table],
 *    resource_uri: getResourceApiUrl(table, nodeId),
 *  })
 *);
 *overrideAjax(rankUrl, () =>
 *  addMissingFields(`${table}TreeDefItem`, {
 *    id: rankId,
 *    name: rankNames[table],
 *    resource_uri: rankUrl,
 *  })
 *);
 *});
 *
 *test('queryFromTree', async () => {
 *expect(
 *  Promise.all(
 *    allTrees.map(async (tree, index) => queryFromTree(tree, index * 4))
 *  )
 *).resolves.toMatchSnapshot();
 *});
 */
