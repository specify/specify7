/**
 * This is a composition model that loads the Specify datamodel JSON and
 * reifies it into the objects defined in specifymodel.ts and
 * specifyfield.ts.
 */

import { error } from '../Errors/assert';
import type { Agent, Tables } from './types';
import { f } from '../../utils/functools';
import { sortFunction } from '../../utils/utils';
import { load } from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import { schemaBase } from './schemaBase';
import { schemaExtras } from './schemaExtras';
import { LiteralField, Relationship } from './specifyField';
import { SpecifyModel, type TableDefinition } from './specifyModel';
import { isTreeModel } from '../InitialContext/treeRanks';
import type { IR, RA, RR } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { AnySchema, AnyTree } from './helperTypes';

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

const processFields = <FIELD_TYPE extends LiteralField | Relationship>(
  fields: RA<FIELD_TYPE>,
  frontEndFields: RA<FIELD_TYPE>
): RA<FIELD_TYPE> =>
  [
    ...fields,
    ...frontEndFields.map((field) => {
      field.overrides.isReadOnly = true;
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

export const fetchContext = f
  .all({
    tables: load<RA<TableDefinition>>(
      '/context/datamodel.json',
      'application/json'
    ),
    localization: fetchSchemaLocalization(),
  })
  .then(({ tables, localization }) => {
    schemaLocalization = localization;
    tables
      .map((tableDefinition) => {
        const model = new SpecifyModel(tableDefinition);
        overwriteReadOnly(schemaBase.models, model.name, model);
        return [tableDefinition, model] as const;
      })
      .forEach(([tableDefinition, model]) => {
        const [frontEndFields, frontEndRelationships, callback] = (
          schemaExtras[model.name] as typeof schemaExtras['Agent'] | undefined
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

        frontEndOnlyFields[model.name] = [
          ...frontEndFields,
          ...frontEndRelationships,
        ].map(({ name }) => name);

        callback?.();
      });
    return schemaBase;
  });

export const schema = schemaBase;

// Leak schema object when in development for easier debugging
if (process.env.NODE_ENV !== 'production')
  // @ts-expect-error Creating a global value
  globalThis._schema = schema;

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
