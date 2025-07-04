import { requireContext } from "../../../tests/helpers";
import { RA } from "../../../utils/types";
import { getAppResourceCount } from "../helpers";
import { AppResourcesTree } from "../hooks";
import { utilsForTests } from "./utils";

requireContext();

const { treeStructure, incrementor, makeTree } = utilsForTests;

type TreeCount = RA<{
    count: number,
    children: TreeCount
}>;

describe("getAppResourceCount", ()=>{

    test("multi-level tree test", ()=>{

        const labelIncrementor = incrementor();
        const keyIncrementor = incrementor();
        const idIncrementor = incrementor();

        // Make the tree with the resources.
        const tree = makeTree(treeStructure, labelIncrementor, keyIncrementor, idIncrementor, true);

        const getStructure = (tree: AppResourcesTree): TreeCount => tree.map((node)=>({
            count: getAppResourceCount(node),
            children: getStructure(node.subCategories)
        }));
        

        expect(getStructure(tree)).toMatchInlineSnapshot(`
[
  {
    "children": [
      {
        "children": [
          {
            "children": [],
            "count": 3,
          },
          {
            "children": [],
            "count": 5,
          },
        ],
        "count": 8,
      },
      {
        "children": [
          {
            "children": [],
            "count": 8,
          },
          {
            "children": [],
            "count": 2,
          },
        ],
        "count": 10,
      },
    ],
    "count": 21,
  },
  {
    "children": [
      {
        "children": [
          {
            "children": [],
            "count": 0,
          },
          {
            "children": [],
            "count": 5,
          },
        ],
        "count": 5,
      },
      {
        "children": [
          {
            "children": [
              {
                "children": [],
                "count": 9,
              },
            ],
            "count": 9,
          },
          {
            "children": [],
            "count": 9,
          },
        ],
        "count": 23,
      },
    ],
    "count": 41,
  },
]
`)

    });
});