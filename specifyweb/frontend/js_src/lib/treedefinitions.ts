import type { Tables } from './datamodel';
import type { AnyTree, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import { getModel } from './schema';
import schema from './schemabase';
import { defined, RA } from './types';
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

const treeScopes = {
  /* eslint-disable @typescript-eslint/naming-convention */
  Geography: 'discipline',
  GeologicTimePeriod: 'discipline',
  LithoStrat: 'discipline',
  Storage: 'institution',
  Taxon: 'discipline',
  /* eslint-enable @typescript-eslint/naming-convention */
} as const;

const commonTrees = ['geography', 'storage', 'taxon'] as const;
const treesForPaleo = ['geologictimeperiod', 'lithostrat'] as const;
const allTrees = [...commonTrees, ...treesForPaleo];
const paleoDiscs = new Set(['paleobotany', 'invertpaleo', 'vertpaleo']);
const disciplineType = getDomainResource('discipline')?.get('type');
export const disciplineTrees = [
  ...commonTrees,
  ...(paleoDiscs.has(defined(disciplineType ?? undefined))
    ? treesForPaleo
    : []),
];

export const isTreeModel = (tableName: string): boolean =>
  allTrees.includes(tableName.toLowerCase() as typeof allTrees[number]);

export const fetchContext = Promise.all(
  Object.entries(treeScopes)
    // TODO: figure out if this optimization is safe
    /*.filter(([treeName]) =>
      disciplineTrees.includes(
        treeName.toLowerCase() as typeof disciplineTrees[number]
      )
    )*/
    .map(async ([treeName, definitionLevel]) =>
      (
        getDomainResource(definitionLevel as 'discipline')
          ?.rget(`${unCapitalize(treeName) as 'geography'}TreeDef`)
          .then(async (model) =>
            Promise.all([model, model.rgetCollection('treeDefItems')])
          )
          .then(([treeDefinition, { models }]) => ({
            treeDefinition,
            ranks: Array.from(models, serializeResource).sort(
              sortFunction((item) => item.rankId)
            ),
          })) ?? Promise.resolve(undefined)
      ).then((ranks) => [treeName, ranks] as const)
    )
).then((ranks) => {
  // @ts-expect-error
  treeDefinitions = Object.fromEntries(ranks);
  return undefined;
});

export function getTreeDefinitionItems<TREE_NAME extends AnyTree['tableName']>(
  tableName: TREE_NAME,
  includeRoot: boolean
): typeof treeDefinitions[TREE_NAME]['ranks'] {
  const definition = caseInsensitiveHash(treeDefinitions, tableName);
  return definition?.ranks.slice(includeRoot ? 0 : 1);
}
