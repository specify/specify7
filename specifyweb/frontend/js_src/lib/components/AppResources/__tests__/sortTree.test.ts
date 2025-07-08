import { requireContext } from '../../../tests/helpers';
import { sortFunction } from '../../../utils/utils';
import type { AppResourcesTree } from '../hooks';
import { sortTree } from '../tree';
import { utilsForTests } from './utils';

const { simpleTree, incrementor, makeTree, treeStructure } = utilsForTests;

requireContext();

describe('sortTree', () => {
  test('simple tree case', () => {
    expect(sortTree(simpleTree())).toEqual(simpleTree());
  });

  test('simple tree case (reversed)', () => {
    expect(sortTree(simpleTree().reverse())).toEqual(simpleTree());
  });

  test('multi-level tree case', () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    const tree = makeTree(
      treeStructure,
      labelIncrementor,
      keyIncrementor,
      idIncrementor,
      { addResources: true, padZero: true }
    );

    expect(sortTree(tree)).toEqual(tree);
  });

  const sortTreeReverse = (tree: AppResourcesTree): AppResourcesTree =>
    Array.from(tree)
      .sort(sortFunction(({ label }) => label, true))
      .map(({ subCategories, ...rest }) => ({
        ...rest,
        subCategories: sortTreeReverse(subCategories),
      }));

  test('multi-level tree case (reversed)', () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    const tree = makeTree(
      treeStructure,
      labelIncrementor,
      keyIncrementor,
      idIncrementor,
      { addResources: true, padZero: true }
    );

    expect(sortTree(sortTreeReverse(tree))).toEqual(tree);
  });
});
