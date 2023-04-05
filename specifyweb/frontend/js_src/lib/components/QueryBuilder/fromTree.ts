import { queryText } from '../../localization/query';
import type { IR, RA, RR } from '../../utils/types';
import { defined } from '../../utils/types';
import type { AnyTree, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getTreeModel, schema } from '../DataModel/schema';
import type {
  SpQuery,
  SpQueryField,
  Tables,
  TaxonTreeDefItem,
} from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { getDomainResource } from '../InitialContext/treeRanks';
import { hasTablePermission } from '../Permissions/helpers';
import { formatTreeRank } from '../WbPlanView/mappingHelpers';
import { queryFieldFilters } from './FieldFilter';
import { QueryFieldSpec } from './fieldSpec';
import { flippedSortTypes } from './helpers';
import { createQuery } from './index';

export function makeQueryField(
  tableName: keyof Tables,
  path: string,
  options: Partial<SerializedResource<SpQueryField>>
): SpecifyResource<SpQueryField> {
  const field = QueryFieldSpec.fromPath(tableName, path.split('.'))
    .toSpQueryField()
    .set('sortType', flippedSortTypes.none);

  Object.entries(options).forEach(([key, value]) =>
    field.set(
      key as keyof SpQueryField['fields'],
      (value as string | undefined) ?? null
    )
  );

  return field;
}

const makeField = (
  path: string,
  options: Partial<SerializedResource<SpQueryField>>
): SpecifyResource<SpQueryField> =>
  makeQueryField('CollectionObject', path, options);

const defaultFields: RR<
  AnyTree['tableName'],
  (
    nodeId: number,
    rankName: string
  ) => Promise<RA<SpecifyResource<SpQueryField>>>
> = {
  Taxon: async (nodeId, rankName) => [
    makeField('catalogNumber', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.taxon.fullName', {}),
    makeField(`determinations.taxon.${rankName}.taxonId`, {
      operStart: queryFieldFilters.equal.id,
      startValue: nodeId.toString(),
      isDisplay: false,
    }),
    makeField('determinations.isCurrent', {
      operStart: queryFieldFilters.trueOrNull.id,
      isDisplay: false,
    }),
  ],
  Geography: async (nodeId, rankName) => [
    makeField('catalogNumber', {}),
    makeField('determinations.taxon.fullName', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.isCurrent', {
      isDisplay: false,
      operStart: queryFieldFilters.trueOrNull.id,
    }),
    makeField('collectingEvent.locality.localityName', {}),
    makeField('collectingEvent.locality.geography.fullName', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField(`collectingEvent.locality.geography.${rankName}.geographyId`, {
      isDisplay: false,
      operStart: queryFieldFilters.equal.id,
      startValue: nodeId.toString(),
    }),
  ],
  Storage: async (nodeId, rankId) => [
    makeField('catalogNumber', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.taxon.fullName', {}),
    makeField('determinations.isCurrent', {
      isDisplay: false,
      operStart: queryFieldFilters.trueOrNull.id,
    }),
    makeField('preparations.storage.fullName', {}),
    makeField(`preparations.storage.${rankId}.storageId`, {
      isDisplay: false,
      operStart: queryFieldFilters.equal.id,
      startValue: nodeId.toString(),
    }),
  ],
  async GeologicTimePeriod(nodeId, rankName) {
    const paleoPath = await fetchPaleoPath();
    return [
      makeField('catalogNumber', {}),
      makeField('determinations.taxon.fullName', {
        sortType: flippedSortTypes.ascending,
      }),
      makeField('determinations.isCurrent', {
        isDisplay: false,
        operStart: queryFieldFilters.trueOrNull.id,
      }),

      ...(typeof paleoPath === 'string'
        ? [
            makeField(`${paleoPath}.chronosStrat.fullName`, {}),
            makeField(
              `${paleoPath}.chronosStrat.${rankName}.geologicTimePeriodId`,
              {
                isDisplay: false,
                operStart: queryFieldFilters.equal.id,
                startValue: nodeId.toString(),
              }
            ),
          ]
        : []),
    ];
  },
  async LithoStrat(nodeId, rankName) {
    const paleoPath = await fetchPaleoPath();
    return [
      makeField('catalogNumber', {}),
      makeField('determinations.taxon.fullName', {
        sortType: flippedSortTypes.ascending,
      }),
      makeField('determinations.isCurrent', {
        isDisplay: false,
        operStart: queryFieldFilters.trueOrNull.id,
      }),
      ...(typeof paleoPath === 'string'
        ? [
            makeField(`${paleoPath}.lithoStrat.fullName`, {}),
            makeField(`${paleoPath}.lithoStrat.${rankName}.lithoStratId`, {
              operStart: queryFieldFilters.equal.id,
              startValue: nodeId.toString(),
              isDisplay: false,
            }),
          ]
        : []),
    ];
  },
};

async function fetchPaleoPath(): Promise<string | undefined> {
  if (!hasTablePermission('Discipline', 'read')) return undefined;
  const paths: IR<string> = {
    collectionobject: 'paleoContext',
    collectingevent: 'collectingevent.paleoContext',
    locality: 'collectingevent.locality.paleoContext',
  };
  const paleoContextTable =
    (await getDomainResource('discipline')?.fetch())?.get(
      'paleoContextChildTable'
    ) ?? '';
  const paleoPath = paths[paleoContextTable];
  if (paleoPath === undefined)
    softFail(new Error('unknown paleoContext child table'));
  return paleoPath;
}

/**
 * Generate a Query for fetchign Collection Objects associated with a given
 * tree node
 */
export async function queryFromTree(
  tableName: AnyTree['tableName'],
  nodeId: number
): Promise<SpecifyResource<SpQuery>> {
  const tree = defined(
    getTreeModel(tableName),
    `Unable to contract a tree query from the ${tableName} model`
  );
  const node = new tree.Resource({ id: nodeId });
  await node.fetch();

  const model = schema.models.CollectionObject;
  const query = createQuery(
    queryText.treeQueryName({
      tableName: model.label,
      nodeFullName: node.get('fullName') ?? node.get('name'),
    }),
    model
  );

  const rank: SpecifyResource<TaxonTreeDefItem> = await node.rgetPromise(
    'definitionItem'
  );
  query.set(
    'fields',
    await defaultFields[tree.name](
      nodeId,
      formatTreeRank(rank.get('name') ?? rank.get('title'))
    )
  );

  return query;
}
