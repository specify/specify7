/**
 * Fetch back-end pick lists and define front-end pick lists
 */

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { IR, R, RA } from '../../utils/types';
import { months } from '../Atoms/Internationalization';
import { addMissingFields } from '../DataModel/addMissingFields';
import { fetchCollection } from '../DataModel/collection';
import { deserializeResource, getField } from '../DataModel/helpers';
import type { SerializedResource, TableFields } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { PickList, PickListItem, Tables } from '../DataModel/types';
import { hasToolPermission } from '../Permissions/helpers';

let pickLists: R<SpecifyResource<PickList> | undefined> = {};

// Unsafe, because pick lists might not be defined yet
export const unsafeGetPickLists = (): typeof pickLists => pickLists;

const agentTypes = [
  formsText.organization(),
  formsText.person(),
  formsText.other(),
  formsText.group(),
] as const;

const pickListTypes = [
  formsText.userDefinedItems(),
  formsText.entireTable(),
  formsText.fieldFromTable(),
] as const;

const auditLogActions = [
  commonText.create(),
  commonText.update(),
  commonText.delete(),
  queryText.treeMerge(),
  queryText.treeMove(),
  queryText.treeSynonymize(),
  queryText.treeDesynonymize(),
] as const;

const pickListSortTypes = f.store(() => [
  commonText.none(),
  getField(schema.models.PickListItem, 'title').label,
  commonText.ordinal(),
]);

export const userTypes = [
  'Manager',
  'FullAccess',
  'LimitedAccess',
  'Guest',
] as const;

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

export function definePicklist(
  name: string,
  items: RA<SerializedResource<PickListItem>>
): SpecifyResource<PickList> {
  const pickList = new schema.models.PickList.Resource(
    {},
    {
      noBusinessRules: true,
    }
  );
  pickList.set('name', name);
  pickList.set('readOnly', true);
  pickList.set('isSystem', true);
  pickList.set('type', PickListTypes.ITEMS);
  pickList.set('timestampCreated', new Date().toJSON());
  pickList.set('pickListItems', items);
  return pickList;
}

export const pickListTablesPickList = f.store(() =>
  definePicklist(
    '_TablesByName',
    Object.values(schema.models).map(({ name, label }) =>
      createPickListItem(name.toLowerCase(), label)
    )
  )
);

export const monthsPickListName = '_Months';

export const monthsPickList = f.store(() =>
  definePicklist(
    monthsPickListName,
    months.map((title, index) =>
      createPickListItem((index + 1).toString(), title)
    )
  )
);

/**
 * Create front-end only pick lists
 *
 * @remarks
 * These have to be defined inside of a function rather than globally
 * because they depend on the data model being loaded
 *
 * Since pick list names must be unique, front-end only pick lists are prefixed
 * with "_". Since these pick lists are front-end only, it is safe to rename
 * them by simply replacing the usages in code if there are any.
 *
 * If a given field has a pick list assigned to it using the schema config,
 * that pick lists would take precedence
 *
 */
export const getFrontEndPickLists = f.store<{
  readonly [TABLE_NAME in keyof Tables]?: {
    readonly [FIELD_NAME in TableFields<
      Tables[TABLE_NAME]
    >]?: SpecifyResource<PickList>;
  };
}>(() => {
  const fullNameDirection = definePicklist('_fullNameDirection', [
    createPickListItem('-1', formsText.reverse()),
    createPickListItem('1', formsText.forward()),
  ]);

  // Like pickListTablesPickList, but indexed by tableId
  const tablesPickList = definePicklist(
    '_Tables',
    Object.values(schema.models).map(({ tableId, label }) =>
      createPickListItem(tableId.toString(), label)
    )
  );

  const frontEndPickLists = {
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
      tableName: pickListTablesPickList(),
      sortType: definePicklist(
        '_PickListSortType',
        pickListSortTypes().map((title, index) =>
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
    SpAppResource: {
      mimeType: definePicklist(
        '_MimeType',
        ['application/json', 'text/xml', 'jrxml/label', 'jrxml/report'].map(
          (mimeType) => createPickListItem(mimeType, mimeType)
        )
      ).set('readOnly', false),
    },
  };

  pickLists = {
    ...pickLists,
    ...Object.fromEntries(
      Object.values(frontEndPickLists)
        .flatMap((entries) => Object.values(entries))
        .map((pickList) => [pickList.get('name'), pickList] as const)
    ),
  };

  return frontEndPickLists;
});

export const fetchPickLists = f.store(
  async (): Promise<IR<SpecifyResource<PickList> | undefined>> =>
    (hasToolPermission('pickLists', 'read')
      ? fetchCollection('PickList', {
          domainFilter: true,
          limit: 0,
        }).then(({ records }) => records)
      : Promise.resolve([])
    ).then(async (records) => {
      getFrontEndPickLists();
      pickLists = {
        ...pickLists,
        ...Object.fromEntries(
          records.map(
            (pickList) =>
              [pickList.name, deserializeResource(pickList)] as const
          )
        ),
      };
      return pickLists;
    })
);
