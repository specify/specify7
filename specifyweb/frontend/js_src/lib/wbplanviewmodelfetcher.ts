/*
*
* Fetches Specify data model with tree ranks, parses it and saves it to
* an object for and easier usage across wbplanview
*
* */

'use strict';

import { R } from './components/wbplanview';
import { RelationshipType } from './components/wbplanviewmapper';
import domain from './domain';
import {
  Domain as DomainType,
  Schema as SchemaType,
  SchemaModelTableField,
  SchemaModelTableRelationship,
} from './legacytypes';
import schema from './schema';
import * as cache from './wbplanviewcache';

import { getFriendlyName } from './wbplanviewhelper';
import dataModelStorage from './wbplanviewmodel';

export type DataModelFieldWritable =
  DataModelNonRelationshipWritable |
  DataModelRelationshipWritable;
export type DataModelField =
  DataModelNonRelationship |
  DataModelRelationship

interface DataModelFieldWritablePrimer {
  friendlyName: string,
  isHidden: boolean,
  isRequired: boolean,
  tableName?: string,
  type?: RelationshipType,
  foreignName?: string,
}

interface DataModelNonRelationshipWritable
  extends DataModelFieldWritablePrimer {
  isRelationship: false,
}

interface DataModelRelationshipWritable
  extends DataModelFieldWritablePrimer {
  isRelationship: true,
  tableName: string,
  type: RelationshipType,
  foreignName?: string,
}

export type DataModelNonRelationship =
  Readonly<DataModelNonRelationshipWritable>

export type DataModelRelationship = Readonly<DataModelRelationshipWritable>

type DataModelFieldsWritable = R<DataModelFieldWritable>

export type DataModelFields = Readonly<DataModelFieldsWritable>

interface DataModelTableWritable {
  tableFriendlyName: string,
  fields: DataModelFieldsWritable,
}

type DataModelTable = Readonly<DataModelTableWritable>

type DataModelTablesWritable = R<DataModelTableWritable>

export interface DataModelTables {
  readonly [tableName: string]: DataModelTable,
}

type TableRanksInline = [tableName: string, tableRanks: [string, boolean][]];

interface DataModelRanksWritable {
  // whether rank is required
  [tableName: string]: Readonly<R<boolean>>
}

export type DataModelRanks = Readonly<DataModelRanksWritable>

// a dictionary like tableName==>tableFriendlyName
type DataModelListOfTablesWritable = R<{
  tableFriendlyName: string,
  isHidden: boolean,
}>

// a dictionary like tableName==>tableFriendlyName
export type DataModelListOfTables = Readonly<DataModelListOfTablesWritable>

const fetchingParameters: {
  readonly requiredFieldsToHide: Readonly<string[]>,
  readonly tablesToRemove: Readonly<string[]>,
  readonly tableKeywordsToExclude: Readonly<string[]>,
  readonly requiredFieldsToMakeOptional: R<Readonly<string[]>>
  readonly commonBaseTables: Readonly<string[]>
  readonly fieldsToRemove: R<Readonly<string[]>>
} = {

  // all required fields are not hidden, except for these, which are made
  // not required
  requiredFieldsToHide: [
    'timestampcreated',
    'timestampmodified',
    'createdbyagent',
    'modifiedbyagent',
    'collectionmemberid',
    'rankid',
    'defintion',
    'definitionitem',
    'ordernumber',
    'isprimary',
    'ishybrid',
    'isaccepted',
    'isloanable',
    'treedef',
  ],

  tablesToRemove: [
    'definition',
    'definitionitem',
    'geographytreedef',
    'geologictimeperiodtreedef',
    'treedef',
    'lithostrattreedefitem',
    'storagetreedefitem',
    'taxontreedefitem',
    'collectingeventattr',
    'collectionobjectattr',
    ...schema.orgHierarchy.filter(tableName =>
      tableName !== 'collectionobject',
    ),
  ],

  // forbid setting any of the tables that have these keywords as base tables
  tableKeywordsToExclude: [
    'Authorization',
    'Variant',
    'Attribute',
    'Property',
    'Item',
    'Definition',
    'Pnt',
    'Type',
  ],

  requiredFieldsToMakeOptional: {
    agent: ['agenttype'],
    determination: ['iscurrent'],
    loadpreparation: ['isresolved'],
    locality: ['srclatlongunit'],
  },

  //base tables that are available by default
  commonBaseTables: [
    'accession',
    'agent',
    'borrow',
    'collectingevent',
    'collectionobject',
    'conservevent',
    'container',
    'deaccession',
    'determination',
    'dnasequence',
    'exchangein',
    'exchangeout',
    'geography',
    'gift',
    'loan',
    'locality',
    'permit',
    'preparation',
    'storage',
    'taxon',
    'treatmentevent',
  ],

  fieldsToRemove: {
    agent: ['catalogerof'],
    collectionobject: ['currentDetermination'],
    loan: [
      'totalpreps',
      'unresolvedpreps',
      'unresolveditems',
      'resolvedpreps',
      'resolveditems',
    ],
    preptype: ['isonloan'],
    token: ['preferredtaxonof'],
  },

} as const;

/* Fetches ranks for a particular table */
const fetchRanks = (
  tableName: string,  // Official table name (from the data model)
): Promise<TableRanksInline> =>
  new Promise(resolve =>
    (
      domain as DomainType
    ).getTreeDef(tableName).done(treeDefinition =>
      treeDefinition.rget('treedefitems').done(
        treeDefItems =>
          treeDefItems.fetch({limit: 0}).done(() =>
            resolve([
              // TODO: add complex logic for figuring out if
              //  rank is required or not
              tableName,
              Object.values(treeDefItems.models).map(rank =>
                [rank.get('name') as string, false],
              ),
            ]),
          ),
      ),
    ),
  );

const requiredFieldShouldBeHidden = (fieldName: string) =>
  fetchingParameters.requiredFieldsToHide.indexOf(fieldName) !== -1;

const fieldShouldBeMadeOptional = (
  tableName: string,
  fieldName: string,
) =>
  fetchingParameters.requiredFieldsToMakeOptional[
    tableName
    ]?.includes(
    fieldName,
  ) || false;

const knownRelationshipTypes: RelationshipType[] = [
  'one-to-one',
  'one-to-many',
  'many-to-one',
  'many-to-many',
];
const aliasRelationshipTypes: R<RelationshipType> = {
  'zero-to-one': 'one-to-many',
};

function handleRelationshipType(
  relationshipType: RelationshipType,
): RelationshipType {
  if (knownRelationshipTypes.indexOf(relationshipType) === -1) {
    if (relationshipType in aliasRelationshipTypes)
      return aliasRelationshipTypes[relationshipType];
    else
      throw new Error('Unknown relationship type detected');
  }
  else
    return relationshipType;
}

function handleRelationshipField(
  field: SchemaModelTableField,
  fieldData: DataModelFieldWritable,
  fieldName: string,
  hasRelationshipWithDefinition: () => void,
  hasRelationshipWithDefinitionItem: () => void,
): undefined | true {
  const relationship: SchemaModelTableRelationship =
    field as SchemaModelTableRelationship;

  let foreignName = relationship.otherSideName;
  if (typeof foreignName !== 'undefined')
    foreignName = foreignName.toLowerCase();

  const relationshipType = handleRelationshipType(relationship.type);
  const tableName = relationship.relatedModelName.toLowerCase();

  if (fieldName === 'definition') {
    hasRelationshipWithDefinition();
    return;
  }

  if (fieldName === 'definitionitem') {
    hasRelationshipWithDefinitionItem();
    return;
  }

  if (
    relationship.readOnly ||
    fetchingParameters.tablesToRemove.indexOf(tableName) !== -1
  )
    return;

  fieldData.tableName = tableName;
  fieldData.type = relationshipType;
  fieldData.foreignName = foreignName;

  return true;
}

const dataModelFetcherVersion = '4';
const cacheBucketName = 'dataModelFetcher';

const cacheGet = <T>(cacheName: string) =>
  cache.get<T>(
    cacheBucketName,
    cacheName,
    {
      version: dataModelFetcherVersion,
    },
  );

const cacheSet = <T, >(cacheName: string, cacheValue: T) =>
  cache.set(
    cacheBucketName,
    cacheName,
    cacheValue,
    {
      version: dataModelFetcherVersion,
      overwrite: true,
      priorityCommit: true,
    },
  );

/* Fetches the data model */
export default async function(): Promise<void> {
  if (typeof dataModelStorage.tables !== 'undefined')
    return;

  {

    const tables =
      cacheGet<DataModelTables>('tables');
    const listOfBaseTables =
      cacheGet<DataModelListOfTables>(
        'listOfBaseTables',
      );
    const ranks =
      cacheGet<DataModelRanks>('ranks');
    const rootRanks =
      cacheGet<R<string>>('rootRanks');

    if (
      tables &&
      listOfBaseTables &&
      ranks &&
      rootRanks
    ) {
      dataModelStorage.tables = tables;
      dataModelStorage.listOfBaseTables = listOfBaseTables;
      dataModelStorage.ranks = ranks;
      dataModelStorage.rootRanks = rootRanks;
      return;
    }
  }

  const listOfBaseTables: DataModelListOfTablesWritable = {};
  const fetchRanksQueue: Promise<TableRanksInline>[] = [];

  const tables = Object.values((
    schema as unknown as SchemaType
  ).models).reduce((
    tables,
    tableData,
  ) => {

    // @ts-ignore
    const tableName =
      tableData.longName.split('.').slice(
        -1)[0].toLowerCase();
    const tableFriendlyName = tableData.getLocalizedName();

    const fields: DataModelFieldsWritable = {};
    let hasRelationshipWithDefinition = false;
    let hasRelationshipWithDefinitionItem = false;

    if (
      tableData.system ||
      fetchingParameters.tablesToRemove.indexOf(tableName) !== -1
    )
      return tables;

    tableData.fields.some(field => {

      let fieldName = field.name;
      const friendlyName =
        field.getLocalizedName() ?? getFriendlyName(fieldName);

      fieldName = fieldName.toLowerCase();

      // remove frontend-only fields (from schemaextras.js)
      if (
        typeof fetchingParameters.fieldsToRemove[
          tableName] !== 'undefined' &&
        fetchingParameters.fieldsToRemove[tableName].indexOf(
          fieldName,
        ) !== -1
      )
        return;

      let isRequired = field.isRequired;
      let isHidden = field.isHidden() === 1;

      // required fields should not be hidden, unless they are present in
      // this list
      if (requiredFieldShouldBeHidden(fieldName)) {
        isRequired = false;
        isHidden = true;
      }
      else if (isHidden && isRequired)
        isHidden = false;

      if (fieldShouldBeMadeOptional(tableName, fieldName))
        isRequired = false;

      //@ts-ignore
      const fieldData: DataModelFieldWritable = {
        friendlyName,
        isHidden,
        isRequired,
        isRelationship: field.isRelationship,
      };

      if (
        fieldData.isRelationship &&
        !handleRelationshipField(
          field,
          fieldData,
          fieldName,
          () => {
            hasRelationshipWithDefinition = true;
          },
          () => {
            hasRelationshipWithDefinitionItem = true;
          },
        )
      )
        return;

      fields[fieldName] = fieldData;

    });

    const orderedFields = Object.fromEntries(
      Object.entries(fields).sort((
        [, {
          isRelationship,
          friendlyName,
        }],
        [, {
          isRelationship: secondIsRelationship,
          friendlyName: secondFriendlyName,
        }],
        ) =>
          isRelationship === secondIsRelationship ?
            friendlyName.localeCompare(secondFriendlyName) :
            isRelationship ?
              1 :
              -1,
      ).map(([fieldName]) =>
        [fieldName, fields[fieldName]],
      ),
    );

    if (
      !fetchingParameters.tableKeywordsToExclude.some(
        tableKeywordToExclude =>
          tableFriendlyName.indexOf(
            tableKeywordToExclude,
          ) !== -1,
      )
    )
      listOfBaseTables[tableName] = {
        tableFriendlyName,
        isHidden: fetchingParameters.commonBaseTables.indexOf(
          tableName,
        ) === -1,
      };

    tables[tableName] = {
      tableFriendlyName,
      fields: orderedFields,
    };

    if (
      hasRelationshipWithDefinition &&
      hasRelationshipWithDefinitionItem
    )
      fetchRanksQueue.push(fetchRanks(tableName));

    return tables;

  }, {} as DataModelTablesWritable);


  // remove relationships to system tables
  Object.entries(tables).forEach(([
      tableName,
      tableData,
    ]) =>
      (
        Object.entries(
          tableData.fields,
        ).filter(([, {isRelationship}]) =>
          isRelationship,
        ) as [
          fieldName: string,
          relationshipData: DataModelRelationship
        ][]
      ).filter(([, {
          tableName: relationshipTableName,
        }]) =>
        typeof tables[relationshipTableName] === 'undefined',
      ).forEach(([relationshipName]) => {
        delete tables[tableName].fields[relationshipName];
      }),
  );


  await Promise.all(fetchRanksQueue).then(resolved => {

    const rootRanks: R<string> = Object.fromEntries(
      resolved.map(([tableName], index) =>
        [tableName, resolved[index][1].shift()?.[0] || '']),
    );

    const ranks: DataModelRanks =
      Object.fromEntries(resolved.map(([
          tableName,
          tableRanks,
        ]) =>
          [tableName, Object.fromEntries(tableRanks)],
      ));

    // remove relationships from tree table fields
    resolved.forEach(([tableName]) => (
      tables[tableName].fields = Object.fromEntries(
        Object.entries(
          tables[tableName].fields,
        ).filter(([, {isRelationship}]) =>
          !isRelationship,
        ),
      )
    ));

    dataModelStorage.tables =
      cacheSet<DataModelTables>('tables', tables);
    dataModelStorage.listOfBaseTables =
      cacheSet<DataModelListOfTables>(
        'listOfBaseTables',
        listOfBaseTables,
      );
    dataModelStorage.ranks =
      cacheSet<DataModelRanks>('ranks', ranks);
    dataModelStorage.rootRanks =
      cacheSet<R<string>>(
        'rootRanks',
        rootRanks,
      );

  }).catch(error => {
    throw error;
  });

  return;

}
