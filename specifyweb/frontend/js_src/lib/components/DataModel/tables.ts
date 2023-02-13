/**
 * Fetch Specify DataModel JSON and reify it into the SpecifyTable and
 * SpecifyField objects
 */

import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import {
  defined,
  overwriteReadOnly,
  setDevelopmentGlobal,
} from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { error } from '../Errors/assert';
import { load } from '../InitialContext';
import { isTreeTable } from '../InitialContext/treeRanks';
import { formatUrl } from '../Router/queryString';
import type { AnySchema, AnyTree } from './helperTypes';
import { schemaExtras } from './schemaExtras';
import { LiteralField, Relationship } from './specifyField';
import { SpecifyTable, type TableDefinition } from './specifyTable';
import type { Agent, Tables } from './types';

export type SchemaLocalization = {
  readonly name: LocalizedString | null;
  readonly desc: LocalizedString | null;
  readonly format: string | null;
  readonly aggregator: string | null;
  readonly ishidden: boolean;
  readonly items: IR<{
    readonly name: LocalizedString | null;
    readonly desc: LocalizedString | null;
    readonly format: string | null;
    readonly picklistname: string | null;
    readonly weblinkname: string | null;
    readonly isrequired: boolean;
    readonly ishidden: boolean;
  }>;
};

const processFields = <FIELD_TYPE extends LiteralField | Relationship>(
  fields: RA<FIELD_TYPE>,
  frontEndFields: RA<FIELD_TYPE>
): RA<FIELD_TYPE> =>
  [
    ...fields,
    ...frontEndFields.map((field) => {
      field.overrides.isReadOnly = true;
      field.isVirtual = true;
      return field;
    }),
    /*
     * The sort order defined here affects the order of fields in the
     * WbPlanView, Query builder, Schema Config and all other places
     */
  ].sort(sortFunction(({ label = '' }) => label));

let schemaLocalization: IR<SchemaLocalization> = undefined!;
const fetchSchemaLocalization = f.store(async () =>
  import('../UserPreferences/helpers').then(async ({ getUserPref }) =>
    load<IR<SchemaLocalization>>(
      formatUrl('/context/schema_localization.json', {
        lang: getUserPref('form', 'schema', 'language'),
      }),
      'application/json'
    )
  )
);
export const getSchemaLocalization = (): IR<SchemaLocalization> =>
  schemaLocalization ??
  error('Accessing schema localization before fetching it');

const frontEndOnlyFields: Partial<Record<keyof Tables, RA<string>>> = {};
export const getFrontEndOnlyFields = (): Partial<
  RR<keyof Tables, RA<string>>
> => frontEndOnlyFields;

export const tables = {} as {
  readonly [TABLE_NAME in keyof Tables]: SpecifyTable<Tables[TABLE_NAME]>;
};

export const fetchContext = f
  .all({
    dataModel: load<RA<TableDefinition>>(
      '/context/datamodel.json',
      'application/json'
    ),
    localization: fetchSchemaLocalization(),
  })
  .then(({ dataModel, localization }) => {
    schemaLocalization = localization;
    dataModel
      .map((tableDefinition) => {
        const table = new SpecifyTable(tableDefinition);
        overwriteReadOnly(tables, table.name, table);
        return [tableDefinition, table] as const;
      })
      .forEach(([tableDefinition, table]) => {
        const [frontEndFields, frontEndRelationships, callback] = (
          schemaExtras[table.name] as typeof schemaExtras['Agent'] | undefined
        )?.(table as SpecifyTable<Agent>) ?? [[], []];

        overwriteReadOnly(
          table,
          'literalFields',

          processFields(
            tableDefinition.fields.map(
              (fieldDefinition) => new LiteralField(table, fieldDefinition)
            ),
            frontEndFields
          )
        );
        overwriteReadOnly(
          table,
          'relationships',
          processFields(
            tableDefinition.relationships.map(
              (relationshipDefinition) =>
                new Relationship(table, relationshipDefinition)
            ),
            frontEndRelationships
          )
        );
        overwriteReadOnly(table, 'fields', [
          ...table.literalFields,
          ...table.relationships,
        ]);
        overwriteReadOnly(
          table,
          'field',
          Object.fromEntries(table.fields.map((field) => [field.name, field]))
        );

        frontEndOnlyFields[table.name] = [
          ...frontEndFields,
          ...frontEndRelationships,
        ].map(({ name }) => name);

        callback?.();
      });
    return tables;
  });

setDevelopmentGlobal('_tables', tables);

/**
 * Returns a schema table object describing the named Specify model
 * Can wrap this function call in defined() to cast result to SpecifyTable
 */
export function getTable(name: string): SpecifyTable | undefined {
  if (
    process.env.NODE_ENV === 'development' &&
    Object.keys(tables).length === 0
  )
    throw new Error('Calling getTable() before data model is fetched');

  const lowerCase = name.toLowerCase();
  return name === ''
    ? undefined
    : tables[name as keyof Tables] ??
        Object.values(tables as unknown as IR<SpecifyTable>).find(
          (table) => table.name.toLowerCase() === lowerCase
        ) ??
        Object.values(tables as unknown as IR<SpecifyTable>).find(
          (table) => table.longName.toLowerCase() === lowerCase
        );
}

export const strictGetTable = (name: string): SpecifyTable =>
  defined(getTable(name), `Trying to get unknown table: ${name}`);

export function getTreeTable(name: string): SpecifyTable<AnyTree> | undefined {
  const table = getTable(name);
  if (typeof table === 'object' && !isTreeTable(table.name))
    throw new Error(`${name} is not a tree table`);
  return table as unknown as SpecifyTable<AnyTree> | undefined;
}

/**
 * Looks up a schema table object describing Specify model using the Specify
 * tableId integer
 */
export const getTableById = <SCHEMA extends AnySchema>(
  tableId: number
): SpecifyTable<SCHEMA> =>
  (Object.values(tables).find((table) => table.tableId === tableId) as
    | SpecifyTable<SCHEMA>
    | undefined) ?? error(`Table with id ${tableId} does not exist`);

// If this is true, then you can use {domainfilter:true} when fetching that table
export const hasHierarchyField = (table: SpecifyTable): boolean =>
  [
    'collectionObject',
    'collection',
    'discipline',
    'division',
    'institution',
  ].some((fieldName) =>
    table.relationships.some(({ name }) => name === fieldName)
  );
