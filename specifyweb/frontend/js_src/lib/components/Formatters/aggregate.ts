import { filterArray, RA } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { Collection, SpecifyModel } from '../DataModel/specifyModel';
import { fetchFormatters, format } from './dataObjFormatters';
import type { Aggregator } from './spec';
import { SpecifyResource } from '../DataModel/legacyTypes';

export async function aggregate(
  collection: RA<SpecifyResource<AnySchema>> | Collection<AnySchema>,
  aggregator?: Aggregator | string
): Promise<string> {
  const resources = Array.isArray(collection) ? collection : collection.models;
  if (resources.length === 0) return '';
  const targetTable = Array.isArray(collection)
    ? collection[0].specifyModel
    : collection.model.specifyModel;

  const { aggregators } = await fetchFormatters;

  const defaultAggregator = targetTable.getAggregator();

  const resolvedAggregator =
    (typeof aggregator === 'object'
      ? aggregator
      : aggregators.find(({ name }) => name === aggregator)) ??
    aggregators.find(({ name }) => name === defaultAggregator) ??
    aggregators.find(
      ({ table, isDefault }) => table === targetTable && isDefault
    ) ??
    aggregators.find(({ table }) => table === targetTable) ??
    autoGenerateAggregator(targetTable);

  if (!Array.isArray(collection) && !collection.isComplete())
    console.error('Collection is incomplete');

  return Promise.all(
    resources.map(async (resource) =>
      format(resource, resolvedAggregator.formatter)
    )
  ).then(
    (formatted) =>
      `${filterArray(formatted).join(resolvedAggregator.separator)}${
        resolvedAggregator.suffix ?? ''
      }}`
  );
}

const autoGenerateAggregator = (table: SpecifyModel): Aggregator => ({
  name: table.name,
  title: table.name,
  table,
  isDefault: true,
  separator: '; ',
  suffix: '',
  limit: 4,
  formatter: undefined,
  sortField: undefined,
});
