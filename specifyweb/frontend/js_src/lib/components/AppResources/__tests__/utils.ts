import { localized, RA } from "../../../utils/types";
import { serializeResource } from "../../DataModel/serializers";
import { tables } from "../../DataModel/tables";
import { AppResourcesTree } from "../hooks";
import { ScopedAppResourceDir } from "../types";

// Make it part of functools?
function *incrementor(){
    let index = 0;
    while (true){
        yield index++;
    }
}

function prefixIncrmentor(prefix: string, generator: ReturnType<typeof incrementor>){
    return `${prefix}${generator.next().value}`
}

type Incrementor = ReturnType<typeof incrementor>;

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


// This makes adding tests a bit easier.
type Node = {
    readonly id?: number;
    readonly children: RA<Node>
};

const treeStructure: RA<Node> = [
    {
        id: 0, 
        children: [
            {
                id: 0,
                children: [
                    {id: 0, children: []},
                    {id: undefined, children: []}
                ]
            },
            {
                id: 0,
                children: [
                    {id: undefined, children: []},
                    {id: undefined, children: []}
                ]
            }
        ]
    },
    {
        id: 0, 
        children: [
            {
                id: 0,
                children: [
                    {id: 0, children: []},
                    {id: undefined, children: []}
                ]
            },
            {
                id: 0,
                children: [
                    {id: 0, children: [
                        {id: undefined, children: []}
                    ]},
                    {id: 0, children: []}
                ]
            }
        ]
    }
];

const makeTree = (nodes: RA<Node>, labelIncrementor: Incrementor, keyIncrementor: Incrementor, idIncrementor: Incrementor, forceGenerator: boolean = true) : AppResourcesTree => (
    nodes.map((node)=>makeAppResourceNode(
        prefixIncrmentor("TestLabel", labelIncrementor) , 
        prefixIncrmentor("TestKey", keyIncrementor) ,
        node.id === undefined ? undefined : makeDirectory(forceGenerator ? (idIncrementor.next().value as number) : node.id),
        makeTree(node.children, labelIncrementor, keyIncrementor, idIncrementor)
    ))
);

const simpleTree = () => [
    makeAppResourceNode("TestLabel", "TestKey1", makeDirectory(1), []),
    makeAppResourceNode("TestLabel2", "TestKey2", makeDirectory(2), []),
    makeAppResourceNode("TestLabel3", "TestKey3", undefined, []),
    makeAppResourceNode("TestLabel4", "TestKey4", makeDirectory(4), []),
    makeAppResourceNode("TestLabel5", "TestKey5", makeDirectory(5), []),
]

export const utilsForTests = {
    treeStructure,
    makeTree,
    makeDirectory,
    makeAppResourceNode,
    incrementor,
    simpleTree
}