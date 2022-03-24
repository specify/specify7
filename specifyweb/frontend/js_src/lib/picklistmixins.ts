import { error } from './assert';
import type { PickListItemSimple } from './components/combobox';
import { PickListTypes } from './components/combobox';
import type { PickList, PickListItem, Tables } from './datamodel';
import type { AnySchema, SerializedResource } from './datamodelutils';
import { addMissingFields, serializeResource } from './datamodelutils';
import { format } from './dataobjformatters';
import type { SpecifyResource } from './legacytypes';
import { fetchPickLists, pickLists } from './picklists';
import { getModel } from './schema';
import { fetchRows } from './specifyapi';
import { hasHierarchyField } from './specifymodel';
import type { RA } from './types';
import { defined } from './types';
import { f, sortObjectsByKey } from './wbplanviewhelper';

export const createPickListItem = (
  // It's weird that value can be null, but that's what the data model says
  value: string | null,
  title: string
): SerializedResource<PickListItem> =>
  addMissingFields('PickListItem', {
    value: value ?? title,
    title: title ?? value,
    timestampCreated: new Date().toJSON(),
  });

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

  if (currentItems.length > 0 || type === PickListTypes.ITEMS)
    return currentItems;
  else if (type === PickListTypes.TABLE)
    items = await fetchFromTable(pickList, limit);
  else if (type === PickListTypes.FIELDS)
    items = await fetchFromField(pickList, limit);
  else error('Unknown picklist type', pickList);

  return items.map(({ value, title }) => createPickListItem(value, title));
}

export async function fetchPickList(
  pickListName: string
): Promise<undefined | SpecifyResource<PickList>> {
  const pickList = await fetchPickLists().then(() => pickLists[pickListName]);

  if (typeof pickList === 'undefined') return undefined;

  const currentItems = serializeResource(pickList).pickListItems;
  if (currentItems.length === 0)
    pickList.set('pickListItems', await fetchPickListItems(pickList));

  return pickList;
}

export const PickListSortType = {
  NO_SORT: 0,
  // Sort by "title" field
  TITLE_SORT: 1,
  // Sort by "ordinal" field
  ORDINAL_SORT: 2,
};

export const getPickListItems = (
  pickList: SpecifyResource<PickList>
): RA<{
  readonly value: string;
  readonly title: string;
}> =>
  f
    .var(serializeResource(pickList).pickListItems, (items) =>
      pickList.get('sortType') === PickListSortType.TITLE_SORT
        ? sortObjectsByKey(items, 'title')
        : pickList.get('sortType') === PickListSortType.ORDINAL_SORT
        ? sortObjectsByKey(items, 'ordinal')
        : items
    )
    .map(({ value, title }) => ({
      value: value ?? title,
      title: title ?? value,
    }));

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
