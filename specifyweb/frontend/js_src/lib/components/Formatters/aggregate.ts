import { filterArray, RA } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { Collection, SpecifyModel } from '../DataModel/specifyModel';
import { fetchFormatters, format } from './dataObjFormatters';
import type { Aggregator } from './spec';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { f } from '../../utils/functools';
import { sortFunction } from '../../utils/utils';
import { fetchDistantRelated } from '../DataModel/helpers';
import { LiteralField, Relationship } from '../DataModel/specifyField';

export async function aggregate(
  collection: RA<SpecifyResource<AnySchema>> | Collection<AnySchema>,
  aggregator?: Aggregator | string
): Promise<string> {
  const allResources = Array.isArray(collection)
    ? collection
    : collection.models;
  if (allResources.length === 0) return '';
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

  const resources =
    typeof resolvedAggregator.limit === 'number' && resolvedAggregator.limit > 0
      ? allResources.slice(0, resolvedAggregator.limit)
      : allResources;

  if (!Array.isArray(collection) && !collection.isComplete())
    console.error('Collection is incomplete');

  return Promise.all(
    resources.map((resource) =>
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

/**
 * Climb the resource along the path, and convert the final result to a string
 * (either using formatter, aggregator or toString())
 */
export const fetchPathAsString = (
  resource: SpecifyResource<AnySchema>,
  field: RA<LiteralField | Relationship>
): Promise<string | undefined> =>
  fetchDistantRelated(resource, field).then(async (data) => {
    if (
      data === undefined ||
      data.field === undefined ||
      data.resource === undefined
    )
      return undefined;
    const { field, resource } = data;
    if (field.isRelationship) {
      const related = await resource.rgetPromise(field.name);
      if (typeof related === 'object' && related !== null)
        return format(related);
      else return undefined;
    } else return (resource.get(field.name) as number)?.toString() ?? undefined;
  });

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
