/*
 *
 * Fetches Specify data model with tree ranks, parses it and saves it to
 * an object for and easier usage across wbplanview
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
import { getFriendlyName } from './wbplanviewhelper';
import dataModelStorage from './wbplanviewmodel';
import {
  aliasRelationshipTypes,
  dataModelFetcherVersion,
  fetchingParameters,
  knownRelationshipTypes,
} from './wbplanviewmodelconfig';

export type DataModelFieldWritable =
  | DataModelNonRelationshipWritable
  | DataModelRelationshipWritable;
export type DataModelField = DataModelNonRelationship | DataModelRelationship;

interface DataModelFieldWritablePrimer {
  friendlyName: string;
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

// Export type DataModelFields = Readonly<DataModelFieldsWritable>;

interface DataModelTableWritable {
  tableFriendlyName: string;
  fields: DataModelFieldsWritable;
}

type DataModelTable = Readonly<DataModelTableWritable>;

type DataModelTablesWritable = R<DataModelTableWritable>;

export type DataModelTables = IR<DataModelTable>;

export type TreeRankData = {
  readonly isRequired: boolean;
  readonly title: string;
};

type TableRanksInline = [
  tableName: string,
  tableRanks: [string, TreeRankData][]
];

// Type DataModelRanksWritable = R<R<boolean>>;

export type DataModelRanks = IR<IR<TreeRankData>>;

export type OriginalRelationships = IR<IR<RA<string>>>;
type OriginalRelationshipsWritable = R<R<string[]>>;

// A dictionary like tableName==>tableFriendlyName
type DataModelListOfTablesWritable = R<{
  tableFriendlyName: string;
  isHidden: boolean;
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
                title: rank.get('title') as string,
              },
            ]),
          ])
        )
      )
    )
  );

const requiredFieldShouldBeHidden = (fieldName: string): boolean =>
  fetchingParameters.requiredFieldsToHide.includes(fieldName);

const fieldShouldBeMadeOptional = (
  tableName: string,
  fieldName: string
): boolean =>
  fetchingParameters.requiredFieldsToMakeOptional[tableName]?.includes(
    fieldName
  ) || false;

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

  if (
    relationship.readOnly ||
    fetchingParameters.tablesToRemove.includes(tableName)
  )
    return false;

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

let cacheVersion = '';

/* Fetches the data model */
export default async function (): Promise<void> {
  if (typeof dataModelStorage.tables !== 'undefined') return;

  if (cacheVersion === '') {
    const request = await fetch('/context/collection/');
    const data = (await request.json()) as { readonly current: number };
    const currentCollection = data.current;
    cacheVersion = `${dataModelFetcherVersion}_${currentCollection}`;
  }

  {
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

  const tables = Object.values(
    (schema as unknown as SchemaType).models
  ).reduce<DataModelTablesWritable>((tables, tableData) => {
    const tableName = tableData.longName.split('.').slice(-1)[0].toLowerCase();
    const tableFriendlyName = tableData.getLocalizedName();

    const fields: DataModelFieldsWritable = {};
    let hasRelationshipWithDefinition = false;
    let hasRelationshipWithDefinitionItem = false;

    if (
      tableData.system ||
      fetchingParameters.tablesToRemove.includes(tableName)
    )
      return tables;

    tableData.fields.forEach((field) => {
      let fieldName = field.name;
      const friendlyName =
        field.getLocalizedName() ?? getFriendlyName(fieldName);

      fieldName = fieldName.toLowerCase();

      // Remove frontend-only fields (from schemaextras.js)
      if (
        typeof fetchingParameters.fieldsToRemove[tableName] !== 'undefined' &&
        fetchingParameters.fieldsToRemove[tableName].includes(fieldName)
      )
        return;

      let isRequired = field.isRequired;
      let isHidden = field.isHidden() === 1;

      /*
       * Required fields should not be hidden, unless they are present in
       * this list
       */
      if (requiredFieldShouldBeHidden(fieldName)) {
        isRequired = false;
        isHidden = true;
      } else if (isHidden && isRequired) isHidden = false;

      if (fieldShouldBeMadeOptional(tableName, fieldName)) isRequired = false;

      // @ts-expect-error
      const fieldData: DataModelFieldWritable = {
        friendlyName,
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

      fields[fieldName] = fieldData;
    });

    const orderedFields = Object.fromEntries(
      Object.entries(fields)
        .sort(
          (
            [, { isRelationship, friendlyName }],
            [
              ,
              {
                isRelationship: secondIsRelationship,
                friendlyName: secondFriendlyName,
              },
            ]
          ) =>
            isRelationship === secondIsRelationship
              ? friendlyName.localeCompare(secondFriendlyName)
              : isRelationship
              ? 1
              : -1
        )
        .map(([fieldName]) => [fieldName, fields[fieldName]])
    );

    if (
      !fetchingParameters.tableKeywordsToExclude.some((tableKeywordToExclude) =>
        tableFriendlyName.includes(tableKeywordToExclude)
      )
    )
      listOfBaseTables[tableName] = {
        tableFriendlyName,
        isHidden: !fetchingParameters.commonBaseTables.includes(tableName),
      };

    tables[tableName] = {
      tableFriendlyName,
      fields: orderedFields,
    };

    if (hasRelationshipWithDefinition && hasRelationshipWithDefinitionItem)
      fetchRanksQueue.push(fetchRanks(tableName));

    return tables;
  }, {});

  // Remove relationships to system tables
  Object.entries(tables).forEach(([tableName, tableData]) =>
    (
      Object.entries(tableData.fields).filter(
        ([, { isRelationship }]) => isRelationship
      ) as [fieldName: string, relationshipData: DataModelRelationship][]
    )
      .filter(
        ([, { tableName: relationshipTableName }]) =>
          typeof tables[relationshipTableName] === 'undefined'
      )
      .forEach(([relationshipName]) => {
        delete tables[tableName].fields[relationshipName];
      })
  );

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
          priorityCommit: true,
        }
      );
      dataModelStorage.listOfBaseTables = cache.set(
        'wbplanview-datamodel',
        'listOfBaseTables',
        listOfBaseTables,
        {
          version: cacheVersion,
          overwrite: true,
          priorityCommit: true,
        }
      );
      dataModelStorage.ranks = cache.set(
        'wbplanview-datamodel',
        'ranks',
        ranks,
        {
          version: cacheVersion,
          overwrite: true,
          priorityCommit: true,
        }
      );
      dataModelStorage.rootRanks = cache.set(
        'wbplanview-datamodel',
        'rootRanks',
        rootRanks,
        {
          version: cacheVersion,
          overwrite: true,
          priorityCommit: true,
        }
      );
      dataModelStorage.originalRelationships = cache.set(
        'wbplanview-datamodel',
        'originalRelationships',
        originalRelationships,
        {
          version: cacheVersion,
          overwrite: true,
          priorityCommit: true,
        }
      );
    })
    .catch((error) => {
      throw error;
    });
}
