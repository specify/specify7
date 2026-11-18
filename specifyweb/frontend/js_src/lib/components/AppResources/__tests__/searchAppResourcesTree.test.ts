import { requireContext } from '../../../tests/helpers';
import { localized } from '../../../utils/types';
import type { AppResourcesTree } from '../hooks';
import { searchAppResourcesTree } from '../tree';
import { staticAppResources } from './staticAppResources';

requireContext();

const resource = staticAppResources.appResources[0]!;
const viewSet = staticAppResources.viewSets[0]!;
const emptyNode = {
  key: 'empty',
  label: localized('Empty'),
  directory: undefined,
  appResources: [],
  viewSets: [],
  subCategories: [],
};
const tree: AppResourcesTree = [
  {
    ...emptyNode,
    key: 'root',
    label: localized('Root'),
    appResources: [
      {
        ...resource,
        name: 'preferences',
        label: localized('Global Preferences'),
      },
    ],
    subCategories: [
      {
        ...emptyNode,
        key: 'collection',
        label: localized('Collection'),
        appResources: [{ ...resource, name: 'Bird Report' }],
        viewSets: [{ ...viewSet, name: 'bird.views' }],
        subCategories: [emptyNode],
      },
      emptyNode,
    ],
  },
  emptyNode,
];

test('searches resource and form names and retains only their ancestor groups', () => {
  const result = searchAppResourcesTree(tree, '  BIRD  ');
  expect(result).toHaveLength(1);
  expect(result[0]?.appResources).toEqual([]);
  expect(result[0]?.subCategories).toHaveLength(1);
  expect(result[0]?.subCategories[0]?.appResources[0]?.name).toBe(
    'Bird Report'
  );
  expect(result[0]?.subCategories[0]?.viewSets[0]?.name).toBe('bird.views');
  expect(result[0]?.subCategories[0]?.subCategories).toEqual([]);
  expect(tree[0]?.subCategories).toHaveLength(2);
  expect(tree[0]?.appResources).toHaveLength(1);
});

test('searches the labels displayed to the user', () => {
  const result = searchAppResourcesTree(tree, 'global pref');
  expect(result[0]?.appResources[0]?.name).toBe('preferences');
  expect(result[0]?.subCategories).toEqual([]);
});

test('can match only a form definition', () => {
  const result = searchAppResourcesTree(tree, '.views');
  expect(result[0]?.subCategories[0]?.appResources).toEqual([]);
  expect(result[0]?.subCategories[0]?.viewSets).toHaveLength(1);
});

test('returns no groups for an unmatched resource name', () => {
  expect(searchAppResourcesTree(tree, 'nonexistent')).toEqual([]);
});

test('returns the original tree when search is cleared or whitespace-only', () => {
  expect(searchAppResourcesTree(tree, '')).toBe(tree);
  expect(searchAppResourcesTree(tree, '   ')).toBe(tree);
});
