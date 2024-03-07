/**
 * Pick list item fetching code
 */

import { f } from '../../utils/functools';
import type { R, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { sortFunction, toLowerCase } from '../../utils/utils';
import { fetchCollection, fetchRows } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import { strictGetTable } from '../DataModel/tables';
import type { PickList, PickListItem, Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { format } from '../Formatters/formatters';
import type { PickListItemSimple } from '../FormFields/ComboBox';
import { getCollectionPref } from '../InitialContext/remotePrefs';
import { hasTablePermission, hasToolPermission } from '../Permissions/helpers';
import {
  createPickListItem,
  getFrontEndPickLists,
  PickListTypes,
  unsafeGetPickLists,
} from './definitions';

const pickListFetchPromises: R<Promise<SpecifyResource<PickList> | undefined>> =
  {};

export async function fetchPickList(
  pickListName: string
): Promise<SpecifyResource<PickList> | undefined> {
  pickListFetchPromises[pickListName] ??= unsafeFetchPickList(pickListName);
  return pickListFetchPromises[pickListName];
}

async function unsafeFetchPickList(
  pickListName: string
): Promise<SpecifyResource<PickList> | undefined> {
  getFrontEndPickLists();

  let pickList: SpecifyResource<PickList> | undefined =
    unsafeGetPickLists()[pickListName];
  if (pickList === undefined) {
    if (
      pickListName in unsafeGetPickLists() &&
      unsafeGetPickLists()[pickListName] === undefined
    )
      // Pick list does not exist
      return undefined;
    if (!hasToolPermission('pickLists', 'read')) return undefined;
    pickList = await rawFetchPickList(pickListName, true);
    if (pickList === undefined)
      pickList = await rawFetchPickList(pickListName, false);
    unsafeGetPickLists()[pickListName] = pickList;
  }

  if (pickList === undefined) return undefined;

  pickList.set('pickListItems', await fetchPickListItems(pickList));

  return pickList;
}

const rawFetchPickList = async (
  name: string,
  domainFilter: boolean
): Promise<SpecifyResource<PickList> | undefined> =>
  fetchCollection('PickList', {
    name,
    limit: 1,
    domainFilter,
  }).then(({ records }) => f.maybe(records[0], deserializeResource));

async function fetchPickListItems(
  pickList: SpecifyResource<PickList>
): Promise<RA<SerializedResource<PickListItem>>> {
  const type = (pickList?.get('type') as 0 | 1 | 2 | undefined) ?? 0;
  let items;

  const limit = Math.max(
    0,
    pickList.get('readOnly') ? pickList.get('sizeLimit') ?? 0 : 0
  );

  if (type === PickListTypes.TABLE)
    items = await fetchFromTable(pickList, limit);
  else if (type === PickListTypes.FIELDS)
    items = await fetchFromField(pickList, limit);
  else {
    if (type !== PickListTypes.ITEMS)
      softFail(new Error('Unknown picklist type'), { pickList });
    return serializeResource(pickList).pickListItems ?? [];
  }

  return items.map(({ value, title }) => createPickListItem(value, title));
}

export const PickListSortType = {
  NO_SORT: 0,
  // Sort by "title" field
  TITLE_SORT: 1,
  // Sort by "ordinal" field
  ORDINAL_SORT: 2,
};

/** From the table picklist */
async function fetchFromTable(
  pickList: SpecifyResource<PickList>,
  limit: number
): Promise<RA<PickListItemSimple>> {
  const tableName = strictGetTable(pickList.get('tableName')).name;
  if (!hasTablePermission(tableName, 'read')) return [];

  const scopeTablePicklist = getCollectionPref(
    'sp7_scope_table_picklists',
    schema.domainLevelIds.collection
  );

  const { records } = await fetchCollection(tableName, {
    domainFilter: scopeTablePicklist
      ? true
      : !f.includes(Object.keys(schema.domainLevelIds), toLowerCase(tableName)),
    limit,
  });
  return Promise.all(
    records.map(async (record) =>
      format(
        deserializeResource(record),
        pickList.get('formatter') ?? undefined,
        true
      ).then((title) => ({
        value: record.id.toString(),
        title,
      }))
    )
  );
}

/** From the field picklist */
async function fetchFromField(
  pickList: SpecifyResource<PickList>,
  limit: number
): Promise<RA<PickListItemSimple>> {
  const tableName = defined(
    pickList.get('tableName') ?? undefined,
    'Unable to fetch pick list item as pick list table is not set'
  );
  const fieldName = defined(
    pickList.get('fieldName') ?? undefined,
    'Unable to fetch pick list items as pick list field is not set'
  );
  return fetchRows(tableName as keyof Tables, {
    limit,
    fields: { [fieldName]: ['string', 'number', 'boolean', 'null'] },
    distinct: true,
    domainFilter: true,
  }).then((rows) =>
    rows
      .map((row) => row[fieldName] ?? '')
      .map((value) => ({ value, title: value }))
  );
}

/*
 * TEST: make sure pick lists items are sorted properly everywhere (i.e, in the
 *   workbench)
 * Sort pick list items and extract value and title fields
 */
export function getPickListItems(pickList: SpecifyResource<PickList>): RA<{
  readonly value: string;
  readonly title: string;
}> {
  const items = serializeResource(pickList).pickListItems;
  return (
    pickList.get('sortType') === PickListSortType.TITLE_SORT
      ? Array.from(items).sort(sortFunction(({ title }) => title))
      : pickList.get('sortType') === PickListSortType.ORDINAL_SORT
      ? Array.from(items).sort(sortFunction(({ ordinal }) => ordinal))
      : items
  ).map(({ value, title }) => ({
    value: value ?? title,
    title: title ?? value,
  }));
}

export const exportsForTests = {
  unsafeFetchPickList,
  fetchPickListItems,
};
