import { PickListTypes } from './components/combobox';
import type { PickList, PickListItem } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import schema from './schema';
import type { RA } from './types';

let pickLists: RA<SerializedResource<PickList>> = undefined!;

/** Get front-end only pick lists */
async function getExtraPickLists(): Promise<RA<SerializedResource<PickList>>> {
  const collection = new schema.models.PrepType.LazyCollection({
    filters: {
      domainfilter: true,
    },
  });
  const prepTypeItems = await collection
    .fetchPromise({ limit: 0 })
    .then(({ models }) =>
      // @ts-expect-error Skipped nullable fields
      models.map<SerializedResource<PickListItem>>((model) => ({
        value: model.get('name'),
        title: model.get('name'),
        timestampCreated: new Date().toJSON(),
      }))
    );

  // @ts-expect-error Skipped nullable fields
  const prepType: SerializedResource<PickList> = {
    name: 'preptype',
    readOnly: false,
    isSystem: true,
    type: PickListTypes.TABLE,
    timestampCreated: new Date().toJSON(),
    pickListItems: prepTypeItems,
  };

  return [prepType];
}

export async function getPickLists(): Promise<typeof pickLists> {
  if (Array.isArray(pickLists)) return pickLists;
  const collection = new schema.models.PickList.LazyCollection({
    filters: {
      domainfilter: true,
    },
  });

  const extraPickListsPromise = getExtraPickLists();

  return collection.fetchPromise({ limit: 0 }).then(async ({ models }) => {
    pickLists = [
      ...models.map(serializeResource),
      ...(await extraPickListsPromise),
    ];
    return pickLists;
  });
}
