import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { tables } from '../../DataModel/tables';
import { testingTrees } from '../../QueryBuilder/__tests__/fromTree.test';
import {
  exportsForTests,
  getDisciplineTrees,
  getTreeDefinitionItems,
  isTreeResource,
  isTreeTable,
  strictGetTreeDefinitionItems,
} from '../treeRanks';

const { getTreeScope } = exportsForTests;

requireContext();

test('getDisciplineTrees', () =>
  expect(getDisciplineTrees()).toMatchSnapshot());

theories(isTreeTable, [
  { in: ['Taxon'], out: true },
  {
    name: 'GeologicTimePeriod is a tree model, even though we are not in a paleo discipline',
    in: ['GeologicTimePeriod'],
    out: true,
  },
  { in: ['Locality'], out: false },
]);

describe('isTreeResource', () => {
  test('Taxon', () =>
    expect(isTreeResource(new tables.Taxon.Resource())).toBe(true));
  test('GeologicTimePeriod is a tree resource, even though we are not in a paleo discipline', () =>
    expect(isTreeResource(new tables.GeologicTimePeriod.Resource())).toBe(
      true
    ));
  test('Locality', () =>
    expect(isTreeResource(new tables.Locality.Resource())).toBe(false));
});

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

describe('strictGetTreeDefinitionItems', () => {
  test('Taxon', () =>
    expect(strictGetTreeDefinitionItems('Taxon', false)).toEqual(
      getTreeDefinitionItems('Taxon', false)
    ));
  test('Locality', () =>
    expect(() =>
      strictGetTreeDefinitionItems('Locality' as 'Taxon', true)
    ).toThrow(/Unable to get tree ranks for a/u));
});

test('getTreeScope', () =>
  expect(
    Object.fromEntries(testingTrees.map((tree) => [tree, getTreeScope(tree)]))
  ).toMatchInlineSnapshot(`
      {
        "Geography": "discipline",
        "GeologicTimePeriod": "discipline",
        "LithoStrat": "discipline",
        "Storage": "institution",
        "Taxon": "discipline",
      }
    `));
