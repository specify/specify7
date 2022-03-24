import { PickListTypes } from './components/combobox';
import { months } from './components/internationalization';
import type { PickList, PickListItem, Tables } from './datamodel';
import type { SerializedResource, TableFields } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import commonText from './localization/common';
import formsText from './localization/forms';
import { createPickListItem } from './picklistmixins';
import { schema } from './schema';
import type { IR, RA } from './types';

/**
 * Make sure to only use this value after calling (await fetchPickLists())
 */
export let pickLists: IR<SpecifyResource<PickList>> = {};

const agentTypes = [
  formsText('organization'),
  formsText('person'),
  formsText('other'),
  formsText('group'),
] as const;

const pickListTypes = [
  formsText('userDefinedItems'),
  formsText('entireTable'),
  formsText('fieldFromTable'),
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

const pickListSortTypes = [
  commonText('none'),
  commonText('title'),
  commonText('ordinal'),
];

const userTypes = ['Manager', 'FullAccess', 'LimitedAccess', 'Guest'] as const;

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

export const monthPickListName = '_Months';

let frontEndPickLists: {
  readonly [TABLE_NAME in keyof Tables]?: {
    readonly [FIELD_NAME in TableFields<
      Tables[TABLE_NAME]
    >]?: SpecifyResource<PickList>;
  };
};

export function getFrontEndPickLists(): typeof frontEndPickLists {
  if (typeof frontEndPickLists === 'undefined') defineFrontEndPickLists();
  return frontEndPickLists;
}

/**
 * Create front-end only pick lists
 *
 * @remarks
 * These have to be defined inside of a function rather than globally
 * because they depend on the data model being loaded
 *
 */
function defineFrontEndPickLists(): RA<SpecifyResource<PickList>> {
  const tablesPickList = definePicklist(
    '_Tables',
    Object.values(schema.models).map(({ tableId, label }) =>
      createPickListItem(tableId.toString(), label)
    )
  );

  const monthsPickList = definePicklist(
    monthPickListName,
    months.map((title, index) =>
      createPickListItem((index + 1).toString(), title)
    )
  );

  frontEndPickLists = {
    Agent: {
      agentType: definePicklist(
        '_AgentTypeComboBox',
        agentTypes.map((title, index) =>
          createPickListItem(index.toString(), title)
        )
      ),
    },
    SpAuditLog: {
      action: definePicklist(
        '_AuditLogAction',
        auditLogActions.map((title, index) =>
          createPickListItem(index.toString(), title)
        )
      ),
      tableNum: tablesPickList,
      parentTableNum: tablesPickList,
    },
    PickList: {
      type: definePicklist(
        '_PickListType',
        pickListTypes.map((title, index) =>
          createPickListItem(index.toString(), title)
        )
      ),
      tableName: tablesPickList,
      sortType: definePicklist(
        '_PickListSortType',
        pickListSortTypes.map((title, index) =>
          createPickListItem(index.toString(), title)
        )
      ),
    },
    SpecifyUser: {
      userType: definePicklist(
        'UserType',
        userTypes.map((title, index) =>
          createPickListItem(index.toString(), title)
        )
      ),
    },
  };

  return [
    monthsPickList,
    ...Object.values(frontEndPickLists).flatMap(Object.values),
  ];
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
      [...models, ...defineFrontEndPickLists()].map(
        (pickList) => [pickList.get('name'), pickList] as const
      )
    );
    return pickLists;
  });
}
