/**
 * Fetch tree definitions (and tree ranks) for all fields accessible in a
 * given discipline.
 */

import { ajax } from '../../utils/ajax';
import { getCache } from '../../utils/cache';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { caseInsensitiveHash } from '../../utils/utils';
import type {
  AnySchema,
  AnyTree,
  FilterTablesByEndsWith,
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchContext as fetchDomain, schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import { genericTables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';

export type TreeInformation = {
  readonly [TREE_NAME in AnyTree['tableName']]: RA<{
    readonly definition: SerializedResource<FilterTablesByEndsWith<'TreeDef'>>;
    readonly ranks: RA<
      SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
    >;
  }>;
};

let treeDefinitions: TreeInformation = undefined!;

/*
 * FEATURE: allow reordering trees
 *    See https://github.com/specify/specify7/issues/2121#issuecomment-1432158152
 */
const commonTrees = ['Geography', 'Storage', 'Taxon'] as const;
const treesForPaleo = ['GeologicTimePeriod', 'LithoStrat'] as const;
export const allTrees = [...commonTrees, ...treesForPaleo] as const;
/*
 * Until discipline information is loaded, assume all trees are appropriate in
 * this discipline
 */
let disciplineTrees: RA<AnyTree['tableName']> = allTrees;
export const getDisciplineTrees = (): typeof disciplineTrees => disciplineTrees;

export const isTreeTable = (
  tableName: keyof Tables
): tableName is AnyTree['tableName'] => f.includes(allTrees, tableName);

export const isTreeResource = (
  resource: SpecifyResource<AnySchema>
): resource is SpecifyResource<AnyTree> =>
  f.includes(allTrees, resource.specifyTable.name);

export const treeRanksPromise = Promise.all([
  // Dynamic imports are used to prevent circular dependencies
  import('../Permissions/helpers'),
  import('../Permissions').then(async ({ fetchContext }) => fetchContext),
  import('../DataModel/tables').then(async ({ fetchContext }) => fetchContext),
  fetchDomain,
]).then(async () =>
  ajax<{
    readonly [TREE_NAME in AnyTree['tableName']]: RA<{
      readonly definition: SerializedRecord<Tables[`${TREE_NAME}TreeDef`]>;
      readonly ranks: RA<SerializedRecord<Tables[`${TREE_NAME}TreeDefItem`]>>;
    }>;
  }>('/api/specify_trees/', {
    headers: { Accept: 'application/json' },
  }).then(({ data }) => {
    const treeNames = new Set(
      Object.keys(data).map((key) => key.toLowerCase())
    );
    disciplineTrees = allTrees.filter((treeName) =>
      treeNames.has(treeName.toLowerCase())
    );

    treeDefinitions = Object.fromEntries(
      Object.entries(data).map(([treeName, information]) => [
        treeName,
        information.map(({ definition, ranks }) => ({
          definition: serializeResource(
            definition as SerializedRecord<FilterTablesByEndsWith<'TreeDef'>>
          ),
          ranks: ranks.map((rank) => serializeResource(rank)),
        })),
      ])
    );
    return treeDefinitions;
  })
);

function getTreeScope(
  treeName: AnyTree['tableName']
): keyof typeof schema['domainLevelIds'] | undefined {
  const treeRelationships = new Set(
    genericTables[`${treeName}TreeDef`].relationships.map(({ relatedTable }) =>
      relatedTable.name.toLowerCase()
    )
  );
  return Object.keys(schema.domainLevelIds).find((domainTable) =>
    treeRelationships.has(domainTable)
  );
}

export function getTreeDefinitions<TREE_NAME extends AnyTree['tableName']>(
  tableName: TREE_NAME,
  treeDefinitionId: number | 'all' | undefined = getCache(
    'tree',
    `definition${tableName}`
  )
): TreeInformation[TREE_NAME] {
  const specificTreeDefinitions = caseInsensitiveHash(
    defined(treeDefinitions),
    tableName
  );

  return typeof treeDefinitionId === 'number'
    ? specificTreeDefinitions.filter(
        ({ definition }) => definition.id === treeDefinitionId
      )
    : specificTreeDefinitions;
}

export function getTreeDefinitionItems<TREE_NAME extends AnyTree['tableName']>(
  tableName: TREE_NAME,
  includeRoot: boolean,
  treeDefinitionId: number | 'all' | undefined = getCache(
    'tree',
    `definition${tableName}`
  )
): TreeInformation[TREE_NAME][number]['ranks'] | undefined {
  const specificTreeDefinitions =
    treeDefinitions === undefined
      ? undefined
      : caseInsensitiveHash(treeDefinitions, tableName);

  return specificTreeDefinitions === undefined
    ? undefined
    : typeof treeDefinitionId === 'number'
    ? specificTreeDefinitions
        .find(({ definition }) => definition.id === treeDefinitionId)
        ?.ranks.slice(includeRoot ? 0 : 1)
    : specificTreeDefinitions.flatMap(({ ranks }) =>
        ranks.slice(includeRoot ? 0 : 1)
      );
}

export const strictGetTreeDefinitionItems = <
  TREE_NAME extends AnyTree['tableName']
>(
  tableName: TREE_NAME,
  includeRoot: boolean,
  treeDefinitionId: number | 'all' | undefined = getCache(
    'tree',
    `definition${tableName}`
  )
): TreeInformation[TREE_NAME][number]['ranks'] =>
  defined(
    getTreeDefinitionItems(tableName, includeRoot, treeDefinitionId),
    `Unable to get tree ranks for a ${tableName} table`
  );

export const exportsForTests = {
  getTreeScope,
};
