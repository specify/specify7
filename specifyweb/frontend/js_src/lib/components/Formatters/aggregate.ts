import { Collection, SpecifyModel } from '../DataModel/specifyModel';
import { AnySchema } from '../DataModel/helperTypes';
import { filterArray } from '../../utils/types';
import { Aggregator } from './spec';
import { fetchFormatters, format } from './dataObjFormatters';

export async function aggregate(
  collection: Collection<AnySchema>,
  aggregatorName?: string
): Promise<string> {
  const { aggregators } = await fetchFormatters;

  const defaultAggregator = collection.model.specifyModel.getAggregator();

  const aggregator =
    aggregators.find(({ name }) => name === aggregatorName) ??
    aggregators.find(({ name }) => name === defaultAggregator) ??
    aggregators.find(
      ({ tableName, isDefault }) =>
        tableName === collection.model.specifyModel.name && isDefault
    ) ??
    aggregators.find(
      ({ tableName }) => tableName === collection.model.specifyModel.name
    ) ??
    autoGenerateAggregator(collection.model.specifyModel);

  if (!collection.isComplete()) console.error('Collection is incomplete');

  return Promise.all(
    collection.models.map(async (resource) =>
      format(resource, aggregator.formatterName)
    )
  ).then((formatted) => filterArray(formatted).join(aggregator.separator));
}

const autoGenerateAggregator = (model: SpecifyModel): Aggregator => ({
  name: model.name,
  title: model.name,
  tableName: model.name,
  isDefault: true,
  separator: '; ',
  ending: '',
  limit: 4,
  formatterName: undefined,
  sortField: undefined,
});
