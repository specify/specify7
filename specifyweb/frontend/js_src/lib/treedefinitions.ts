/**
 * Fetch tree definitions (and tree ranks) for all fields accessible in a
 * given discipline.
 */

import { fetchRelated } from './collection';
import type { Tables } from './datamodel';
import type { AnySchema, AnyTree, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import { f } from './functools';
import { caseInsensitiveHash, sortFunction, unCapitalize } from './helpers';
import type { SpecifyResource } from './legacytypes';
import { getModel, schema } from './schema';
import { fetchContext as fetchDomain } from './schemabase';
import type { RA } from './types';
import { defined } from './types';

export const getDomainResource = <
  LEVEL extends keyof typeof schema.domainLevelIds
>(
  level: LEVEL
): SpecifyResource<Tables[Capitalize<LEVEL>]> | undefined =>
  f.maybe(schema.domainLevelIds[level], (id) =>
    f.var(defined(getModel(level)), (model) => new model.Resource({ id }))
  );

let treeDefinitions: {
  [TREE_NAME in AnyTree['tableName']]: {
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
  import('./permissions').then(
    async ({ fetchContext, hasTreeAccess, hasTablePermission }) =>
      fetchContext.then(() => ({ hasTreeAccess, hasTablePermission }))
  ),
  import('./schema').then(async ({ fetchContext }) => fetchContext),
  fetchDomain,
])
  .then(([{ hasTreeAccess, hasTablePermission }]) =>
    hasTablePermission('Discipline', 'read')
      ? getDomainResource('discipline')
          ?.fetch()
          .then((discipline) => {
            if (!paleoDiscs.has(defined(discipline?.get('type') ?? undefined)))
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
