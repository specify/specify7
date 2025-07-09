import { act, renderHook } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { useAppResourceCount } from '../hooks';
import { utilsForTests } from './utils';

requireContext();

const { treeStructure, incrementor, makeTree } = utilsForTests;

describe('useAppResourceCount', () => {
  test('multi-level tree test', async () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    // Make the tree with the resources.
    const tree = makeTree(
      treeStructure,
      labelIncrementor,
      keyIncrementor,
      idIncrementor,
      { addResources: true }
    );

    let treeNode = tree[0];

    const { result, rerender } = renderHook(() =>
      useAppResourceCount(treeNode)
    );

    expect(result.current).toBe(21);

    treeNode = tree[1];

    await act(rerender);

    expect(result.current).toBe(41);
  });
});
