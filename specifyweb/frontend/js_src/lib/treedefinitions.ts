import type { Tables } from './datamodel';
import type { AnyTree, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import { fetchContext as fetchSchema, getModel, schema } from './schema';
import { fetchContext as fetchDomain } from './schemabase';
import type { RA } from './types';
import { defined } from './types';
import {
  caseInsensitiveHash,
  sortFunction,
  unCapitalize,
} from './wbplanviewhelper';

export function getDomainResource<
  LEVEL extends keyof typeof schema.domainLevelIds
>(level: LEVEL): SpecifyResource<Tables[Capitalize<LEVEL>]> | undefined {
  const id = schema.domainLevelIds[level];
  if (typeof id === 'undefined') return undefined;
  const model = defined(getModel(level));
  return new model.Resource({ id }) as SpecifyResource<
    Tables[Capitalize<LEVEL>]
  >;
}

export let treeDefinitions: {
  [TREE_NAME in AnyTree['tableName']]: {
    readonly definition: SpecifyResource<Tables[`${TREE_NAME}TreeDef`]>;
    readonly ranks: RA<SerializedResource<Tables[`${TREE_NAME}TreeDefItem`]>>;
  };
} = undefined!;

// TODO: setup mock calls for testing
export const setupForTests = () =>
  import('./tests/fixtures/treedefinitions.json').then((ranks) => {
    Object.entries(ranks).forEach(([treeName, treeRanks]) => {
      // @ts-expect-error
      treeDefinitions[treeName] = treeRanks;
    });
  });

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
export let disciplineTrees: RA<AnyTree['tableName']> = allTrees;

export const isTreeModel = (tableName: keyof Tables): boolean =>
  allTrees.includes(tableName.toLowerCase() as typeof allTrees[number]);

export const fetchContext = Promise.all([fetchSchema, fetchDomain])
  .then(() => getDomainResource('discipline')?.fetch())
  .then((discipline) => {
    if (!paleoDiscs.has(defined(discipline?.get('type') ?? undefined)))
      disciplineTrees = commonTrees;
    return undefined;
  })
  .then(async () =>
    Promise.all(
      Object.entries(treeScopes)
        // TODO: figure out if this optimization is safe:
        /*
         *.filter(([treeName]) =>
         *disciplineTrees.includes(
         *treeName.toLowerCase() as typeof disciplineTrees[number]))
         */
        .map(async ([treeName, definitionLevel]) => {
          const domainResource = getDomainResource(
            definitionLevel as 'discipline'
          );
          return typeof domainResource === 'object'
            ? domainResource
                .rgetPromise(`${unCapitalize(treeName) as 'geography'}TreeDef`)
                .then(async (model) =>
                  Promise.all([
                    model,
                    model.rgetCollection('treeDefItems', true),
                  ])
                )
                .then(([treeDefinition, { models }]) => ({
                  definition: treeDefinition,
                  ranks: Array.from(models, serializeResource).sort(
                    sortFunction((item) => item.rankId)
                  ),
                }))
                .then((ranks) => [treeName, ranks] as const)
            : undefined;
        })
    )
  )
  .then((ranks) => {
    // @ts-expect-error
    treeDefinitions = Object.fromEntries(ranks.filter(Boolean));
    return undefined;
  });

export function getTreeDefinitionItems<TREE_NAME extends AnyTree['tableName']>(
  tableName: TREE_NAME,
  includeRoot: boolean
): typeof treeDefinitions[TREE_NAME]['ranks'] {
  const definition = caseInsensitiveHash(treeDefinitions, tableName);
  return definition?.ranks.slice(includeRoot ? 0 : 1);
}
