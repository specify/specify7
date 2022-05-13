/**
 * Fetch back-end pick lists and define front-end pick lists
 */

import { months } from './components/internationalization';
import type { PickList, PickListItem, Tables } from './datamodel';
import type { SerializedResource, TableFields } from './datamodelutils';
import { f } from './functools';
import type { SpecifyResource } from './legacytypes';
import { commonText } from './localization/common';
import { formsText } from './localization/forms';
import { hasToolPermission } from './permissions';
import { createPickListItem, PickListTypes } from './picklistmixins';
import { schema } from './schema';
import type { IR, RA } from './types';

let pickLists: IR<SpecifyResource<PickList>> = undefined!;
/** Make sure to only use this value after calling (await fetchPickLists()) */
export const getPickLists = (): typeof pickLists =>
  pickLists ?? f.error('Tried to get pick lists before fetching them') ?? {};

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
  commonText('update'),
  commonText('delete'),
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
 * Since pick list names must be unique, front-end only pick lists are prefixed
 * with "_". Since these pick lists are front-end only, it is safe to rename
 * by simply replacing the usages in code if there are any
 *
 * If a given field has a pick list assigned to it using the schema config,
 * that pick lists would take precedence
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

  const fullNameDirection = definePicklist('_fullNameDirection', [
    createPickListItem('-1', formsText('reverse')),
    createPickListItem('1', formsText('forward')),
  ]);

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
      // Like tablesPickList, but tableName is the key
      tableName: definePicklist(
        '_TablesByName',
        Object.values(schema.models).map(({ name, label }) =>
          createPickListItem(name.toLowerCase(), label)
        )
      ),
      sortType: definePicklist(
        '_PickListSortType',
        pickListSortTypes.map((title, index) =>
          createPickListItem(index.toString(), title)
        )
      ),
    },
    SpecifyUser: {
      userType: definePicklist(
        '_UserType',
        userTypes.map((title) => createPickListItem(title, title))
      ),
    },
    GeographyTreeDef: { fullNameDirection },
    GeologicTimePeriodTreeDef: { fullNameDirection },
    LithoStratTreeDef: { fullNameDirection },
    StorageTreeDef: { fullNameDirection },
    TaxonTreeDef: { fullNameDirection },
    PrepType: {
      name: definePicklist('_PrepType', [])
        .set('type', PickListTypes.FIELDS)
        .set('tableName', 'preptype')
        .set('fieldName', 'name'),
    },
  };

  return [
    monthsPickList,
    ...Object.values(frontEndPickLists).flatMap(Object.values),
  ];
}

export const fetchPickLists = f.store(
  async (): Promise<typeof pickLists> =>
    (hasToolPermission('pickLists', 'read')
      ? f.var(
          new schema.models.PickList.LazyCollection({
            filters: {
              domainfilter: true,
            },
          }),
          async (collection) => collection.fetch({ limit: 0 })
        )
      : Promise.resolve({ models: [] })
    ).then(async ({ models }) => {
      pickLists = Object.fromEntries(
        [
          /**
           * Reverse the list so that if there are duplicate names, the first
           * occurrence is used (to be consistent with the behavior in older
           * versions of Specify 7). See:
           * https://github.com/specify/specify7/issues/1572#issuecomment-1125569909
           */
          ...Array.from(models)
            .reverse()
            .map((pickList) =>
              pickList.get('type') === PickListTypes.ITEMS
                ? pickList
                : pickList.set('pickListItems', [])
            ),
          ...defineFrontEndPickLists(),
        ].map((pickList) => [pickList.get('name'), pickList] as const)
      );
      return pickLists;
    })
);
