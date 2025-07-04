import { requireContext } from '../../../tests/helpers';
import { f } from '../../../utils/functools';
import type { R, RA } from '../../../utils/types';
import { filterArray, localized } from '../../../utils/types';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import {
  findAppResourceDirectory,
  findAppResourceDirectoryKey,
} from '../Create';
import type { AppResourcesTree } from '../hooks';
import type { ScopedAppResourceDir } from '../types';

requireContext();

const makeAppResourceNode = (
  label: string,
  key: string,
  directory: ScopedAppResourceDir | undefined,
  subCategories: AppResourcesTree
): AppResourcesTree[number] => ({
  label: localized(label),
  key,
  directory,
  subCategories,
  appResources: [],
  viewSets: [],
});

const makeDirectory = (id: number): ScopedAppResourceDir => {
  const dir = new tables.SpAppResourceDir.Resource({
    id,
    isPersonal: false,
    collection: '/api/specify/collection/32768/',
    discipline: '/api/specify/discipline/3/',
  });

  return { ...serializeResource(dir), scope: 'collection' };
};

// Make it part of functools?
function* incrementor() {
  let index = 0;
  while (true) {
    yield index++;
  }
}

type Incrementor = ReturnType<typeof incrementor>;

function prefixIncrmentor(
  prefix: string,
  generator: ReturnType<typeof incrementor>
) {
  return `${prefix}${generator.next().value}`;
}

// This makes adding tests a bit easier.
type Node = {
  readonly id?: number;
  readonly children: RA<Node>;
};

const treeStructure: RA<Node> = [
  {
    id: 0,
    children: [
      {
        id: 0,
        children: [
          { id: 0, children: [] },
          { id: undefined, children: [] },
        ],
      },
      {
        id: 0,
        children: [
          { id: undefined, children: [] },
          { id: undefined, children: [] },
        ],
      },
    ],
  },
  {
    id: 0,
    children: [
      {
        id: 0,
        children: [
          { id: 0, children: [] },
          { id: undefined, children: [] },
        ],
      },
      {
        id: 0,
        children: [
          { id: 0, children: [{ id: undefined, children: [] }] },
          { id: 0, children: [] },
        ],
      },
    ],
  },
];

const makeTree = (
  nodes: RA<Node>,
  labelIncrementor: Incrementor,
  keyIncrementor: Incrementor,
  idIncrementor: Incrementor
): AppResourcesTree =>
  nodes.map((node) =>
    makeAppResourceNode(
      prefixIncrmentor('TestLabel', labelIncrementor),
      prefixIncrmentor('TestKey', keyIncrementor),
      node.id === undefined
        ? undefined
        : makeDirectory(idIncrementor.next().value as number),
      makeTree(node.children, labelIncrementor, keyIncrementor, idIncrementor)
    )
  );

const simpleTree = () => [
  makeAppResourceNode('TestLabel', 'TestKey1', makeDirectory(1), []),
  makeAppResourceNode('TestLabel2', 'TestKey2', makeDirectory(2), []),
  makeAppResourceNode('TestLabel3', 'TestKey3', undefined, []),
  makeAppResourceNode('TestLabel4', 'TestKey4', makeDirectory(4), []),
  makeAppResourceNode('TestLabel5', 'TestKey5', makeDirectory(5), []),
];

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

    const tree: AppResourcesTree = makeTree(
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
    const tree: AppResourcesTree = simpleTree();

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

    const tree: AppResourcesTree = makeTree(
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
