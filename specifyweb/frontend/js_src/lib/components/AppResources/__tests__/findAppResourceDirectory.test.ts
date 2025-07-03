import { AppResourcesTree } from "../hooks";
import { ScopedAppResourceDir } from "../types";
import { tables } from "../../DataModel/tables";
import { serializeResource } from "../../DataModel/serializers";
import { localized, R, RA } from "../../../utils/types";
import { requireContext } from "../../../tests/helpers";
import { findAppResourceDirectory } from "../Create";
import { f } from "../../../utils/functools";

requireContext();

describe("findAppResourceDirectory", ()=>{

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
        viewSets: []
    });
    
    const makeDirectory = (id: number): ScopedAppResourceDir => {
        const dir = new tables.SpAppResourceDir.Resource({
            id,
            isPersonal: false,
            collection: "/api/specify/collection/32768/",
            discipline: "/api/specify/discipline/3/"
        });

        return ({...serializeResource(dir), scope: 'collection'})
    };

    test("first level search", ()=>{
        const tree: AppResourcesTree = [
            makeAppResourceNode("TestLabel", "TestKey1", makeDirectory(1), []),
            makeAppResourceNode("TestLabel2", "TestKey2", makeDirectory(2), []),
            makeAppResourceNode("TestLabel3", "TestKey3", undefined, []),
            makeAppResourceNode("TestLabel4", "TestKey4", makeDirectory(4), []),
            makeAppResourceNode("TestLabel5", "TestKey5", makeDirectory(4), []),
        ];

        tree.forEach((node)=>{
            const searchKey = node.key;
            const found = findAppResourceDirectory(tree, searchKey);
            expect(found).toEqual(node.directory);
        });
    });

    test("multi level search", ()=>{

        // This makes adding tests a bit easier.
        type Node = {
            readonly id?: number;
            readonly children: RA<Node>
        };

        const treeStructure: RA<Node> = [
            {
                id: 1, 
                children: [
                    {
                        id: 1,
                        children: [
                            {id: 2, children: []},
                            {id: undefined, children: []}
                        ]
                    },
                    {
                        id: 3,
                        children: [
                            {id: undefined, children: []},
                            {id: undefined, children: []}
                        ]
                    }
                ]
            },
            {
                id: 1, 
                children: [
                    {
                        id: 4,
                        children: [
                            {id: 7, children: []},
                            {id: undefined, children: []}
                        ]
                    },
                    {
                        id: 3,
                        children: [
                            {id: 9, children: [
                                {id: undefined, children: []}
                            ]},
                            {id: 10, children: []}
                        ]
                    }
                ]
            }
        ];


        function *incrementor(prefix: string){
            let index = 0;
            while (true){
                yield `${prefix}${index++}`;
            }
        }



        const labelMaker = incrementor("TestLabel");
        const keyMaker = incrementor("TestKey");

        const makeTree = (nodes: RA<Node>) : AppResourcesTree => (
            nodes.map((node)=>makeAppResourceNode(
                labelMaker.next().value as string, 
                keyMaker.next().value as string,
                f.maybe(node.id, makeDirectory),
                makeTree(node.children)
            ))
        );

        const makeKeyDirMapping = (tree: AppResourcesTree): R<ScopedAppResourceDir | undefined> => (
            Object.fromEntries(tree.flatMap((node)=>[
                [node.key, node.directory],
                ...Object.entries(makeKeyDirMapping(node.subCategories))
            ]))
        );


        const tree: AppResourcesTree = makeTree(treeStructure);
        const keyDirMapping = makeKeyDirMapping(tree);

        Object.entries(keyDirMapping).forEach(([searchKey, dir])=>{
            const found = findAppResourceDirectory(tree, searchKey);
            expect(found).toEqual(dir);
        });
    });

});