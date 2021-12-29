/*
 * This is a composition model that loads the Specify datamodel JSON and
 * reifies it into the objects defined in specifymodel.ts and
 * specifyfield.ts.
 */

import { load } from './initialcontext';
import schema from './schemabase';
import extras from './schemaextras';
import type { Field, Relationship } from './specifyfield';
import SpecifyModel, { type TableDefinition } from './specifymodel';
import type { R, RA } from './types';
import { IR } from './types';
import { error } from './assert';

// The schema config / localization information is loaded dynamically.
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
export let localization: IR<SchemaLocalization> = undefined!;

const models = schema.models as R<SpecifyModel>;
export const fetchContext = Promise.all([
  load<RA<TableDefinition>>('/context/datamodel.json', 'application/json'),
  load<IR<SchemaLocalization>>(
    '/context/schema_localization.json',
    'application/json'
  ),
] as const).then(([tables, data]) => {
  localization = data;
  tables.forEach((tableDefinition) => {
    const model = new SpecifyModel(tableDefinition);
    const modelFields = model.fields as (Field | Relationship)[];
    const extra = extras[model.name];
    if (typeof extra !== 'undefined') modelFields.concat(extra(model));
    models[model.name] = model;
  });
});

export { default } from './schemabase';

// Returns a schema model object describing the named Specify model.
export function getModel(name: string): SpecifyModel {
  const lowerCase = name.toLowerCase();
  const model = Object.values(schema.models).find(
    (model) => model.name.toLowerCase() === lowerCase
  );
  if (typeof model === 'undefined')
    throw new Error(`Model ${name} does not exist`);
  return model;
}

/*
 * Looks up a schema model object describing Specify model using the Specify
 * tableId integer.
 */
export const getModelById = (tableId: number): SpecifyModel =>
  Object.values(schema.models).find((model) => model.tableId === tableId) ??
  error(`Model with id ${tableId} does not exist`);
