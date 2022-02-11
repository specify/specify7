import { error } from './assert';
import { createQuery } from './components/querytask';
import type { SpQuery, SpQueryField } from './datamodel';
import type { AnyTree, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import { flippedSortTypes } from './querybuilderutils';
import { QueryFieldSpec } from './queryfieldspec';
import { getModel, schema } from './schema';
import type { SpecifyModel } from './specifymodel';
import { getDomainResource } from './treedefinitions';
import type { RA, RR } from './types';
import { defined } from './types';

const getPaleoPath = (): string =>
  ({
    collectionobject: 'paleoContext',
    collectingevent: 'collectingevent.paleoContext',
    locality: 'collectingevent.locality.paleoContext',
  }[getDomainResource('discipline')?.get('paleoContextChildTable') ?? ''] ??
  error('unknown paleoContext child table'));

function makeField(
  path: string,
  rankName: string | undefined,
  options: Partial<SerializedResource<SpQueryField>>
): SpecifyResource<SpQueryField> {
  const pathArray = [schema.models.CollectionObject.name, ...path.split('.')];
  const fieldSpec = QueryFieldSpec.fromPath(pathArray);
  fieldSpec.treeRank =
    typeof rankName === 'string' ? [rankName, 'id'] : undefined;

  const attributes = fieldSpec.toSpQueryAttributes();
  const field = new schema.models.SpQueryField.Resource()
    .set('sortType', flippedSortTypes.none)
    .set('isDisplay', true)
    .set('isNot', false)
    .set('startValue', '')
    .set('operStart', 1)
    .set('tableList', attributes.tableList)
    .set('stringId', attributes.stringId)
    .set('fieldName', attributes.fieldName)
    .set('isRelFld', attributes.isRelFld);

  Object.entries(options).forEach(([key, value]) =>
    field.set(key as keyof SpQueryField['fields'], value ?? null)
  );

  return field;
}

const defaultFields: RR<
  AnyTree['tableName'],
  (nodeId: number, rankName: string) => RA<SpecifyResource<SpQueryField>>
> = {
  Taxon: (nodeId, rankName) => [
    makeField('catalogNumber', undefined, {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.taxon.fullName', undefined, {}),
    makeField('determinations.taxon', rankName, {
      startValue: nodeId.toString(),
      isDisplay: false,
    }),
    makeField('determinations.isCurrent', undefined, {
      operStart: 6,
      isDisplay: false,
    }),
  ],
  Geography: (nodeId, rankName) => [
    makeField('catalogNumber', undefined, {}),
    makeField('determinations.taxon.fullName', undefined, {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.isCurrent', undefined, {
      isDisplay: false,
      operStart: 13,
    }),
    makeField('collectingEvent.locality.localityName', undefined, {}),
    makeField('collectingEvent.locality.geography.fullName', undefined, {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('collectingEvent.locality.geography', rankName, {
      isDisplay: false,
      startValue: nodeId.toString(),
    }),
  ],
  Storage: (nodeId, rankName) => [
    makeField('catalogNumber', undefined, {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.taxon.fullName', undefined, {}),
    makeField('determinations.isCurrent', undefined, {
      isDisplay: false,
      operStart: 13,
    }),
    makeField('preparations.storage.fullName', undefined, {}),
    makeField('preparations.storage', rankName, {
      isDisplay: false,
      startValue: nodeId.toString(),
    }),
  ],
  GeologicTimePeriod: (nodeId, rankName) => [
    makeField('catalogNumber', undefined, {}),
    makeField('determinations.taxon.fullName', undefined, {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.isCurrent', undefined, {
      isDisplay: false,
      operStart: 13,
    }),

    makeField(`${getPaleoPath()}.chronosStrat.fullName`, undefined, {}),
    makeField(`${getPaleoPath()}.chronosStrat`, rankName, {
      isDisplay: false,
      startValue: nodeId.toString(),
    }),
  ],
  LithoStrat: (nodeId, rankName) => [
    makeField('catalogNumber', undefined, {}),
    makeField('determinations.taxon.fullName', undefined, {
      sortType: flippedSortTypes.ascending,
    }),
    makeField('determinations.isCurrent', undefined, {
      isDisplay: false,
      operStart: 13,
    }),
    makeField(`${getPaleoPath()}.lithoStrat.fullName`, undefined, {}),
    makeField(`${getPaleoPath()}.lithoStrat`, rankName, {
      startValue: nodeId.toString(),
      isDisplay: false,
    }),
  ],
};

export async function queryFromTree(
  tableName: AnyTree['tableName'],
  nodeId: number
): Promise<SpecifyResource<SpQuery>> {
  const tree = defined(getModel(tableName)) as unknown as SpecifyModel<AnyTree>;
  const node = new tree.Resource({ id: nodeId });
  await node.fetchIfNotPopulated();
  const treeDefinitionItem = await node.rgetPromise('definitionItem', true);

  const model = schema.models.CollectionObject;
  const query = createQuery(
    `${model.getLocalizedName()} in ${
      node.get('fullName') ?? node.get('name')
    }`,
    model as unknown as SpecifyModel
  );

  query.set(
    'fields',
    defaultFields[tree.name](nodeId, treeDefinitionItem.get('name')).map(
      serializeResource
    )
  );

  return query;
}
