/**
 * Fetches Specify data model with tree ranks and pick lists, parses it and
 * caches the results for easier usage across WbPlanView
 *
 * @module
 */

import ajax from './ajax';
import * as cache from './cache';
import type { RelationshipType } from './components/wbplanviewmapper';
import { Tables } from './datamodel';
import { AnyTreeDef } from './datamodelutils';
import { getTreeDef } from './domain';
import type { GetTreeDefinition } from './legacytypes';
import schema from './schema';
import type { Field, Relationship } from './specifyfield';
import systemInfo from './systeminfo';
import type { IR, R, RA, Writable } from './types';
import { camelToHuman, capitalize } from './wbplanviewhelper';
import dataModelStorage from './wbplanviewmodel';
import type {
  FieldConfigOverwrite,
  TableConfigOverwrite,
} from './wbplanviewmodelconfig';
import {
  aliasRelationshipTypes,
  dataModelFetcherVersion,
  fetchingParameters,
  knownRelationshipTypes,
} from './wbplanviewmodelconfig';

export type DataModelField = DataModelNonRelationship | DataModelRelationship;

type DataModelFieldPrimer = {
  readonly label: string;
  readonly isHidden: boolean;
  readonly isRequired: boolean;
  readonly tableName?: string;
  readonly type?: RelationshipType;
  readonly foreignName?: string;
  readonly pickList?: DataModelFieldPickList;
};

type DataModelFieldPickList = {
  readonly readOnly: boolean;
  readonly items: RA<string>;
};

type DataModelNonRelationship = DataModelFieldPrimer & {
  readonly isRelationship: false;
};

type DataModelRelationship = DataModelFieldPrimer & {
  readonly isRelationship: true;
  readonly tableName: string;
  readonly type: RelationshipType;
  readonly foreignName?: string;
};

type DataModelTable = {
  readonly label: string;
  readonly fields: R<DataModelField>;
};

export type DataModelTables = IR<DataModelTable>;

export type TreeRankData = {
  readonly isRequired: boolean;
  readonly title: string;
  readonly rankId: number;
};

type TableRanksInline = Readonly<
  [tableName: string, tableRanks: [string, TreeRankData][]]
>;

export type DataModelRanks = IR<IR<TreeRankData>>;

export type OriginalRelationships = IR<IR<RA<string>>>;
type OriginalRelationshipsWritable = R<R<string[]>>;

type DataModelListOfTablesWritable = R<{
  readonly label: string;
  readonly isHidden: boolean;
}>;

export type DataModelListOfTables = Readonly<DataModelListOfTablesWritable>;

/* Fetches ranks for a particular table */
const fetchRanks = async (tableName: keyof Tables): Promise<TableRanksInline> =>
  (getTreeDef as GetTreeDefinition<AnyTreeDef>)(tableName)
    .then(async (treeDefinition) =>
      treeDefinition.rgetCollection('treeDefItems')
    )
    .then(({ models }) => [
      tableName,
      models.map((rank) => [
        rank.get('name'),
        {
          isRequired: false,
          title: capitalize(rank.get('title') ?? rank.get('name')),
          // Union types like AnyTreeDef are not handled very well yet
          rankId: rank.get('rankId') as unknown as number,
        },
      ]),
    ]);

function handleRelationshipType(
  relationshipType: RelationshipType,
  currentTableName: string,
  relationshipName: string,
  originalRelationships: OriginalRelationshipsWritable
): RelationshipType {
  if (knownRelationshipTypes.has(relationshipType)) return relationshipType;
  else {
    if (relationshipType in aliasRelationshipTypes) {
      originalRelationships[relationshipType] ??= {};
      originalRelationships[relationshipType][currentTableName] ??= [];
      originalRelationships[relationshipType][currentTableName].push(
        relationshipName
      );
      return aliasRelationshipTypes[relationshipType];
    } else throw new Error('Unknown relationship type detected');
  }
}

function handleRelationshipField(
  field: Field | Relationship,
  fieldData: Writable<DataModelField>,
  fieldName: string,
  currentTableName: string,
  hiddenTables: Readonly<Set<string>>,
  originalRelationships: OriginalRelationshipsWritable,
  hasRelationshipWithDefinition: () => void,
  hasRelationshipWithDefinitionItem: () => void
): boolean {
  const relationship = field as Relationship;

  let foreignName = relationship.otherSideName;
  if (typeof foreignName !== 'undefined')
    foreignName = foreignName.toLowerCase();

  const tableName = relationship.relatedModelName.toLowerCase();
  const relationshipType = handleRelationshipType(
    relationship.type as RelationshipType,
    currentTableName,
    fieldName,
    originalRelationships
  );

  if (fieldName === 'definition') {
    hasRelationshipWithDefinition();
    return false;
  }

  if (fieldName === 'definitionitem') {
    hasRelationshipWithDefinitionItem();
    return false;
  }

  if (relationship.readOnly || tableHasOverwrite(tableName, 'remove'))
    return false;

  fieldData.isHidden ||= hiddenTables.has(tableName);

  fieldData.tableName = tableName;
  fieldData.type = relationshipType;
  fieldData.foreignName = foreignName;

  return true;
}

const fetchPickList = async (
  pickList: string,
  fieldData: Writable<DataModelNonRelationship>
): Promise<void> =>
  ajax<{
    readonly objects: [
      {
        readonly readonly: boolean;
        readonly picklistitems: { readonly title: string }[];
      }
    ];
  }>(`/api/specify/picklist/?name=${pickList}&limit=1&domainfilter=true`, {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(({ data: { objects } }) => {
      if (typeof objects?.[0] === 'undefined') return;

      const readOnly = objects[0].readonly;
      const items = objects[0].picklistitems.map((item) => item.title);

      fieldData.pickList = {
        readOnly,
        items,
      };
    })
    .catch((error) => {
      throw error;
    });

export const tableHasOverwrite = (
  tableName: string,
  overwriteName: TableConfigOverwrite
): boolean =>
  fetchingParameters.tableOverwrites[tableName] === overwriteName ||
  Object.entries(fetchingParameters.endsWithTableOverwrites).findIndex(
    ([label, action]) => tableName.endsWith(label) && action === overwriteName
  ) !== -1;

const fieldHasOverwrite = (
  tableName: string,
  fieldName: string,
  overwriteName: FieldConfigOverwrite
): boolean =>
  fetchingParameters.fieldOverwrites[tableName]?.[fieldName] ===
    overwriteName ||
  fetchingParameters.fieldOverwrites._common?.[fieldName] === overwriteName ||
  Object.entries(fetchingParameters.endsWithFieldOverwrites).findIndex(
    ([key, action]) => fieldName.endsWith(key) && action === overwriteName
  ) !== -1;

const schemaConfigTableIds = Object.values({
  spLocaleItemContainer: 503,
  spLocaleItem: 504,
  spLocaleItemStr: 505,
});

/**
 * Schema hash is used for wiping schema cache after schema changes
 *
 * @remarks
 * Hash is calculated by summing the total number of records in the
 * SpAuditLog table for Schema Config tables
 */
const getSchemaHash = async (): Promise<number> =>
  Promise.all(
    schemaConfigTableIds.map(async (tableNumber) =>
      ajax<{ readonly meta: { readonly total_count: number } }>(
        `/api/specify/spauditlog/?limit=1&tablenum=${tableNumber}`,
        { headers: { Accept: 'application/json' } }
      ).then(({ data: { meta } }) => meta.total_count)
    )
  ).then((counts) => counts.reduce((sum, count) => sum + count, 0));

/* Fetches the data model */
async function fetchDataModel(ignoreCache = false): Promise<void> {
  if (!ignoreCache && typeof dataModelStorage.tables !== 'undefined') return;

  if (typeof dataModelStorage.currentCollectionId === 'undefined')
    dataModelStorage.currentCollectionId = await cache.getCurrentCollectionId();

  const schemaHash = await getSchemaHash();

  const cacheVersion = [
    dataModelFetcherVersion,
    dataModelStorage.currentCollectionId,
    systemInfo.schema_version,
    schemaHash,
  ].join('_');

  if (!ignoreCache) {
    const tables = cache.get('wbPlanViewDataModel', 'tables', {
      version: cacheVersion,
    });
    const listOfBaseTables = cache.get(
      'wbPlanViewDataModel',
      'listOfBaseTables',
      { version: cacheVersion }
    );
    const ranks = cache.get('wbPlanViewDataModel', 'ranks', {
      version: cacheVersion,
    });
    const rootRanks = cache.get('wbPlanViewDataModel', 'rootRanks', {
      version: cacheVersion,
    });
    const originalRelationships = cache.get(
      'wbPlanViewDataModel',
      'originalRelationships',
      { version: cacheVersion }
    );

    if (
      typeof tables === 'object' &&
      typeof listOfBaseTables === 'object' &&
      typeof ranks === 'object' &&
      typeof rootRanks === 'object' &&
      typeof originalRelationships === 'object'
    ) {
      dataModelStorage.tables = tables;
      dataModelStorage.listOfBaseTables = listOfBaseTables;
      dataModelStorage.ranks = ranks;
      dataModelStorage.rootRanks = rootRanks;
      dataModelStorage.originalRelationships = originalRelationships;
      return;
    }
  }

  const listOfBaseTables: DataModelListOfTablesWritable = {};
  const fetchRanksQueue: Promise<TableRanksInline>[] = [];
  const fetchPickListsQueue: Promise<void>[] = [];
  const originalRelationships: OriginalRelationshipsWritable = {};

  const hiddenTables = new Set(
    Object.values(schema.models)
      .map(
        (tableData) =>
          [tableData.name.toLowerCase(), tableData.isHidden()] as const
      )
      .filter(([_tableName, isHidden]) => isHidden)
      .map(([tableName]) => tableName)
  );

  const tables = Object.values(schema.models).reduce<
    R<{
      readonly label: string;
      fields: R<DataModelField>;
    }>
  >((tables, tableData) => {
    const tableName = tableData.name.toLowerCase();
    const label = tableData.getLocalizedName();

    const fields: R<DataModelField> = {};
    let hasRelationshipWithDefinition = false;
    let hasRelationshipWithDefinitionItem = false;

    if (tableData.system || tableHasOverwrite(tableName, 'remove'))
      return tables;

    tableData.fields.forEach((field) => {
      let fieldName = field.name;
      const label = field.getLocalizedName() ?? camelToHuman(fieldName);

      fieldName = fieldName.toLowerCase();

      if (fieldHasOverwrite(tableName, fieldName, 'remove')) return;

      let isRequired = field.isRequired;
      let isHidden = field.isHidden();

      /*
       * Required fields should not be hidden, unless they are present in
       * this list
       */
      if (fieldHasOverwrite(tableName, fieldName, 'hidden')) {
        isRequired = false;
        isHidden = true;
      }
      // Un-hide required fields
      else if (isHidden && isRequired) isHidden = false;

      if (fieldHasOverwrite(tableName, fieldName, 'optional'))
        isRequired = false;

      // @ts-expect-error
      const fieldData: DataModelFieldWritable = {
        label,
        isHidden,
        isRequired,
        isRelationship: field.isRelationship,
      };

      if (!fieldData.isRelationship) {
        const pickListName = field.getPickList();
        if (pickListName !== null && typeof pickListName !== 'undefined')
          fetchPickListsQueue.push(fetchPickList(pickListName, fieldData));
      } else if (
        !handleRelationshipField(
          field,
          fieldData,
          fieldName,
          tableName,
          hiddenTables,
          originalRelationships,
          () => {
            hasRelationshipWithDefinition = true;
          },
          () => {
            hasRelationshipWithDefinitionItem = true;
          }
        )
      )
        return;

      // Turn PrepType->name into a fake picklist
      if (tableName === 'preptype' && fieldName === 'name')
        fetchPickListsQueue.push(
          fetch('/api/specify/preptype/?domainfilter=true&limit=100')
            .then(async (response) => response.json())
            .then(
              (data: { readonly objects: RA<{ readonly name: string }> }) => {
                fieldData.pickList = {
                  readOnly: false,
                  items: data.objects.map(({ name }) => name),
                };
              }
            )
            .catch(console.error)
        );

      fields[fieldName] = fieldData;
    });

    const orderedFields = Object.fromEntries(
      Object.entries(fields)
        .sort(
          (
            [, { isRelationship, label }],
            [
              ,
              {
                isRelationship: secondIsRelationship,
                label: secondFriendlyName,
              },
            ]
          ) =>
            isRelationship === secondIsRelationship
              ? label.localeCompare(secondFriendlyName)
              : isRelationship
              ? 1
              : -1
        )
        .map(([fieldName]) => [fieldName, fields[fieldName]])
    );

    if (!tableHasOverwrite(tableName, 'hidden') && !hiddenTables.has(tableName))
      listOfBaseTables[tableName] = {
        label,
        isHidden: !tableHasOverwrite(tableName, 'commonBaseTable'),
      };

    tables[tableName] = {
      label,
      fields: orderedFields,
    };

    if (hasRelationshipWithDefinition && hasRelationshipWithDefinitionItem)
      fetchRanksQueue.push(fetchRanks(tableName as keyof Tables));

    return tables;
  }, {});

  // Remove relationships to system tables
  Object.entries(tables).forEach(([tableName, tableData]) => {
    tables[tableName].fields = Object.fromEntries([
      ...Object.entries(tableData.fields).filter(
        ([, { isRelationship }]) => !isRelationship
      ),
      ...(
        Object.entries(tableData.fields).filter(
          ([, { isRelationship }]) => isRelationship
        ) as [fieldName: string, relationshipData: DataModelRelationship][]
      ).filter(
        ([, { tableName: relationshipTableName }]) =>
          typeof tables[relationshipTableName] !== 'undefined'
      ),
    ]);
  });

  await Promise.all(fetchPickListsQueue);

  await Promise.all(fetchRanksQueue)
    .then((resolved) => {
      const rootRanks: IR<[string, TreeRankData]> = Object.fromEntries(
        resolved.map(([tableName, tableRanks]) => [
          tableName,
          tableRanks.shift()!,
        ])
      );

      const ranks: DataModelRanks = Object.fromEntries(
        resolved.map(([tableName, tableRanks]) => [
          tableName,
          Object.fromEntries(tableRanks),
        ])
      );

      // Remove relationships from tree table fields
      resolved.forEach(
        ([tableName]) =>
          (tables[tableName].fields = Object.fromEntries(
            Object.entries(tables[tableName].fields).filter(
              ([, { isRelationship }]) => !isRelationship
            )
          ))
      );

      dataModelStorage.tables = cache.set(
        'wbPlanViewDataModel',
        'tables',
        tables,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.listOfBaseTables = cache.set(
        'wbPlanViewDataModel',
        'listOfBaseTables',
        listOfBaseTables,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.ranks = cache.set(
        'wbPlanViewDataModel',
        'ranks',
        ranks,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.rootRanks = cache.set(
        'wbPlanViewDataModel',
        'rootRanks',
        rootRanks,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.originalRelationships = cache.set(
        'wbPlanViewDataModel',
        'originalRelationships',
        originalRelationships,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
    })
    .catch((error) => {
      throw error;
    });
}

export const dataModelPromise = fetchDataModel().then(() => dataModelStorage);
