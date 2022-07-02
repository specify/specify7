/**
 * Pick list item fetching code
 */

import { error } from './assert';
import type { PickListItemSimple } from './components/combobox';
import type { PickList, PickListItem, Tables } from './datamodel';
import type { AnySchema, SerializedResource } from './datamodelutils';
import { addMissingFields, serializeResource } from './datamodelutils';
import { format } from './dataobjformatters';
import { f } from './functools';
import { sortFunction, toLowerCase } from './helpers';
import type { SpecifyResource } from './legacytypes';
import { hasTablePermission } from './permissions';
import { fetchPickLists } from './picklists';
import { getModel, schema } from './schema';
import { fetchRows } from './specifyapi';
import type { RA } from './types';
import { defined } from './types';

export const PickListTypes = {
  // Items are defined in the PickListItems table
  ITEMS: 0,
  // Items are defined from formatted rows in some table
  TABLE: 1,
  // Items are defined from a column in some table
  FIELDS: 2,
} as const;

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
    pickList.get('readOnly') ? pickList.get('sizeLimit') ?? 0 : 0
  );

  if (currentItems.length > 0 || type === PickListTypes.ITEMS)
    return currentItems;
  else if (type === PickListTypes.TABLE)
    items = await fetchFromTable(pickList, limit);
  else if (type === PickListTypes.FIELDS)
    items = await fetchFromField(pickList, limit);
  else error('Unknown picklist type', { pickList });

  return items.map(({ value, title }) => createPickListItem(value, title));
}

export async function fetchPickList(
  pickListName: string
): Promise<undefined | SpecifyResource<PickList>> {
  const pickList = await fetchPickLists().then(
    (pickLists) => pickLists[pickListName]
  );

  if (pickList === undefined) return undefined;

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

/*
 * TODO: make sure pick lists items are sorted properly everywhere (i.e, in the
 *   workbench)
 */
export const getPickListItems = (
  pickList: SpecifyResource<PickList>
): RA<{
  readonly value: string;
  readonly title: string;
}> =>
  f
    .var(serializeResource(pickList).pickListItems, (items) =>
      pickList.get('sortType') === PickListSortType.TITLE_SORT
        ? Array.from(items).sort(sortFunction(({ title }) => title))
        : pickList.get('sortType') === PickListSortType.ORDINAL_SORT
        ? Array.from(items).sort(sortFunction(({ ordinal }) => ordinal))
        : items
    )
    .map(({ value, title }) => ({
      value: value ?? title,
      title: title ?? value,
    }));

/** From the table picklist */
async function fetchFromTable(
  pickList: SpecifyResource<PickList>,
  limit: number
): Promise<RA<PickListItemSimple>> {
  const model = defined(getModel(pickList.get('tableName')));
  if (!hasTablePermission(model.name, 'read')) return [];
  const collection = new model.LazyCollection({
    domainfilter: !f.includes(
      Object.keys(schema.domainLevelIds),
      toLowerCase(model.name)
    ),
  });
  return collection.fetch({ limit }).then(async ({ models }) =>
    Promise.all(
      models.map(async (model) =>
        format(model, pickList.get('formatter') ?? undefined, true).then(
          (title) => ({
            value: model.url(),
            title: title ?? model.url(),
          })
        )
      )
    )
  );
}

/** From the field picklist */
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
