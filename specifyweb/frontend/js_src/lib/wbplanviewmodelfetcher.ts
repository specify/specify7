/*
 *
 * Fetches Specify data model with tree ranks, parses it and saves it to
 * an object for easier usage across wbplanview
 *
 *
 */

import * as cache from './cache';
import type { IR, R, RA } from './components/wbplanview';
import type { RelationshipType } from './components/wbplanviewmapper';
import domain from './domain';
import type {
  Domain as DomainType,
  Schema as SchemaType,
  SchemaModelTableField,
  SchemaModelTableRelationship,
} from './legacytypes';
import schema from './schema';
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
import systemInfo from './systeminfo';

export type DataModelFieldWritable =
  | DataModelNonRelationshipWritable
  | DataModelRelationshipWritable;
export type DataModelField = DataModelNonRelationship | DataModelRelationship;

interface DataModelFieldWritablePrimer {
  label: string;
  isHidden: boolean;
  isRequired: boolean;
  tableName?: string;
  type?: RelationshipType;
  foreignName?: string;
  pickList?: DataModelFieldPickList;
}

interface DataModelFieldPickList {
  readonly readOnly: boolean;
  readonly items: RA<string>;
}

interface DataModelNonRelationshipWritable
  extends DataModelFieldWritablePrimer {
  isRelationship: false;
}

interface DataModelRelationshipWritable extends DataModelFieldWritablePrimer {
  isRelationship: true;
  tableName: string;
  type: RelationshipType;
  foreignName?: string;
}

export type DataModelNonRelationship =
  Readonly<DataModelNonRelationshipWritable>;

export type DataModelRelationship = Readonly<DataModelRelationshipWritable>;

type DataModelFieldsWritable = R<DataModelFieldWritable>;

interface DataModelTableWritable {
  label: string;
  fields: DataModelFieldsWritable;
}

type DataModelTable = Readonly<DataModelTableWritable>;

type DataModelTablesWritable = R<DataModelTableWritable>;

export type DataModelTables = IR<DataModelTable>;

export type TreeRankData = {
  readonly isRequired: boolean;
  readonly title: string;
  readonly rankId: number;
};

type TableRanksInline = [
  tableName: string,
  tableRanks: [string, TreeRankData][]
];

export type DataModelRanks = IR<IR<TreeRankData>>;

export type OriginalRelationships = IR<IR<RA<string>>>;
type OriginalRelationshipsWritable = R<R<string[]>>;

type DataModelListOfTablesWritable = R<{
  readonly label: string;
  readonly isHidden: boolean;
}>;

export type DataModelListOfTables = Readonly<DataModelListOfTablesWritable>;

/* Fetches ranks for a particular table */
const fetchRanks = async (tableName: string): Promise<TableRanksInline> =>
  new Promise((resolve) =>
    (domain as DomainType).getTreeDef(tableName).done((treeDefinition) =>
      treeDefinition.rget('treedefitems').done((treeDefItems) =>
        treeDefItems.fetch({ limit: 0 }).done(() =>
          resolve([
            tableName,
            Object.values(treeDefItems.models).map((rank) => [
              rank.get('name') as string,
              {
                isRequired: false,
                title: capitalize(
                  (rank.get('title') ?? rank.get('name')) as string
                ),
                rankId: rank.get('rankId') as number,
              },
            ]),
          ])
        )
      )
    )
  );

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
  field: SchemaModelTableField,
  fieldData: DataModelFieldWritable,
  fieldName: string,
  currentTableName: string,
  hiddenTables: Readonly<Set<string>>,
  originalRelationships: OriginalRelationshipsWritable,
  hasRelationshipWithDefinition: () => void,
  hasRelationshipWithDefinitionItem: () => void
): boolean {
  const relationship: SchemaModelTableRelationship =
    field as SchemaModelTableRelationship;

  let foreignName = relationship.otherSideName;
  if (typeof foreignName !== 'undefined')
    foreignName = foreignName.toLowerCase();

  const tableName = relationship.relatedModelName.toLowerCase();
  const relationshipType = handleRelationshipType(
    relationship.type,
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
  fieldData: DataModelNonRelationshipWritable
): Promise<void> =>
  fetch(`/api/specify/picklist/?name=${pickList}&limit=1&domainfilter=true`)
    .then(async (response) => response.json())
    .then(
      (response: {
        readonly objects: [
          {
            readonly readonly: boolean;
            readonly picklistitems: { readonly title: string }[];
          }
        ];
      }) => {
        if (typeof response?.objects?.[0] === 'undefined') return;

        const readOnly = response.objects[0].readonly;
        const items = response.objects[0].picklistitems.map(
          (item) => item.title
        );

        fieldData.pickList = {
          readOnly,
          items,
        };
      }
    )
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
    schemaConfigTableIds.map((tableNum) =>
      fetch(`/api/specify/spauditlog/?limit=1&tablenum=${tableNum}`)
        .then<{ readonly meta: { readonly total_count: number } }>((response) =>
          response.json()
        )
        .then(({ meta }) => meta.total_count)
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
    const tables = cache.get('wbplanview-datamodel', 'tables', {
      version: cacheVersion,
    });
    const listOfBaseTables = cache.get(
      'wbplanview-datamodel',
      'listOfBaseTables',
      { version: cacheVersion }
    );
    const ranks = cache.get('wbplanview-datamodel', 'ranks', {
      version: cacheVersion,
    });
    const rootRanks = cache.get('wbplanview-datamodel', 'rootRanks', {
      version: cacheVersion,
    });
    const originalRelationships = cache.get(
      'wbplanview-datamodel',
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

  const getTableName = (tableData: SchemaType['models'][string]): string =>
    tableData.longName.split('.').slice(-1)[0].toLowerCase();
  const hiddenTables = new Set(
    Object.values((schema as unknown as SchemaType).models)
      .map<Readonly<[string, boolean]>>((tableData) => [
        getTableName(tableData),
        tableData.isHidden(),
      ])
      .filter(([_tableName, isHidden]) => isHidden)
      .map(([tableName]) => tableName)
  );

  const tables = Object.values(
    (schema as unknown as SchemaType).models
  ).reduce<DataModelTablesWritable>((tables, tableData) => {
    const tableName = getTableName(tableData);
    const label = tableData.getLocalizedName();

    const fields: DataModelFieldsWritable = {};
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
      let isHidden = field.isHidden() === 1;

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

      if (tableName === 'preptype' && fieldName === 'name')
        fetchPickListsQueue.push(
          new Promise(
            (resolve) =>
              void fetch('/api/specify/preptype/?domainfilter=true&limit=100')
                .then(async (response) => response.json())
                .then(
                  (data: {
                    readonly objects: RA<{ readonly name: string }>;
                  }) => {
                    fieldData.pickList = {
                      readOnly: false,
                      items: data.objects.map(({ name }) => name),
                    };
                    resolve();
                  }
                )
                .catch(console.error)
          )
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
      fetchRanksQueue.push(fetchRanks(tableName));

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
        'wbplanview-datamodel',
        'tables',
        tables,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.listOfBaseTables = cache.set(
        'wbplanview-datamodel',
        'listOfBaseTables',
        listOfBaseTables,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.ranks = cache.set(
        'wbplanview-datamodel',
        'ranks',
        ranks,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.rootRanks = cache.set(
        'wbplanview-datamodel',
        'rootRanks',
        rootRanks,
        {
          version: cacheVersion,
          overwrite: true,
        }
      );
      dataModelStorage.originalRelationships = cache.set(
        'wbplanview-datamodel',
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
