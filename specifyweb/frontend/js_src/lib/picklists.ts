import { PickListTypes } from './components/combobox';
import { months } from './components/internationalization';
import type { PickList, PickListItem, Tables } from './datamodel';
import type { SerializedResource, TableFields } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import formsText from './localization/forms';
import { createPickListItem, fetchPickListItems } from './picklistmixins';
import { schema } from './schema';
import type { RA } from './types';

/**
 * Make sure to only use this value after calling (await fetchPickLists())
 */
export let pickLists: RA<SpecifyResource<PickList>> = undefined!;

export const agentTypes = [
  formsText('organization'),
  formsText('person'),
  formsText('other'),
  formsText('group'),
] as const;

const auditLogActions = [
  formsText('insert'),
  formsText('update'),
  formsText('delete'),
  formsText('treeMerge'),
  formsText('treeMove'),
  formsText('treeSynonymize'),
  formsText('treeUnsynonymize'),
] as const;

export const frontEndPickLists: {
  readonly [TABLE_NAME in keyof Tables]?: {
    readonly [FIELD_NAME in TableFields<Tables[TABLE_NAME]>]?: string;
  };
} = {
  Preparation: {
    prepType: '_prepType',
  },
  Agent: {
    agentType: '_AgentTypeComboBox',
  },
  SpAuditLog: {
    action: '_AuditLogAction',
    tableNum: '_Tables',
    parentTableNum: '_Tables',
  },
};

function definePicklist(
  name: string,
  items: RA<SerializedResource<PickListItem>>
): SpecifyResource<PickList> {
  const pickList = new schema.models.PickList.Resource();
  pickList.set('name', name);
  pickList.set('readOnly', true);
  pickList.set('isSystem', true);
  pickList.set('type', PickListTypes.TABLE);
  pickList.set('timestampCreated', new Date().toJSON());
  pickList.set('pickListItems', items);
  return pickList;
}

/** Create front-end only pick lists */
async function fetchExtraPickLists(): Promise<RA<SpecifyResource<PickList>>> {
  const prepType = new schema.models.PickList.Resource();
  prepType.set('name', '_prepType');
  prepType.set('tableName', 'PrepType');
  prepType.set('readOnly', false);
  prepType.set('isSystem', true);
  prepType.set('type', PickListTypes.RECORDS);
  prepType.set('timestampCreated', new Date().toJSON());

  prepType.set('pickListItems', await fetchPickListItems(prepType));

  const agentType = definePicklist(
    '_AgentTypeComboBox',
    agentTypes.map((title, index) =>
      createPickListItem(index.toString(), title)
    )
  );
  const auditLogAction = definePicklist(
    '_AuditLogAction',
    auditLogActions.map((title, index) =>
      createPickListItem(index.toString(), title)
    )
  );
  const tables = definePicklist(
    '_Tables',
    Object.values(schema.models).map(({ tableId, label }) =>
      createPickListItem(tableId.toString(), label)
    )
  );
  const month = definePicklist(
    '_Months',
    months.map((title, index) =>
      createPickListItem((index + 1).toString(), title)
    )
  );

  return [prepType, agentType, month, auditLogAction, tables];
}

export async function fetchPickLists(): Promise<typeof pickLists> {
  if (Array.isArray(pickLists)) return pickLists;
  const collection = new schema.models.PickList.LazyCollection({
    filters: {
      domainfilter: true,
    },
  });

  const extraPickListsPromise = fetchExtraPickLists();

  return collection.fetchPromise({ limit: 0 }).then(async ({ models }) => {
    pickLists = [...models, ...(await extraPickListsPromise)];
    return pickLists;
  });
}
