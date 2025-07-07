import { requireContext } from '../../../tests/helpers';
import { f } from '../../../utils/functools';
import type { R } from '../../../utils/types';
import { filterArray } from '../../../utils/types';
import {
  findAppResourceDirectory,
  findAppResourceDirectoryKey,
} from '../Create';
import type { AppResourcesTree } from '../hooks';
import type { ScopedAppResourceDir } from '../types';

import { utilsForTests } from './utils';

requireContext();

const { treeStructure, simpleTree, incrementor, makeTree } = utilsForTests;

describe('findAppResourceDirectory', () => {
  test('first level search', () => {
    const tree: AppResourcesTree = simpleTree();

    tree.forEach((node) => {
      const searchKey = node.key;
      const found = findAppResourceDirectory(tree, searchKey);
      expect(found).toEqual(node.directory);
    });
  });

  test('multi level search', () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    const makeKeyDirMapping = (
      tree: AppResourcesTree
    ): R<ScopedAppResourceDir | undefined> =>
      Object.fromEntries(
        tree.flatMap((node) => [
          [node.key, node.directory],
          ...Object.entries(makeKeyDirMapping(node.subCategories)),
        ])
      );

    const tree = makeTree(
      treeStructure,
      labelIncrementor,
      keyIncrementor,
      idIncrementor
    );

    Object.entries(makeKeyDirMapping(tree)).forEach(([searchKey, dir]) => {
      const found = findAppResourceDirectory(tree, searchKey);
      expect(found).toEqual(dir);
    });

    const found = findAppResourceDirectory(tree, '_absent_key_');
    expect(found).toBeUndefined();
  });
});

describe('findAppResourceDirectoryKey', () => {
  test('first level search', () => {
    const tree = simpleTree();

    tree.forEach((node) => {
      if (node.directory?.id === undefined) return;
      const found = findAppResourceDirectoryKey(tree, node.directory?.id);
      expect(found).toEqual(node.key);
    });
  });

  test('multi level search', () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    const tree = makeTree(
      treeStructure,
      labelIncrementor,
      keyIncrementor,
      idIncrementor
    );

    const makeDirIdKeyMapping = (
      tree: AppResourcesTree
    ): Record<number, string> =>
      Object.fromEntries(
        filterArray(
          tree.flatMap((node) => [
            node.directory === undefined
              ? undefined
              : [node.directory.id, node.key],
            ...Object.entries(makeDirIdKeyMapping(node.subCategories)),
          ])
        )
      );

    const dirKeyMapping = makeDirIdKeyMapping(tree);

    Object.entries(dirKeyMapping).forEach(([dirId, key]) => {
      const found = findAppResourceDirectoryKey(tree, f.parseInt(dirId)!);
      expect(found).toEqual(key);
    });
  });
});
