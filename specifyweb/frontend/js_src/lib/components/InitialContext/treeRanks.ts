/**
 * Fetch tree definitions (and tree ranks) for all fields accessible in a
 * given discipline.
 */

import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import {
  caseInsensitiveHash,
  sortFunction,
  unCapitalize,
} from '../../utils/utils';
import { fetchRelated } from '../DataModel/collection';
import { serializeResource } from '../DataModel/helpers';
import type {
  AnySchema,
  AnyTree,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema, strictGetModel } from '../DataModel/schema';
import { fetchContext as fetchDomain } from '../DataModel/schemaBase';
import type { Tables } from '../DataModel/types';

export function getDomainResource<
  LEVEL extends keyof typeof schema.domainLevelIds
>(level: LEVEL): SpecifyResource<Tables[Capitalize<LEVEL>]> | undefined {
  const id = schema.domainLevelIds?.[level];
  if (id === undefined) {
    console.error(
      `Trying to access domain resource ${level} before domain is loaded`
    );
    return;
  }
  const model = strictGetModel(level);
  return new model.Resource({ id });
}

let treeDefinitions: {
  readonly [TREE_NAME in AnyTree['tableName']]: {
    readonly definition: SpecifyResource<Tables[`${TREE_NAME}TreeDef`]>;
    readonly ranks: RA<SerializedResource<Tables[`${TREE_NAME}TreeDefItem`]>>;
  };
} = undefined!;

const treeScopes = {
  /* eslint-disable @typescript-eslint/naming-convention */
  Geography: 'discipline',
  GeologicTimePeriod: 'discipline',
  LithoStrat: 'discipline',
  Storage: 'institution',
  Taxon: 'discipline',
  /* eslint-enable @typescript-eslint/naming-convention */
} as const;

/*
 * FEATURE: allow reordering trees
 *    See https://github.com/specify/specify7/issues/2121#issuecomment-1432158152
 */
const commonTrees = ['Geography', 'Storage', 'Taxon'] as const;
const treesForPaleo = ['GeologicTimePeriod', 'LithoStrat'] as const;
const allTrees = [...commonTrees, ...treesForPaleo] as const;
const paleoDiscs = new Set(['paleobotany', 'invertpaleo', 'vertpaleo']);
let disciplineTrees: RA<AnyTree['tableName']> = allTrees;
export const getDisciplineTrees = (): typeof disciplineTrees => disciplineTrees;

export const isTreeModel = (
  tableName: keyof Tables
): tableName is AnyTree['tableName'] => f.includes(allTrees, tableName);

export const isTreeResource = (
  resource: SpecifyResource<AnySchema>
): resource is SpecifyResource<AnyTree> =>
  f.includes(allTrees, resource.specifyModel.name);

export const treeRanksPromise = Promise.all([
  // Dynamic imports are used to prevent circular dependencies
  import('../Permissions/helpers'),
  import('../Permissions').then(async ({ fetchContext }) => fetchContext),
  import('../DataModel/schema').then(async ({ fetchContext }) => fetchContext),
  fetchDomain,
])
  .then(([{ hasTreeAccess, hasTablePermission }]) =>
    hasTablePermission('Discipline', 'read')
      ? getDomainResource('discipline')
          ?.fetch()
          .then((discipline) => {
            if (!f.has(paleoDiscs, discipline?.get('type')))
              disciplineTrees = commonTrees;
            return undefined;
          })
          .then(async () =>
            Promise.all(
              Object.entries(treeScopes)
                .filter(
                  ([treeName]) =>
                    disciplineTrees.includes(treeName) &&
                    hasTreeAccess(treeName, 'read')
                )
                .map(async ([treeName, definitionLevel]) =>
                  getDomainResource(definitionLevel as 'discipline')
                    ?.rgetPromise(
                      `${unCapitalize(treeName) as 'geography'}TreeDef`
                    )
                    .then(async (treeDefinition) => ({
                      definition: treeDefinition,
                      ranks: await fetchRelated(
                        serializeResource(treeDefinition),
                        'treeDefItems',
                        0
                      ).then(({ records }) =>
                        Array.from(records).sort(
                          sortFunction(({ rankId }) => rankId)
                        )
                      ),
                    }))
                    .then((ranks) => [treeName, ranks] as const)
                )
            )
          )
      : []
  )
  .then((ranks) => {
    // @ts-expect-error
    treeDefinitions = Object.fromEntries(ranks.filter(Boolean));
    return treeDefinitions;
  });

export function getTreeDefinitionItems<TREE_NAME extends AnyTree['tableName']>(
  tableName: TREE_NAME,
  includeRoot: boolean
): typeof treeDefinitions[TREE_NAME]['ranks'] | undefined {
  const definition = caseInsensitiveHash(treeDefinitions, tableName);
  return definition?.ranks.slice(includeRoot ? 0 : 1);
}

export const strictGetTreeDefinitionItems = <
  TREE_NAME extends AnyTree['tableName']
>(
  tableName: TREE_NAME,
  includeRoot: boolean
): typeof treeDefinitions[TREE_NAME]['ranks'] =>
  defined(
    getTreeDefinitionItems(tableName, includeRoot),
    `Unable to get tree ranks for a ${tableName} table`
  );
