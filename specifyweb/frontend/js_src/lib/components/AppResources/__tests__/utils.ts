import type { RA } from '../../../utils/types';
import { localized } from '../../../utils/types';
import { replaceItem } from '../../../utils/utils';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { SerializedResource } from '../../DataModel/helperTypes';
import { getResourceApiUrl } from '../../DataModel/resource';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { Discipline } from '../../DataModel/types';
import type { AppResources, AppResourcesTree } from '../hooks';
import type { ScopedAppResourceDir } from '../types';

// Make it part of functools?
function* incrementor() {
  let index = 0;
  while (true) {
    yield index++;
  }
}

function prefixIncrmentor(
  prefix: string,
  generator: ReturnType<typeof incrementor>
) {
  return `${prefix}${generator.next().value}`;
}

type Incrementor = ReturnType<typeof incrementor>;

const makeAppResourceNode = (
  label: string,
  key: string,
  directory: ScopedAppResourceDir | undefined,
  subCategories: AppResourcesTree,
  appResources?: AppResourcesTree[number]['appResources'],
  viewSets?: AppResourcesTree[number]['viewSets']
): AppResourcesTree[number] => ({
  label: localized(label),
  key,
  directory,
  subCategories,
  appResources: appResources ?? [],
  viewSets: viewSets ?? [],
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

// This makes adding tests a bit easier.
type Node = {
  readonly id?: number;
  readonly children: RA<Node>;
  readonly appResources?: number;
  readonly viewSets?: number;
};

const treeStructure: RA<Node> = [
  {
    id: 0,
    appResources: 1,
    viewSets: 2,
    children: [
      {
        id: 0,
        children: [
          { id: 0, children: [], appResources: 2, viewSets: 1 },
          { id: undefined, children: [], appResources: 5 },
        ],
      },
      {
        id: 0,
        children: [
          { id: undefined, children: [], appResources: 1, viewSets: 7 },
          { id: undefined, children: [], viewSets: 2 },
        ],
      },
    ],
  },
  {
    id: 0,
    appResources: 5,
    viewSets: 8,
    children: [
      {
        id: 0,
        children: [
          { id: 0, children: [] },
          { id: undefined, children: [], viewSets: 5 },
        ],
      },
      {
        id: 0,
        appResources: 3,
        viewSets: 2,
        children: [
          {
            id: 0,
            children: [
              { id: undefined, children: [], appResources: 2, viewSets: 7 },
            ],
          },
          { id: 0, children: [], appResources: 3, viewSets: 6 },
        ],
      },
    ],
  },
];

const makeTree = (
  nodes: RA<Node>,
  labelIncrementor: Incrementor,
  keyIncrementor: Incrementor,
  idIncrementor: Incrementor,
  // If true, it'll also add the appResource and viewSet objects
  addResources: boolean = false,
  forceGenerator: boolean = true
): AppResourcesTree =>
  nodes.map((node) =>
    makeAppResourceNode(
      prefixIncrmentor('TestLabel', labelIncrementor),
      prefixIncrmentor('TestKey', keyIncrementor),
      node.id === undefined
        ? undefined
        : makeDirectory(
            forceGenerator ? (idIncrementor.next().value as number) : node.id
          ),
      makeTree(
        node.children,
        labelIncrementor,
        keyIncrementor,
        idIncrementor,
        addResources,
        forceGenerator
      ),
      addResources
        ? Array.from({ length: node.appResources ?? 0 }, () =>
            addMissingFields('SpAppResource', {
              id: idIncrementor.next().value as number,
            })
          )
        : [],
      addResources
        ? Array.from({ length: node.viewSets ?? 0 }, () =>
            addMissingFields('SpViewSetObj', {
              id: idIncrementor.next().value as number,
            })
          )
        : []
    )
  );

const simpleTree = () => [
  makeAppResourceNode('TestLabel', 'TestKey1', makeDirectory(1), []),
  makeAppResourceNode('TestLabel2', 'TestKey2', makeDirectory(2), []),
  makeAppResourceNode('TestLabel3', 'TestKey3', undefined, []),
  makeAppResourceNode('TestLabel4', 'TestKey4', makeDirectory(4), []),
  makeAppResourceNode('TestLabel5', 'TestKey5', makeDirectory(5), []),
];

const setAppResourceDir = (
  resources: AppResources,
  key: 'appResources' | 'viewSets',
  index: number,
  newDir: number
): AppResources => ({
  ...resources,
  [key]: replaceItem(resources[key as 'appResources'], index, {
    ...resources[key as 'appResources'][index],
    spAppResourceDir: getResourceApiUrl('SpAppResourceDir', newDir),
  }),
});

const testDisciplines = [
      {
        id: 3,
        isPaleoContextEmbedded: true,
        name: 'Ichthyology',
        paleoContextChildTable: 'collectionobject',
        regNumber: '1344636812.54',
        timestampCreated: '2012-08-09T12:23:29',
        timestampModified: '2012-08-09T12:23:29',
        type: 'fish',
        version: 11,
        createdByAgent: '/api/specify/agent/1/',
        dataType: '/api/specify/datatype/1/',
        division: '/api/specify/division/2/',
        geographyTreeDef: '/api/specify/geographytreedef/1/',
        taxonTreeDef: '/api/specify/taxontreedef/1/',
        geologicTimePeriodTreeDef: '/api/specify/geologictimeperiodtreedef/1/',
        lithoStratTreeDef: '/api/specify/lithostrattreedef/1/',
        tectonicUnitTreeDef: '/api/specify/tectonicunittreedef/1/',
        modifiedByAgent: '/api/specify/agent/2/',
        attributeDefs: '/api/specify/attributedef/?discipline=3',
        collections: '/api/specify/collection/?discipline=3',
        spExportSchemas: '/api/specify/spexportschema/?discipline=3',
        spLocaleContainers: '/api/specify/splocalecontainer/?discipline=3',
        resource_uri: '/api/specify/discipline/3/',
        userGroups: '/api/specify/SpPrincipal?scope=3',
        _tableName: 'Discipline',
      },
    ] as unknown as RA<SerializedResource<Discipline>>;

export const utilsForTests = {
  treeStructure,
  makeTree,
  makeDirectory,
  makeAppResourceNode,
  incrementor,
  simpleTree,
  setAppResourceDir,
  testDisciplines
};
