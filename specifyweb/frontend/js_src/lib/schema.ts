/**
 * This is a composition model that loads the Specify datamodel JSON and
 * reifies it into the objects defined in specifymodel.ts and
 * specifyfield.ts.
 */

import { error } from './assert';
import type { Agent, Tables } from './datamodel';
import type { AnySchema, AnyTree } from './datamodelutils';
import { f } from './functools';
import { load } from './initialcontext';
import { schemaBase } from './schemabase';
import { schemaExtras } from './schemaextras';
import { LiteralField, Relationship } from './specifyfield';
import { SpecifyModel, type TableDefinition } from './specifymodel';
import { isTreeModel } from './treedefinitions';
import type { IR, RA } from './types';

export type SchemaLocalization = {
  readonly name: string | null;
  readonly desc: string | null;
  readonly format: string | null;
  readonly aggregator: string | null;
  readonly ishidden: 0 | 1;
  readonly items: IR<{
    readonly name: string | null;
    readonly desc: string | null;
    readonly format: string | null;
    readonly picklistname: string | null;
    readonly weblinkname: string | null;
    readonly isrequired: boolean;
    readonly ishidden: boolean;
  }>;
};

// The schema config / localization information is loaded dynamically.
export let localization: IR<SchemaLocalization> = undefined!;

const processFields = <FIELD_TYPE extends LiteralField | Relationship>(
  fields: FIELD_TYPE[],
  frontEndFields: RA<FIELD_TYPE>
): RA<FIELD_TYPE> => [
  ...fields.sort((left, right) =>
    left.label?.localeCompare(right.label ?? '') ? 1 : -1
  ),
  ...frontEndFields.map((field) => {
    field.overrides.isReadOnly = true;
    return field;
  }),
];

export const fetchContext = import('./preferencesutils').then(
  async ({ fetchPreferences, getUserPref }) =>
    fetchPreferences
      .then(async () =>
        f.all({
          tables: load<RA<TableDefinition>>(
            '/context/datamodel.json',
            'application/json'
          ),
          data: load<IR<SchemaLocalization>>(
            `/context/schema_localization.json?lang=${getUserPref(
              'form',
              'schema',
              'language'
            )}`,
            'application/json'
          ),
        })
      )
      .then(({ tables, data }) => {
        localization = data;
        tables
          .map((tableDefinition) => {
            const model = new SpecifyModel(tableDefinition);
            // @ts-expect-error Assigning to readOnly props
            schemaBase.models[model.name] = model;
            return [tableDefinition, model] as const;
          })
          .forEach(([tableDefinition, model]) => {
            const [frontEndFields, frontEndRelationships, callback] = (
              schemaExtras[model.name] as
                | typeof schemaExtras['Agent']
                | undefined
            )?.(model as SpecifyModel<Agent>) ?? [[], []];

            model.literalFields = processFields(
              tableDefinition.fields.map(
                (fieldDefinition) => new LiteralField(model, fieldDefinition)
              ),
              frontEndFields
            );
            model.relationships = processFields(
              tableDefinition.relationships.map(
                (relationshipDefinition) =>
                  new Relationship(model, relationshipDefinition)
              ),
              frontEndRelationships
            );
            model.fields = [...model.literalFields, ...model.relationships];

            callback?.();
          });
        return schemaBase;
      })
);

export const schema = schemaBase;

// Leak schema object when in development for easier debugging
if (process.env.NODE_ENV !== 'production')
  // @ts-expect-error Creating a global value
  window._schema = schema;

/**
 * Returns a schema model object describing the named Specify model
 * Can wrap this function call in defined() to cast result to SpecifyModel
 */
export function getModel(name: string): SpecifyModel | undefined {
  const lowerCase = name.toLowerCase();
  return name === ''
    ? undefined
    : schema.models[name as keyof Tables] ??
        Object.values(schema.models as unknown as IR<SpecifyModel>).find(
          (model) => model.name.toLowerCase() === lowerCase
        );
}

export function getTreeModel(name: string): SpecifyModel<AnyTree> | undefined {
  const model = getModel(name);
  if (typeof model === 'object' && !isTreeModel(model.name))
    throw new Error('Not a tree model');
  return model as unknown as SpecifyModel<AnyTree> | undefined;
}

/**
 * Looks up a schema model object describing Specify model using the Specify
 * tableId integer
 */
export const getModelById = <SCHEMA extends AnySchema>(
  tableId: number
): SpecifyModel<SCHEMA> =>
  (Object.values(schema.models).find((model) => model.tableId === tableId) as
    | SpecifyModel<SCHEMA>
    | undefined) ?? error(`Model with id ${tableId} does not exist`);

// If this is true, then you can use {domainfilter:true} when fetching that model
export const hasHierarchyField = (model: SpecifyModel): boolean =>
  [
    'collectionObject',
    'collection',
    'discipline',
    'division',
    'institution',
  ].some((fieldName) =>
    model.relationships.some(({ name }) => name === fieldName)
  );
