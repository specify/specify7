import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
import { fetchFormatters, fetchPathAsString, format } from './formatters';
import type { Aggregator } from './spec';

export async function aggregate(
  collection: Collection<AnySchema> | RA<SpecifyResource<AnySchema>>,
  aggregator?: Aggregator | string
): Promise<string> {
  const allResources = Array.isArray(collection)
    ? collection
    : collection.models;
  if (allResources.length === 0) return '';
  const targetTable = Array.isArray(collection)
    ? collection[0].specifyTable
    : collection.table.specifyTable;

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

  const resources =
    typeof resolvedAggregator.limit === 'number' && resolvedAggregator.limit > 0
      ? allResources.slice(0, resolvedAggregator.limit)
      : allResources;

  if (!Array.isArray(collection) && !collection.isComplete())
    console.error('Collection is incomplete');

  return Promise.all(
    resources.map(async (resource) =>
      f.all({
        formatted: format(resource, resolvedAggregator.formatter),
        sortValue:
          resolvedAggregator.sortField === undefined
            ? undefined
            : fetchPathAsString(resource, resolvedAggregator.sortField),
      })
    )
  ).then((entries) => {
    const resources = Array.from(
      filterArray(
        entries.map(({ formatted, sortValue }) =>
          formatted === undefined ? undefined : { formatted, sortValue }
        )
      )
    )
      .sort(sortFunction(({ sortValue }) => sortValue))
      .map(({ formatted }) => formatted);

    return `${resources.join(resolvedAggregator.separator)}${
      resolvedAggregator.suffix ?? ''
    }`;
  });
}

const autoGenerateAggregator = (table: SpecifyTable): Aggregator => ({
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
