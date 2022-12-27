import { requireContext } from '../../../tests/helpers';
import { getTreeDefinitionItems } from '../treeRanks';

requireContext();

describe('Get tree definition', () => {
  test('for the Taxon tree', () =>
    expect(getTreeDefinitionItems('Taxon', false)).toMatchSnapshot());
  test('for the Geography tree', () =>
    expect(getTreeDefinitionItems('Geography', true)).toMatchSnapshot());
  test('for a non-tree table', () =>
    expect(
      getTreeDefinitionItems('Locality' as 'Taxon', true)
    ).toBeUndefined());
  test('for a non-existent table', () =>
    expect(
      getTreeDefinitionItems('SomeTable' as 'Taxon', true)
    ).toBeUndefined());
});
