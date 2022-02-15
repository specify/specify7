import { error } from './assert';
import type { PickListItemSimple } from './components/combobox';
import { PickListTypes } from './components/combobox';
import type { PickList, PickListItem, Tables } from './datamodel';
import type { AnySchema, SerializedResource } from './datamodelutils';
import { serializeResource } from './datamodelutils';
import { format } from './dataobjformatters';
import type { SpecifyResource } from './legacytypes';
import { fetchPickLists } from './picklists';
import { getModel, schema } from './schema';
import { hasHierarchyField } from './specifymodel';
import type { RA } from './types';
import { defined } from './types';
import { fetchRows } from './specifyapi';

export function createPickListItem(
  // It's weird that value can be null, but that's what data model says
  value: string | null,
  title: string
): SerializedResource<PickListItem> {
  const pickListItemUrl = new schema.models.PickListItem.Resource().url();

  // @ts-expect-error Nullable fields are skipped
  return {
    value: value ?? title,
    title: title ?? value,
    timestampCreated: new Date().toJSON(),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    resource_uri: pickListItemUrl,
  };
}

export async function fetchPickListItems(
  pickList: SpecifyResource<PickList>
): Promise<RA<SerializedResource<PickListItem>>> {
  const type = (pickList?.get('type') as 0 | 1 | 2 | undefined) ?? 0;
  const currentItems = serializeResource(pickList).pickListItems ?? [];
  let items;

  const limit = Math.max(
    0,
    pickList.get('readOnly') ? pickList.get('sizeLimit') : 0
  );

  // Items in PickListItems table
  if (currentItems.length > 0 || type === PickListTypes.TABLE)
    return currentItems;
  // Items are objects from a table
  else if (type === PickListTypes.RECORDS)
    items = await fetchFromTable(pickList, limit);
  // Items are fields from a table
  else if (type === PickListTypes.FIELDS)
    items = await fetchFromField(pickList, limit);
  else error('Unknown picklist type', pickList);

  return items.map(({ value, title }) => createPickListItem(value, title));
}

export async function fetchPickList(
  pickListName: string
): Promise<undefined | SpecifyResource<PickList>> {
  const pickList = await fetchPickLists().then((pickLists) =>
    pickLists.find((item) => item.get('name') === pickListName)
  );

  if (typeof pickList === 'undefined') return undefined;

  const currentItems = serializeResource(pickList).pickListItems;
  if (currentItems.length === 0)
    pickList.set('pickListItems', await fetchPickListItems(pickList));

  return pickList;
}

/** From table picklist */
async function fetchFromTable(
  pickList: SpecifyResource<PickList>,
  limit: number
): Promise<RA<PickListItemSimple>> {
  const model = defined(getModel(pickList.get('tableName')));
  const collection = new model.LazyCollection({
    domainfilter: hasHierarchyField(model),
  });
  return collection.fetchPromise({ limit }).then(async ({ models }) =>
    Promise.all(
      models.map(async (model) =>
        format(model, pickList.get('formatter') ?? undefined).then((title) => ({
          value: model.url(),
          title: title ?? model.url(),
        }))
      )
    )
  );
}

/** From field picklist */
async function fetchFromField(
  pickList: SpecifyResource<PickList>,
  limit: number
): Promise<RA<PickListItemSimple>> {
  return fetchRows<AnySchema>(
    defined(pickList.get('tableName') ?? undefined) as keyof Tables,
    {
      limit,
      fields: [pickList.get('fieldName') ?? ''],
      distinct: true,
    }
  ).then((rows) =>
    rows.map((row) => row[0] ?? '').map((value) => ({ value, title: value }))
  );
}
