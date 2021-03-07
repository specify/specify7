/*
*
* Fetches Specify data model with tree ranks, parses it and saves it to
* an object for and easier usage across wbplanview
*
* */

'use strict';

import schema from './schema';
import domain from './domain';

import { get_friendly_name } from './wbplanviewhelper';
import * as cache            from './wbplanviewcache';
import { RelationshipType }  from './components/wbplanviewmapper';
import {
  Domain as domain_type,
  Schema as schema_type,
  SchemaModelTableField,
  SchemaModelTableRelationship,
}                            from './legacy_types';
import data_model_storage    from './wbplanviewmodel';

export type DataModelFieldWritable =
  DataModelNonRelationshipWritable |
  DataModelRelationshipWritable;
export type DataModelField =
  DataModelNonRelationship |
  DataModelRelationship

interface DataModelFieldWritablePrimer {
  friendly_name: string,
  is_hidden: boolean,
  is_required: boolean,
  table_name?: string,
  type?: RelationshipType,
  foreign_name?: string,
}

export interface DataModelNonRelationshipWritable
  extends DataModelFieldWritablePrimer {
  is_relationship: false,
}

export interface DataModelRelationshipWritable
  extends DataModelFieldWritablePrimer {
  is_relationship: true,
  table_name: string,
  type: RelationshipType,
  foreign_name: string,
}

export type DataModelNonRelationship =
  Readonly<DataModelNonRelationshipWritable>

export type DataModelRelationship = Readonly<DataModelRelationshipWritable>

export type DataModelFieldsWritable = Record<string, DataModelFieldWritable>

export type DataModelFields = Readonly<DataModelFieldsWritable>

export interface DataModelTableWritable {
  table_friendly_name: string,
  fields: DataModelFieldsWritable,
}

export type DataModelTable = Readonly<DataModelTableWritable>

export type DataModelTablesWritable = Record<string, DataModelTableWritable>

export interface DataModelTables {
  readonly [table_name: string]: DataModelTable,
}

type TableRanksInline = [table_name: string, table_ranks: [string, boolean][]];

interface DataModelRanksWritable {
  // whether rank is required
  [table_name: string]: Readonly<Record<string, boolean>>
}

export type DataModelRanks = Readonly<DataModelRanksWritable>

// a dictionary like table_name==>table_friendly_name
export type DataModelListOfTablesWritable = Record<string, {
  table_friendly_name: string,
  is_hidden: boolean,
}>

// a dictionary like table_name==>table_friendly_name
export type DataModelListOfTables = Readonly<DataModelListOfTablesWritable>

export type DataModelFetcherReturn = {
  readonly tables: DataModelTables,
  readonly list_of_base_tables: DataModelListOfTables,
  readonly ranks: DataModelRanks,
}


const fetching_parameters: {
  readonly required_fields_to_hide: string[],
  readonly tables_to_hide: string[],
  readonly table_keywords_to_exclude: string[],
  readonly required_fields_to_make_optional: Record<string, string[]>
  readonly common_base_tables: string[]
} = {

  // all required fields are not hidden, except for these, which are made
  // not required
  required_fields_to_hide: [
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
  tables_to_hide: [
    'definition',
    'definitionitem',
    'geographytreedef',
    'geologictimeperiodtreedef',
    'treedef',
    ...schema.orgHierarchy.filter(table_name =>
      table_name !== 'collectionobject',
    ),
  ],

  // forbid setting any of the tables that have these keywords as base tables
  table_keywords_to_exclude: [
    'Authorization',
    'Variant',
    'Attribute',
    'Property',
    'Item',
    'Definition',
    'Pnt',
    'Type',
  ],

  required_fields_to_make_optional: {
    agent: ['agenttype'],
    determination: ['iscurrent'],
    loadpreparation: ['isresolved'],
    locality: ['srclatlongunit'],
  },

  //base tables that are available by default
  common_base_tables: [
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

};

/* Fetches ranks for a particular table */
const fetch_ranks = (
  table_name: string,  // Official table name (from the data model)
): Promise<TableRanksInline> =>
  new Promise(resolve =>
    (
      domain as domain_type
    ).getTreeDef(table_name).done(tree_definition =>
      tree_definition.rget('treedefitems').done(
        treeDefItems =>
          treeDefItems.fetch({limit: 0}).done(() =>
            resolve([
              // TODO: add complex logic for figuring out if
              //  rank is required or not
              table_name,
              Object.values(treeDefItems.models).map(rank =>
                [rank.get('name') as string, false],
              ),
            ]),
          ),
      ),
    ),
  );

const required_field_should_be_hidden = (field_name: string) =>
  fetching_parameters.required_fields_to_hide.indexOf(field_name) !== -1;

const field_should_be_made_optional = (
  table_name: string,
  field_name: string,
) =>
  fetching_parameters.required_fields_to_make_optional[
    table_name
    ]?.includes(
    field_name,
  ) || false;

const known_relationship_types: RelationshipType[] = [
  'one-to-one',
  'one-to-many',
  'many-to-one',
  'many-to-many',
];
const alias_relationship_types: Record<string, RelationshipType> = {
  'zero-to-one': 'one-to-one',
};

function handle_relationship_type(
  relationship_type: RelationshipType,
): RelationshipType {
  if (known_relationship_types.indexOf(relationship_type) === -1) {
    if (relationship_type in alias_relationship_types)
      return alias_relationship_types[relationship_type];
    else
      throw new Error('Unknown relationship type detected');
  }
  else
    return relationship_type;
}

function handle_relationship_field(
  field: SchemaModelTableField,
  field_data: DataModelFieldWritable,
  field_name: string,
  has_relationship_with_definition: () => void,
  has_relationship_with_definition_item: () => void,
): undefined | true {
  const relationship: SchemaModelTableRelationship =
    field as SchemaModelTableRelationship;

  let foreign_name = relationship.otherSideName;
  if (typeof foreign_name !== 'undefined')
    foreign_name = foreign_name.toLowerCase();

  const relationship_type = handle_relationship_type(relationship.type);
  const table_name = relationship.relatedModelName.toLowerCase();

  if (field_name === 'definition') {
    has_relationship_with_definition();
    return;
  }

  if (field_name === 'definitionitem') {
    has_relationship_with_definition_item();
    return;
  }

  if (
    relationship.readOnly ||
    fetching_parameters.tables_to_hide.indexOf(table_name) !== -1
  )
    return;

  field_data.table_name = table_name;
  field_data.type = relationship_type;
  field_data.foreign_name = foreign_name;

  return true;
}

const data_model_fetcher_version = '3';
const cache_bucket_name = 'data_model_fetcher';

const cache_get = <T>(cache_name: string) =>
  cache.get<T>(
    cache_bucket_name,
    cache_name,
    {
      version: data_model_fetcher_version,
    },
  );

const cache_set = <T, >(cache_name: string, cache_value: T) =>
  cache.set(
    cache_bucket_name,
    cache_name,
    cache_value,
    {
      version: data_model_fetcher_version,
      overwrite: true,
    },
  );

/* Fetches the data model */
export default (): Promise<void> =>
  new Promise(resolve => {

    if (typeof data_model_storage.tables !== 'undefined')
      return resolve();

    {

      const tables =
        cache_get<DataModelTables>('tables');
      const list_of_base_tables =
        cache_get<DataModelListOfTables>(
          'list_of_base_tables',
        );
      const ranks =
        cache_get<DataModelRanks>('ranks');
      const root_ranks =
        cache_get<Record<string, string>>('root_ranks');

      if (
        tables &&
        list_of_base_tables &&
        ranks &&
        root_ranks
      ) {
        data_model_storage.tables = tables;
        data_model_storage.list_of_base_tables = list_of_base_tables;
        data_model_storage.ranks = ranks;
        data_model_storage.root_ranks = root_ranks;
        return resolve();
      }
    }

    const list_of_base_tables: DataModelListOfTablesWritable = {};
    const fetch_ranks_queue: Promise<TableRanksInline>[] = [];

    const tables = Object.values((
      schema as unknown as schema_type
    ).models).reduce((
      tables,
      table_data,
    ) => {

      // @ts-ignore
      const table_name =
        table_data.longName.split('.').slice(
          -1)[0].toLowerCase();
      const table_friendly_name = table_data.getLocalizedName();

      const fields: DataModelFieldsWritable = {};
      let has_relationship_with_definition = false;
      let has_relationship_with_definition_item = false;

      if (
        table_data.system ||
        fetching_parameters.tables_to_hide.indexOf(table_name) !== -1
      )
        return tables;

      table_data.fields.some(field => {

        let field_name = field.name;
        const friendly_name =
          field.getLocalizedName() ?? get_friendly_name(field_name);

        field_name = field_name.toLowerCase();

        let is_required = field.isRequired;
        let is_hidden = field.isHidden() === 1;

        // required fields should not be hidden, unless they are present in
        // this list
        if (required_field_should_be_hidden(field_name)) {
          is_required = false;
          is_hidden = true;
        }
        else if (is_hidden && is_required)
          is_hidden = false;

        if (field_should_be_made_optional(table_name, field_name))
          is_required = false;

        //@ts-ignore
        const field_data: DataModelFieldWritable = {
          friendly_name,
          is_hidden,
          is_required,
          is_relationship: field.isRelationship,
        };

        if (
          field_data.is_relationship &&
          !handle_relationship_field(
            field,
            field_data,
            field_name,
            () => {
              has_relationship_with_definition = true;
            },
            () => {
              has_relationship_with_definition_item = true;
            },
          )
        )
          return;

        fields[field_name] = field_data;

      });

      const ordered_fields = Object.fromEntries(
        Object.entries(fields).sort((
          [, {
            is_relationship,
            friendly_name,
          }],
          [, {
            is_relationship: second_is_relationship,
            friendly_name: second_friendly_name,
          }],
          ) =>
            is_relationship === second_is_relationship ?
              friendly_name.localeCompare(second_friendly_name) :
              is_relationship ?
                1 :
                -1,
        ).map(([field_name]) =>
          [field_name, fields[field_name]],
        ),
      );

      if (
        !fetching_parameters.table_keywords_to_exclude.some(
          table_keyword_to_exclude =>
            table_friendly_name.indexOf(
              table_keyword_to_exclude,
            ) !== -1,
        )
      )
        list_of_base_tables[table_name] = {
          table_friendly_name,
          is_hidden: fetching_parameters.common_base_tables.indexOf(
            table_name,
          ) === -1,
        };

      tables[table_name] = {
        table_friendly_name,
        fields: ordered_fields,
      };

      if (
        has_relationship_with_definition &&
        has_relationship_with_definition_item
      )
        fetch_ranks_queue.push(fetch_ranks(table_name));

      return tables;

    }, {} as DataModelTablesWritable);


    // remove relationships to system tables
    Object.entries(tables).forEach(([
        table_name,
        table_data,
      ]) =>
        (
          Object.entries(
            table_data.fields,
          ).filter(([, {is_relationship}]) =>
            is_relationship,
          ) as [
            field_name: string,
            relationship_data: DataModelRelationship
          ][]
        ).filter(([, {
            table_name: relationship_table_name,
          }]) =>
          typeof tables[relationship_table_name] === 'undefined',
        ).forEach(([relationship_name]) => {
          delete tables[table_name].fields[relationship_name];
        }),
    );


    Promise.all(fetch_ranks_queue).then(resolved => {

      const root_ranks: Record<string, string> = Object.fromEntries(
        resolved.map(([table_name], index) =>
          [table_name, resolved[index][1].shift()?.[0] || '']),
      );

      const ranks: DataModelRanks =
        Object.fromEntries(resolved.map(([
            table_name,
            table_ranks,
          ]) =>
            [table_name, Object.fromEntries(table_ranks)],
        ));

      // remove relationships from tree table fields
      resolved.forEach(([table_name]) => (
        tables[table_name].fields = Object.fromEntries(
          Object.entries(
            tables[table_name].fields,
          ).filter(([, {is_relationship}]) =>
            !is_relationship,
          ),
        )
      ));

      data_model_storage.tables =
        cache_set<DataModelTables>('tables', tables);
      data_model_storage.list_of_base_tables =
        cache_set<DataModelListOfTables>(
          'list_of_base_tables',
          list_of_base_tables,
        );
      data_model_storage.ranks =
        cache_set<DataModelRanks>('ranks', ranks);
      data_model_storage.root_ranks =
        cache_set<Record<string, string>>(
          'root_ranks',
          root_ranks,
        );

      resolve();
    }).catch(error => {
      throw error;
    });

  });