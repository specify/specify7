import { error } from './assert';
import { createQuery } from './components/querytask';
import type { SpQuery, SpQueryField } from './datamodel';
import type { AnyTree, SerializedResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import { flippedSortTypes } from './querybuilderutils';
import { QueryFieldSpec } from './queryfieldspec';
import { getTreeModel, schema } from './schema';
import { getDomainResource } from './treedefinitions';
import type { RA, RR } from './types';
import { defined } from './types';
import { f } from './functools';

function makeField(
  path: string,
  options: Partial<SerializedResource<SpQueryField>>
): SpecifyResource<SpQueryField> {
  const pathArray = [schema.models.CollectionObject.name, ...path.split('.')];
  const field = QueryFieldSpec.fromPath(pathArray)
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
  (nodeId: number) => Promise<RA<SpecifyResource<SpQueryField>>>
> = {
  Taxon: async (nodeId) => [
    makeField('catalogNumber', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.taxon.fullName', {}),
    makeField('determinations.taxon.taxonId', {
      startValue: nodeId.toString(),
      isDisplay: false,
    }),
    makeField('determinations.isCurrent', {
      operStart: 6,
      isDisplay: false,
    }),
  ],
  Geography: async (nodeId) => [
    makeField('catalogNumber', {}),
    makeField('determinations.taxon.fullName', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.isCurrent', {
      isDisplay: false,
      operStart: 13,
    }),
    makeField('collectingEvent.locality.localityName', {}),
    makeField('collectingEvent.locality.geography.fullName', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('collectingEvent.locality.geography.geographyId', {
      isDisplay: false,
      startValue: nodeId.toString(),
    }),
  ],
  Storage: async (nodeId) => [
    makeField('catalogNumber', {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.taxon.fullName', {}),
    makeField('determinations.isCurrent', {
      isDisplay: false,
      operStart: 13,
    }),
    makeField('preparations.storage.fullName', {}),
    makeField('preparations.storage.storageId', {
      isDisplay: false,
      startValue: nodeId.toString(),
    }),
  ],
  GeologicTimePeriod: async (nodeId) =>
    f.var(await fetchPaleoPath(), (paleoPath) => [
      makeField('catalogNumber', {}),
      makeField('determinations.taxon.fullName', {
        sortType: flippedSortTypes.ascending,
      }),
      makeField('determinations.isCurrent', {
        isDisplay: false,
        operStart: 13,
      }),

      makeField(`${paleoPath}.chronosStrat.fullName`, {}),
      makeField(`${paleoPath}.chronosStrat.geologicTimePeriodId`, {
        isDisplay: false,
        startValue: nodeId.toString(),
      }),
    ]),
  LithoStrat: async (nodeId) =>
    f.var(await fetchPaleoPath(), (paleoPath) => [
      makeField('catalogNumber', {}),
      makeField('determinations.taxon.fullName', {
        sortType: flippedSortTypes.ascending,
      }),
      makeField('determinations.isCurrent', {
        isDisplay: false,
        operStart: 13,
      }),
      makeField(`${paleoPath}.lithoStrat.fullName`, {}),
      makeField(`${paleoPath}.lithoStrat.lithoStratId`, {
        startValue: nodeId.toString(),
        isDisplay: false,
      }),
    ]),
};

const fetchPaleoPath = async (): Promise<string> =>
  ({
    collectionobject: 'paleoContext',
    collectingevent: 'collectingevent.paleoContext',
    locality: 'collectingevent.locality.paleoContext',
  }[
    (await getDomainResource('discipline')?.fetch())?.get(
      'paleoContextChildTable'
    ) ?? ''
  ] ?? error('unknown paleoContext child table'));

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
    `${model.label} in ${node.get('fullName') ?? node.get('name')}`,
    model
  );

  query.set('fields', await defaultFields[tree.name](nodeId));

  return query;
}
