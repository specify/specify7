/*
 * This is a composition model that loads the Specify datamodel JSON and
 * reifies it into the objects defined in specifymodel.ts and
 * specifyfield.ts.
 */

import { error } from './assert';
import { load } from './initialcontext';
import schema from './schemabase';
import extras from './schemaextras';
import type { Field, Relationship } from './specifyfield';
import SpecifyModel, { type TableDefinition } from './specifymodel';
import type { IR, RA } from './types';
import { AnySchema } from './datamodelutils';

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

export const fetchContext = Promise.all([
  load<RA<TableDefinition>>('/context/datamodel.json', 'application/json'),
  load<IR<SchemaLocalization>>(
    '/context/schema_localization.json',
    'application/json'
  ),
] as const).then(([tables, data]) => {
  localization = data;
  // @ts-expect-error Assigning to read-only value
  schema.models = Object.fromEntries(
    tables.map((tableDefinition) => {
      const model = new SpecifyModel(tableDefinition);
      const modelFields = model.fields as (Field | Relationship)[];
      const extra = extras[model.name];
      if (typeof extra !== 'undefined') modelFields.concat(extra(model));
      return [model.name, model] as const;
    })
  );
});

export { default } from './schemabase';

// Returns a schema model object describing the named Specify model.
export function getModel(name: string): SpecifyModel | undefined {
  const lowerCase = name.toLowerCase();
  return Object.values(schema.models as unknown as IR<SpecifyModel>).find(
    (model) => model.name.toLowerCase() === lowerCase
  );
}

/*
 * Looks up a schema model object describing Specify model using the Specify
 * tableId integer.
 */
export const getModelById = <SCHEMA extends AnySchema>(
  tableId: number
): SpecifyModel<SCHEMA> =>
  (Object.values(schema.models).find((model) => model.tableId === tableId) as
    | SpecifyModel<SCHEMA>
    | undefined) ?? error(`Model with id ${tableId} does not exist`);
