import { requireContext } from '../../../tests/helpers';
import { buildAppResourceConformation } from '../helpers';
import { utilsForTests } from './utils';

requireContext();

const { treeStructure, incrementor, makeTree } = utilsForTests;

describe('buildAppResourceConformation', () => {
  test('simple 1-level case', () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    /*
     * Need to use typeof treeStructure because Node is not exported, and
     * exporting it will pollute global namespace.
     */
    const simpleTree: typeof treeStructure = [
      {
        id: 0,
        appResources: 2,
        viewSets: 1,
        children: [],
      },
      {
        id: 0,
        appResources: 0,
        viewSets: 3,
        children: [],
      },
      {
        id: 0,
        appResources: 1,
        viewSets: 0,
        children: [],
      },
      {
        id: 0,
        appResources: 0,
        viewSets: 0,
        children: [],
      },
    ];
    const tree = makeTree(
      simpleTree,
      labelIncrementor,
      keyIncrementor,
      idIncrementor,
      {addResources: true}
    );

    expect(buildAppResourceConformation(tree)).toMatchSnapshot();
  });

  test('multi-level tree', () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    const treeWithFilledLeaf: typeof treeStructure = [
      {
        id: 0,
        appResources: 0,
        viewSets: 0,
        children: [
          {
            id: 0,
            appResources: 0,
            viewSets: 0,
            children: [
              {
                id: 0,
                appResources: 0,
                viewSets: 0,
                children: [
                  {
                    id: 0,
                    appResources: 1,
                    viewSets: 2,
                    children: [],
                  },
                  {
                    id: 0,
                    appResources: 0,
                    viewSets: 2,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const nestedEmptyTree = [...treeStructure, ...treeWithFilledLeaf];

    const tree = makeTree(
      nestedEmptyTree,
      labelIncrementor,
      keyIncrementor,
      idIncrementor,
      {addResources: true}
    );

    expect(buildAppResourceConformation(tree)).toMatchSnapshot();
  });

  test('multi-level completely empty tree', () => {
    const labelIncrementor = incrementor();
    const keyIncrementor = incrementor();
    const idIncrementor = incrementor();

    const makeEmptyTree = (
      breadth: number,
      levels: number
    ): typeof treeStructure =>
      levels === 0
        ? []
        : Array.from({ length: breadth }, () => ({
            id: 0,
            viewSets: 0,
            appResources: 0,
            children: makeEmptyTree(breadth, levels - 1),
          }));

    const emptyTree = makeTree(
      makeEmptyTree(3, 3),
      labelIncrementor,
      keyIncrementor,
      idIncrementor,
      {addResources: true}
    );

    expect(buildAppResourceConformation(emptyTree)).toMatchSnapshot();
  });
});
