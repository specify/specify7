import { PickListTypes } from './components/combobox';
import { months } from './components/internationalization';
import type { PickList } from './datamodel';
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

/** Get front-end only pick lists */
async function fetchExtraPickLists(): Promise<RA<SpecifyResource<PickList>>> {
  const prepType = new schema.models.PickList.Resource();
  prepType.set('name', 'preptype');
  prepType.set('tableName', 'PickListItem');
  prepType.set('readOnly', false);
  prepType.set('isSystem', true);
  prepType.set('type', PickListTypes.RECORDS);
  prepType.set('timestampCreated', new Date().toJSON());

  prepType.set('pickListItems', await fetchPickListItems(prepType));

  const agentType = new schema.models.PickList.Resource();
  agentType.set('name', 'AgentTypeComboBox');
  agentType.set('readOnly', true);
  agentType.set('isSystem', true);
  agentType.set('type', PickListTypes.TABLE);
  agentType.set('timestampCreated', new Date().toJSON());
  agentType.set(
    'pickListItems',
    agentTypes.map((title, index) =>
      createPickListItem(index.toString(), title)
    )
  );

  const monthsPickList = new schema.models.PickList.Resource();
  agentType.set('name', 'MonthsComboBox');
  agentType.set('readOnly', true);
  agentType.set('isSystem', true);
  agentType.set('type', PickListTypes.TABLE);
  agentType.set('timestampCreated', new Date().toJSON());
  agentType.set(
    'pickListItems',
    months.map((title, index) =>
      createPickListItem((index + 1).toString(), title)
    )
  );

  return [prepType, agentType, monthsPickList];
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
