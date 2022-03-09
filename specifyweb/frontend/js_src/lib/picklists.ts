import { PickListTypes } from './components/combobox';
import { months } from './components/internationalization';
import type { PickList, PickListItem, Tables } from './datamodel';
import type { SerializedResource, TableFields } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import formsText from './localization/forms';
import { createPickListItem } from './picklistmixins';
import { schema } from './schema';
import type { IR, RA } from './types';

/**
 * Make sure to only use this value after calling (await fetchPickLists())
 */
export let pickLists: IR<SpecifyResource<PickList>> = [];

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
function getExtraPickLists(): RA<SpecifyResource<PickList>> {
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

  return [agentType, month, auditLogAction, tables];
}

export async function fetchPickLists(): Promise<typeof pickLists> {
  if (Object.keys(pickLists).length > 0) return pickLists;
  const collection = new schema.models.PickList.LazyCollection({
    filters: {
      domainfilter: true,
    },
  });

  return collection.fetchPromise({ limit: 0 }).then(async ({ models }) => {
    pickLists = Object.fromEntries(
      [...models, ...getExtraPickLists()].map(
        (pickList) => [pickList.get('name'), pickList] as const
      )
    );
    return pickLists;
  });
}
