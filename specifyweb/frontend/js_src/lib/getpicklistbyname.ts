import type { PickList } from './datamodel';
import type { SpecifyResource } from './legacytypes';
import schema from './schema';

export async function getPickListByName(
  pickListName: string
): Promise<SpecifyResource<PickList>> {
  const collection = new schema.models.PickList.LazyCollection({
    filters: { name: pickListName },
    domainfilter: true,
  });
  return collection.fetch({ limit: 1 }).then(({ models }) => models[0]);
}
