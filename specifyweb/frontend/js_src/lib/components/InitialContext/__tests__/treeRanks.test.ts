import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { schema } from '../../DataModel/schema';
import {
  allTrees,
  exportsForTests,
  getDisciplineTrees,
  getTreeDefinitionItems,
  isTreeModel,
  isTreeResource,
  strictGetTreeDefinitionItems,
} from '../treeRanks';

const { getTreeScope } = exportsForTests;

requireContext();

test('getDisciplineTrees', () =>
  expect(getDisciplineTrees()).toMatchSnapshot());

theories(isTreeModel, [
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
    expect(isTreeResource(new schema.models.Taxon.Resource())).toBe(true));
  test('GeologicTimePeriod is a tree resource, even though we are not in a paleo discipline', () =>
    expect(
      isTreeResource(new schema.models.GeologicTimePeriod.Resource())
    ).toBe(true));
  test('Locality', () =>
    expect(isTreeResource(new schema.models.Locality.Resource())).toBe(false));
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
  expect(Object.fromEntries(allTrees.map((tree) => [tree, getTreeScope(tree)])))
    .toMatchInlineSnapshot(`
      {
        "Geography": "discipline",
        "GeologicTimePeriod": "discipline",
        "LithoStrat": "discipline",
        "Storage": "institution",
        "Taxon": "discipline",
      }
    `));
