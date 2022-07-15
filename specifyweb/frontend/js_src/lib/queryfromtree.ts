import { error } from './assert';
import { queryFieldFilters } from './components/querybuilderfieldfilter';
import { createQuery } from './components/querytask';
import type { SpQuery, SpQueryField, TaxonTreeDefItem } from './datamodel';
import type { AnyTree, SerializedResource } from './datamodelutils';
import { f } from './functools';
import type { SpecifyResource } from './legacytypes';
import { hasTablePermission } from './permissionutils';
import { flippedSortTypes } from './querybuilderutils';
import { QueryFieldSpec } from './queryfieldspec';
import { getTreeModel, schema } from './schema';
import { getDomainResource } from './treedefinitions';
import type { RA, RR } from './types';
import { defined } from './types';
import { formatTreeRank } from './wbplanviewmappinghelper';
import { queryText } from './localization/query';

function makeField(
  path: string,
  options: Partial<SerializedResource<SpQueryField>>
): SpecifyResource<SpQueryField> {
  const field = QueryFieldSpec.fromPath(
    schema.models.CollectionObject.name,
    path.split('.')
  )
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
  GeologicTimePeriod: async (nodeId, rankName) =>
    f.var(await fetchPaleoPath(), (paleoPath) => [
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
    ]),
  LithoStrat: async (nodeId, rankName) =>
    f.var(await fetchPaleoPath(), (paleoPath) => [
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
    ]),
};

const fetchPaleoPath = async (): Promise<string | undefined> =>
  hasTablePermission('Discipline', 'read')
    ? {
        collectionobject: 'paleoContext',
        collectingevent: 'collectingevent.paleoContext',
        locality: 'collectingevent.locality.paleoContext',
      }[
        (await getDomainResource('discipline')?.fetch())?.get(
          'paleoContextChildTable'
        ) ?? ''
      ] ?? error('unknown paleoContext child table')
    : undefined;

/**
 * Generate a Query for fetchign Collection Objects associated with a given
 * tree node
 */
export async function queryFromTree(
  tableName: AnyTree['tableName'],
  nodeId: number
): Promise<SpecifyResource<SpQuery>> {
  const tree = defined(getTreeModel(tableName));
  const node = new tree.Resource({ id: nodeId });
  await node.fetch();

  const model = schema.models.CollectionObject;
  const query = createQuery(
    queryText(
      'treeQueryName',
      model.label,
      node.get('fullName') ?? node.get('name')
    ),
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
